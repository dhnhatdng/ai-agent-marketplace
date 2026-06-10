import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
import { ethers } from "ethers";
import * as path from "path";
import * as dotenv from "dotenv";

// Ensure environment variables are loaded immediately (resolves ESM hoisting order bugs)
dotenv.config({ path: path.join(__dirname, "../../.env"), override: true });

import { getDB } from "../db/database";


const API_KEY = process.env.CIRCLE_API_KEY || "";
const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET || "";
const PUBLIC_KEY = process.env.CIRCLE_PUBLIC_KEY || "";

const BASE_URL = "https://api.circle.com/v1/w3s";

const headers = {
  "Authorization": `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

// Check if we need to run in mock mode
const isMockMode = 
  !API_KEY || 
  API_KEY.includes("your_circle") || 
  !ENTITY_SECRET || 
  ENTITY_SECRET.includes("your_entity") ||
  !PUBLIC_KEY ||
  PUBLIC_KEY.includes("your_circle_public_key");

if (isMockMode) {
  console.log("⚠️ Circle Wallet API running in MOCK mode (No valid Circle keys provided).");
}

export async function createAgentWallet(agentName: string): Promise<{
  walletId: string;
  walletAddress: string;
}> {
  if (isMockMode) {
    const wallet = ethers.Wallet.createRandom();
    const walletId = `mock-wallet-${uuidv4()}`;
    console.log(`[MOCK Circle] Created agent wallet. ID: ${walletId}, Address: ${wallet.address}`);
    return { walletId, walletAddress: wallet.address };
  }

  // Real Circle API integration
  const challengeRes = await axios.post(
    `${BASE_URL}/developer/wallets`,
    {
      idempotencyKey: uuidv4(),
      entitySecretCiphertext: encryptEntitySecret(),
      walletSetId: await getOrCreateWalletSet(),
      blockchains: ["ARC-TESTNET"],
      count: 1,
      metadata: [{ name: agentName, refId: `agent-${Date.now()}` }],
    },
    { headers }
  );

  const walletId = challengeRes.data.data.wallets[0].id;
  const walletAddress = challengeRes.data.data.wallets[0].address;

  return { walletId, walletAddress };
}

export async function getWalletBalance(walletId: string): Promise<number> {
  if (isMockMode || walletId.startsWith("mock-")) {
    const db = getDB();
    const agent = db.prepare("SELECT total_earned FROM agents WHERE circle_wallet_id = ?").get(walletId) as any;
    // Mock starts with total earned or fallback
    return agent ? agent.total_earned : 0;
  }

  try {
    const res = await axios.get(
      `${BASE_URL}/wallets/${walletId}/balances`,
      { headers }
    );
    const balances = res.data.data.tokenBalances || [];
    const usdc = balances.find((b: any) => b.token.symbol === "USDC");
    return usdc ? parseFloat(usdc.amount) : 0;
  } catch (error: any) {
    console.error("Circle Balance API Error:", error.message);
    return 0;
  }
}

export async function transferFromAgentWallet(
  walletId: string,
  destinationAddress: string,
  amount: string
): Promise<string> {
  if (isMockMode || walletId.startsWith("mock-")) {
    console.log(`[MOCK Circle] Transfer of ${amount} USDC from ${walletId} to ${destinationAddress} requested.`);
    
    // Simulate withdrawal by subtracting from the total earned in mock mode
    const db = getDB();
    const agent = db.prepare("SELECT * FROM agents WHERE circle_wallet_id = ?").get(walletId) as any;
    if (agent) {
      const newEarned = Math.max(0, agent.total_earned - parseFloat(amount));
      db.prepare("UPDATE agents SET total_earned = ? WHERE circle_wallet_id = ?").run(newEarned, walletId);
    }
    
    return `mock-tx-${uuidv4()}`;
  }

  const res = await axios.post(
    `${BASE_URL}/developer/transactions/transfer`,
    {
      idempotencyKey: uuidv4(),
      entitySecretCiphertext: encryptEntitySecret(),
      walletId,
      amounts: [amount],
      destinationAddress,
      blockchain: "ARC-TESTNET",
      tokenAddress: "0x3600000000000000000000000000000000000000", // USDC
      feeLevel: "MEDIUM",
    },
    { headers }
  );
  return res.data.data.id; // Transfer ID
}

// ── Helpers ──────────────────────────────────────────────────────────

let walletSetId: string | null = null;

async function getOrCreateWalletSet(): Promise<string> {
  if (walletSetId) return walletSetId;

  const res = await axios.post(
    `${BASE_URL}/developer/walletSets`,
    {
      idempotencyKey: uuidv4(),
      entitySecretCiphertext: encryptEntitySecret(),
      name: "AI Agent Marketplace Wallets",
    },
    { headers }
  );
  walletSetId = res.data.data.walletSet.id;
  return walletSetId!;
}

function encryptEntitySecret(): string {
  let cleanedKey = PUBLIC_KEY.trim();
  if ((cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) || (cleanedKey.startsWith("'") && cleanedKey.endsWith("'"))) {
    cleanedKey = cleanedKey.slice(1, -1).trim();
  }
  cleanedKey = cleanedKey.replace(/\\n/g, "\n");

  // Automatically wrap with PEM headers/footers if missing
  if (!cleanedKey.includes("-----BEGIN PUBLIC KEY-----")) {
    cleanedKey = `-----BEGIN PUBLIC KEY-----\n${cleanedKey}`;
  }
  if (!cleanedKey.includes("-----END PUBLIC KEY-----")) {
    cleanedKey = `${cleanedKey}\n-----END PUBLIC KEY-----`;
  }

  const encrypted = crypto.publicEncrypt(
    { key: cleanedKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    Buffer.from(ENTITY_SECRET, "hex")
  );
  return encrypted.toString("base64");
}
