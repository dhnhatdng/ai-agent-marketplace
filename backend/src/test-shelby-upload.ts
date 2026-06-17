import { Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env"), override: true });

async function run() {
  try {
    const { ShelbyNodeClient } = await Function('return import("@shelby-protocol/sdk/node")')();
    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY!.replace("ed25519-priv-", ""));
    const account = Account.fromPrivateKey({ privateKey });
    
    console.log("Derived Address:", account.accountAddress.toString());

    console.log("Shelby Client API Key:", process.env.SHELBY_API_KEY ? `${process.env.SHELBY_API_KEY.substring(0, 10)}...` : "UNDEFINED");
    console.log("Shelby Client Network:", process.env.SHELBY_NETWORK || "UNDEFINED");

    const client = new ShelbyNodeClient({
      network: (process.env.SHELBY_NETWORK || "shelbynet") as any,
      apiKey: undefined,
      aptos: {
        clientConfig: {
          HEADERS: {
            "x-api-key": process.env.SHELBY_API_KEY
          }
        }
      }
    });

    console.log("Shelby Client initialized successfully with custom headers!");
    console.log("client.aptos.config.clientConfig:", JSON.stringify((client as any).aptos.config.clientConfig));
    console.log("client.coordination.aptos.config.clientConfig:", JSON.stringify((client as any).coordination.aptos.config.clientConfig));
    
    console.log("Uploading test data to Shelbynet...");
    const result = await client.upload({
      blobData: new Uint8Array(Buffer.from("Hello Shelbynet!", "utf-8")),
      signer: account,
      blobName: "test-connectivity.txt",
      expirationMicros: (Date.now() + 3600 * 1000) * 1000,
    });

    console.log("Success! Upload result:", result);
  } catch (err: any) {
    console.error("Test failed with error:", err.stack || err.message);
  }
}

run();
