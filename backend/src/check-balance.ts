import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(__dirname, "../.env") });

const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network");
const privateKey = (process.env.DEPLOYER_PRIVATE_KEY || "").trim();

async function check() {
  if (!privateKey) {
    console.error("No private key configured.");
    return;
  }
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Wallet address:", wallet.address);

  // 1. Get native balance (which is USDC on Arc Network)
  const nativeBal = await provider.getBalance(wallet.address);
  console.log(`Native balance (USDC on Arc): ${ethers.formatUnits(nativeBal, 18)} native units`);
  
  // 2. Check ERC20 USDC balance
  const USDC_ABI = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
  const usdcAddress = "0x3600000000000000000000000000000000000000";
  const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, provider);
  try {
    const erc20Bal = await usdcContract.balanceOf(wallet.address);
    const decimals = await usdcContract.decimals();
    console.log(`ERC20 USDC Balance: ${ethers.formatUnits(erc20Bal, decimals)} USDC`);
  } catch (err: any) {
    console.error("Failed to fetch ERC20 USDC balance:", err.message);
  }
}

check();
