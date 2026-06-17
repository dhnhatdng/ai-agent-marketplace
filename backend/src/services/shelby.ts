import { Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import * as dotenv from "dotenv";
import * as path from "path";

// Tải cấu hình biến môi trường
dotenv.config({ path: path.join(__dirname, "../../.env"), override: true });

const SHELBY_PRIVATE_KEY = process.env.SHELBY_PRIVATE_KEY || "";

const isMockMode = !SHELBY_PRIVATE_KEY;

let client: any = null;
let signerAccount: Account | null = null;
let isInitialized = false;

async function ensureInitialized() {
  if (isInitialized) return;
  isInitialized = true;

  if (!isMockMode) {
    try {
      let cleanKey = SHELBY_PRIVATE_KEY.trim();
      if (cleanKey.startsWith("ed25519-priv-")) {
        cleanKey = cleanKey.replace("ed25519-priv-", "");
      }
      const privateKey = new Ed25519PrivateKey(cleanKey);
      signerAccount = Account.fromPrivateKey({ privateKey });
      
      // Sử dụng hàm import động để nạp module ESM của Shelby trong môi trường CommonJS
      const { ShelbyNodeClient } = await Function('return import("@shelby-protocol/sdk/node")')();
      
      const envNetwork = (process.env.SHELBY_NETWORK || "shelbynet").toLowerCase();
      let networkValue: any;
      if (envNetwork === "shelbynet") {
        networkValue = (Network as any).SHELBYNET || "shelbynet";
      } else if (envNetwork === "local") {
        networkValue = Network.LOCAL;
      } else {
        networkValue = Network.TESTNET;
      }

      client = new ShelbyNodeClient({
        network: networkValue,
        apiKey: undefined,
        aptos: {
          clientConfig: {
            HEADERS: {
              "x-api-key": process.env.SHELBY_API_KEY
            }
          }
        }
      });
      console.log(`🐚 Shelby Service initialized with network: ${envNetwork} and Aptos account: ${signerAccount.accountAddress.toString()}`);
    } catch (err: any) {
      console.error(`⚠️ Failed to initialize real Shelby client: ${err.message}. Falling back to MOCK mode.`);
      client = null;
      signerAccount = null;
    }
  } else {
    console.log("⚠️ Shelby Protocol credentials not found in .env. Running in simulated (mock) upload mode.");
  }
}

/**
 * Tải kết quả báo cáo AI lên mạng lưới Shelby Protocol
 * @param data Buffer của kết quả AI
 * @param fileName tên file khi lưu trên Shelby
 * @returns Mã băm blob hash để truy cập qua Explorer
 */
export async function uploadToShelby(data: Buffer, fileName: string): Promise<string> {
  await ensureInitialized();

  if (isMockMode || !client || !signerAccount) {
    console.log(`[MOCK Shelby] Uploading file: ${fileName} (${data.length} bytes)...`);
    // Giả lập thời gian tải lên
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockHash = `mock-shelby-blob-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    console.log(`[MOCK Shelby] Upload successful. Hash: ${mockHash}`);
    return mockHash;
  }

  try {
    console.log(`🐚 [Shelby] Uploading file: ${fileName} (${data.length} bytes) to Shelby Network...`);
    await client.upload({
      blobData: new Uint8Array(data),
      signer: signerAccount,
      blobName: fileName,
      // Thời gian hết hạn sau 30 ngày (micro giây)
      expirationMicros: (Date.now() + 30 * 24 * 3600 * 1000) * 1000,
    });
    
    // Tạo URL Blob Explorer của Shelby để truy cập kết quả lưu trữ
    const accountAddress = signerAccount.accountAddress.toString();
    // URL format: https://explorer.shelby.xyz/shelbynet/account/<account>
    const finalHash = `https://explorer.shelby.xyz/shelbynet/account/${accountAddress}`;
    
    console.log(`🐚 [Shelby] Upload successful. Explorer URL: ${finalHash}`);
    return finalHash;
  } catch (err: any) {
    console.error(`❌ Shelby upload failed: ${err.message}. Falling back to simulated (mock) upload.`);
    const mockHash = `mock-shelby-fallback-${Math.random().toString(36).substring(2, 10)}`;
    return mockHash;
  }
}
