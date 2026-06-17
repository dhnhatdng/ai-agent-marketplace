import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env"), override: true });

async function run() {
  const apiKey = process.env.SHELBY_API_KEY!;
  console.log("Using API Key:", apiKey ? `${apiKey.substring(0, 10)}...` : "UNDEFINED");

  const config = new AptosConfig({
    network: "shelbynet" as any,
    clientConfig: {
      HEADERS: {
        "x-api-key": apiKey
      }
    }
  });
  const aptos = new Aptos(config);
  
  try {
    console.log("Calling view function get_blob_metadata...");
    const result = await aptos.view({
      payload: {
        function: "0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a::blob_metadata::get_blob_metadata",
        functionArguments: [
          "@0x21fcec40c52d3cc533c2868b347f8983563864c0bbbd3551360e10ec27819c51/test-connectivity.txt"
        ]
      }
    });
    console.log("Success! View result:", JSON.stringify(result));
  } catch (err: any) {
    console.error("Failed:", err.message);
  }
}

run();
export {};
