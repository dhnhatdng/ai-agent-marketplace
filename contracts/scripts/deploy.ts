import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n🚀 Deploying AgentEscrow...");
  console.log("Deployer:", deployer.address);

  const USDC = "0x3600000000000000000000000000000000000000";
  const OPERATOR = deployer.address;   // Operator defaults to deployer wallet
  const FEE_RECIPIENT = deployer.address;

  const AgentEscrow = await ethers.getContractFactory("AgentEscrow");
  const escrow = await AgentEscrow.deploy(USDC, OPERATOR, FEE_RECIPIENT);
  await escrow.waitForDeployment();

  const addr = await escrow.getAddress();
  console.log("✅ AgentEscrow deployed:", addr);
  console.log("   Explorer:", `https://testnet.arcscan.app/address/${addr}`);

  // Save constants to backend and frontend
  const output = {
    agentEscrow: addr,
    usdc: USDC,
    chainId: 5042002,
    deployedAt: new Date().toISOString(),
  };

  const backendPath = path.join(__dirname, "../../backend/src/constants/contracts.json");
  const frontendPath = path.join(__dirname, "../../frontend/src/constants/contracts.json");

  fs.mkdirSync(path.dirname(backendPath), { recursive: true });
  fs.mkdirSync(path.dirname(frontendPath), { recursive: true });
  fs.writeFileSync(backendPath, JSON.stringify(output, null, 2));
  fs.writeFileSync(frontendPath, JSON.stringify(output, null, 2));

  console.log("\n📋 Saved constants to backend and frontend.");
}

main().catch((e) => { console.error(e); process.exit(1); });
