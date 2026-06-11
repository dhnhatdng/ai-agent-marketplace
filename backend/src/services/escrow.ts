import { ethers, keccak256, toUtf8Bytes } from "ethers";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Ensure environment variables are loaded immediately (resolves ESM hoisting order bugs)
dotenv.config({ path: path.join(__dirname, "../../.env"), override: true });


// Load contract addresses safely
let contracts: { agentEscrow: string } = { agentEscrow: "" };
const possiblePaths = [
  path.join(__dirname, "../constants/contracts.json"), // ts-node local
  path.join(__dirname, "../../src/constants/contracts.json"), // dist running on Render referencing src
  path.join(process.cwd(), "src/constants/contracts.json"), // process cwd path
  path.join(process.cwd(), "backend/src/constants/contracts.json") // fallback
];

let contractsPath = "";
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    contractsPath = p;
    break;
  }
}

if (contractsPath) {
  try {
    contracts = JSON.parse(fs.readFileSync(contractsPath, "utf-8"));
    console.log(`Loaded contracts from: ${contractsPath}`);
  } catch (e) {
    console.error("Error loading contracts.json:", e);
  }
} else {
  console.warn("⚠️ Could not find contracts.json in any of the expected paths!");
}

const ESCROW_ABI = [
  "function lockFunds(bytes32 taskId, address agentWallet, uint256 amount) external",
  "function completeTask(bytes32 taskId, bytes32 resultHash) external",
  "function cancelTaskByOperator(bytes32 taskId) external",
  "function getTask(bytes32 taskId) external view returns (tuple(bytes32,address,address,uint256,uint8,uint256,uint256,bytes32))",
  "event TaskCreated(bytes32 indexed taskId, address indexed client, address indexed agentWallet, uint256 amount)",
  "event TaskCompleted(bytes32 indexed taskId, address indexed agentWallet, uint256 amount)",
];

const rpcUrl = (process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network").trim();
let privateKey = (process.env.DEPLOYER_PRIVATE_KEY || "").trim();
if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
  privateKey = privateKey.slice(1, -1).trim();
}

const isMockBlockchain = 
  !privateKey || 
  privateKey.includes("your_metamask") || 
  !contracts.agentEscrow || 
  contracts.agentEscrow === "0x5FbDB2315678afecb367f032d93F642f64180aa3";

let provider: ethers.JsonRpcProvider | null = null;
let operatorWallet: ethers.Wallet | null = null;
let escrowContract: ethers.Contract | null = null;

if (!isMockBlockchain) {
  try {
    provider = new ethers.JsonRpcProvider(rpcUrl);
    operatorWallet = new ethers.Wallet(privateKey, provider);
    escrowContract = new ethers.Contract(contracts.agentEscrow, ESCROW_ABI, operatorWallet);
    console.log(`⛓️ Escrow Service connected to Arc Testnet. Contract: ${contracts.agentEscrow}`);
  } catch (error: any) {
    console.error("⚠️ Failed to initialize on-chain Escrow service:", error.message);
    console.log("➡️ Falling back to Mock Blockchain mode.");
  }
} else {
  console.log("⚠️ Escrow Service running in MOCK Blockchain mode (contracts not deployed or key missing).");
}

/**
 * Tạo taskId bytes32 từ UUID string
 */
export function taskIdToBytes32(taskId: string): string {
  return keccak256(toUtf8Bytes(taskId));
}

/**
 * Lấy phí gas động từ mạng lưới Arc Testnet hoặc fallback
 */
async function getDynamicGasOptions(): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
  try {
    if (provider) {
      const feeData = await provider.getFeeData();
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        // Tăng thêm 15% cho maxFeePerGas để giao dịch được ưu tiên và không bị kẹt
        const adjustedMaxFee = (feeData.maxFeePerGas * 115n) / 100n;
        return {
          maxFeePerGas: adjustedMaxFee,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        };
      }
    }
  } catch (error: any) {
    console.warn("⚠️ Failed to fetch dynamic gas fee data, falling back to defaults:", error.message);
  }
  
  return {
    maxFeePerGas: ethers.parseUnits("25", 9), // 25 Gwei
    maxPriorityFeePerGas: ethers.parseUnits("1.5", 9), // 1.5 Gwei
  };
}

/**
 * Operator hoàn thành task onchain → release USDC cho agent
 */
export async function completeTaskOnChain(
  taskId: string,
  aiResult: string
): Promise<string> {
  if (isMockBlockchain || !escrowContract) {
    console.log(`[MOCK Blockchain] Escrow release triggered for Task ID: ${taskId}`);
    return `mock-blockchain-tx-${uuidv4()}`;
  }

  const taskIdBytes32 = taskIdToBytes32(taskId);
  const resultHash = keccak256(toUtf8Bytes(aiResult));

  const maxRetries = 3;
  let delayMs = 2000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`⛓️ [On-chain attempt ${attempt}/${maxRetries}] Sending completeTask...`);
      const gasOptions = await getDynamicGasOptions();
      console.log(`   Dynamic gas: maxFeePerGas=${ethers.formatUnits(gasOptions.maxFeePerGas, 9)} Gwei, maxPriorityFeePerGas=${ethers.formatUnits(gasOptions.maxPriorityFeePerGas, 9)} Gwei`);
      
      const tx = await escrowContract.completeTask(taskIdBytes32, resultHash, gasOptions);
      console.log(`   Tx sent: ${tx.hash}. Waiting for confirmation...`);
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error(`   ❌ Attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`   🔄 Retrying in ${delayMs / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
  throw new Error("Transaction execution failed after maximum retries");
}

/**
 * Lắng nghe event TaskCreated từ contract (polling mỗi 5 giây)
 */
export function listenForNewTasks(
  callback: (taskIdHex: string, client: string, agentWallet: string, amount: bigint) => void
) {
  if (isMockBlockchain || !escrowContract) {
    console.log("👂 [MOCK Blockchain] Listening for task events bypassed (Using API direct trigger).");
    return;
  }
  
  console.log("👂 Listening for TaskCreated events on Arc Testnet...");
  escrowContract.on("TaskCreated", (taskId, client, agentWallet, amount) => {
    console.log(`📥 New task detected on-chain: ${taskId}`);
    callback(taskId, client, agentWallet, amount);
  });
}

/**
 * Operator hủy task onchain → hoàn tiền USDC cho client ngay lập tức
 */
export async function refundTaskOnChain(taskId: string): Promise<string> {
  if (isMockBlockchain || !escrowContract) {
    console.log(`[MOCK Blockchain] Escrow refund triggered for Task ID: ${taskId}`);
    return `mock-blockchain-tx-${uuidv4()}`;
  }

  const taskIdBytes32 = taskIdToBytes32(taskId);

  const maxRetries = 3;
  let delayMs = 2000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`⛓️ [On-chain attempt ${attempt}/${maxRetries}] Sending cancelTaskByOperator...`);
      const gasOptions = await getDynamicGasOptions();
      console.log(`   Dynamic gas: maxFeePerGas=${ethers.formatUnits(gasOptions.maxFeePerGas, 9)} Gwei, maxPriorityFeePerGas=${ethers.formatUnits(gasOptions.maxPriorityFeePerGas, 9)} Gwei`);

      const tx = await escrowContract.cancelTaskByOperator(taskIdBytes32, gasOptions);
      console.log(`   Tx sent: ${tx.hash}. Waiting for confirmation...`);
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error(`   ❌ Attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`   🔄 Retrying in ${delayMs / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
  throw new Error("Transaction execution failed after maximum retries");
}

export { escrowContract, provider };
