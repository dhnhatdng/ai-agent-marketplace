import OpenAI from "openai";
import { fetchWebSearch } from "./webSearch";
import { searchSurfData } from "./surf";


const rawApiKey = process.env.OPENAI_API_KEY || "";
let apiKey = rawApiKey.trim();
if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
  apiKey = apiKey.slice(1, -1).trim();
}

let rawBaseURL = process.env.OPENAI_BASE_URL || "";
let baseURL: string | undefined = undefined;

if (rawBaseURL) {
  baseURL = rawBaseURL.trim();
  if (!baseURL.endsWith("/")) {
    baseURL = baseURL + "/";
  }
}


const isMockMode = !apiKey || apiKey.includes("your_openai");
const openai = isMockMode ? null : new OpenAI({ apiKey, baseURL });

export interface AITaskResult {
  content: string;
  tokensUsed: number;
  model: string;
}

/**
 * Xử lý task bằng GPT-4o hoặc Mock engine.
 */
export async function processTaskWithAI(
  systemPrompt: string,
  taskDescription: string,
  model: string = "gpt-4o"
): Promise<AITaskResult> {
  const runMock = async () => {
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate context-aware mock content
    const descLower = taskDescription.toLowerCase();
    let content = "";
    
    if ((descLower.includes("subcontract") || descLower.includes("ủy quyền") || descLower.includes("delegate") || descLower.includes("a2a")) && !descLower.includes("synthesize") && !descLower.includes("delegated")) {
      content = `{\n  "subcontract": {\n    "agent_id": "7c28860d-1490-4b48-8987-24bb9059ab57",\n    "prompt": "Create a viral X thread about Arc Network's dynamic gas fees and agentic economy.",\n    "amount_usdc": 0.5\n  }\n}\n\nI will delegate the creation of the social media content to our Crypto Content Master agent to get the best viral strategy, while I prepare the technical overview.`;
    } else if (descLower.includes("dịch") || descLower.includes("translate") || descLower.includes("dịch thuật")) {
      content = `[MOCK TRANSLATION ENGINE]\nBài dịch cho yêu cầu "${taskDescription}":\n\n` + 
                `"Artificial Intelligence (AI) is transforming the way we work, live, and interact. ` +
                `By utilizing advanced smart contracts on networks like Arc, we enable frictionless machine-to-machine payments. ` +
                `This creates a decentralized economy where services are bought and sold autonomously."`;
    } else if (descLower.includes("code") || descLower.includes("lập trình") || descLower.includes("viết code")) {
      content = `[MOCK CODING ENGINE]\nĐây là source code theo yêu cầu của bạn:\n\n` +
                `\`\`\`typescript\n` +
                `// Smart Contract Interaction Helper\n` +
                `import { ethers } from "ethers";\n\n` +
                `export async function getUSDCBalance(walletAddress: string): Promise<bigint> {\n` +
                `  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");\n` +
                `  const usdcAddress = "0x3600000000000000000000000000000000000000";\n` +
                `  const abi = ["function balanceOf(address) view returns (uint256)"];\n` +
                `  const contract = new ethers.Contract(usdcAddress, abi, provider);\n` +
                `  return await contract.balanceOf(walletAddress);\n` +
                `}\n` +
                `\`\`\`\n\nCode đã được tối ưu hóa và kiểm tra cú pháp!`;
    } else if (descLower.includes("phân tích") || descLower.includes("analysis") || descLower.includes("data")) {
      content = `[MOCK ANALYSIS ENGINE]\nBáo cáo phân tích dữ liệu cho chủ đề:\n\n` +
                `### 1. TỔNG QUAN THỊ TRƯỜNG\n` +
                `- Khối lượng giao dịch tăng trưởng 12% so với tháng trước.\n` +
                `- Phí gas trung bình trên mạng lưới Arc giữ vững ở mức cực kỳ tối ưu.\n\n` +
                `### 2. PHÂN TÍCH SWOT\n` +
                `- **Điểm mạnh (S)**: Phí giao dịch USDC cực thấp, tốc độ xử lý nhanh dưới 2s.\n` +
                `- **Cơ hội (O)**: Mở rộng thị trường tích hợp cho nhiều tác vụ AI tự động (autonomous execution).\n\n` +
                `### 3. ĐỀ XUẤT HÀNH ĐỘNG\n` +
                `- Tăng số lượng Agent hỗ trợ để bắt kịp đà tăng trưởng của hệ sinh thái dApps.`;
    } else {
      // Default: Writing/Research mock response
      content = `[MOCK WRITING ENGINE]\nBài viết chi tiết được thực hiện bởi AI Agent:\n\n` +
                `### Giới thiệu về Arc Network và Thị trường AI Agent\n\n` +
                `Trong thời đại blockchain thế hệ mới, sự hội tụ của Trí tuệ Nhân tạo (AI) và Tài chính Phi tập trung (DeFi) đang mở ra những chân trời mới. ` +
                `Nền tảng AI Agent Marketplace xây dựng trên Arc Network cung cấp một môi trường hoàn hảo, nơi các Agent có ví Circle riêng và nhận thanh toán USDC trực tiếp qua Escrow smart contract.\n\n` +
                `### Điểm nổi bật của giải pháp:\n` +
                `1. **Thanh toán tự động**: Khách hàng khóa tiền vào hợp đồng, AI tự xử lý và nhận tiền ngay khi hoàn thành.\n` +
                `2. **Gas Native USDC**: Không cần nắm giữ các token gas phức tạp, Arc sử dụng thẳng USDC cho mọi chi phí giao dịch.\n` +
                `3. **Tính minh bạch**: Mọi kết quả được băm (hash) và lưu vết trên blockchain để kiểm tra (audit) khi cần.\n\n` +
                `*Yêu cầu gốc của bạn: "${taskDescription}"*`;
    }
    
    return {
      content,
      tokensUsed: 420,
      model: "gpt-4o (mocked)"
    };
  };

  if (isMockMode || !openai) {
    return runMock();
  }

  let apiModel = model;
  if (rawBaseURL && (rawBaseURL.includes("generativelanguage.googleapis.com") || rawBaseURL.includes("google"))) {
    if (model.includes("pro")) {
      apiModel = "gemini-2.5-pro";
    } else if (model === "gemini-3.1-flash-lite") {
      apiModel = "gemini-3.1-flash-lite";
    } else if (model === "gemini-2.5-flash-lite") {
      apiModel = "gemini-2.5-flash-lite";
    } else {
      apiModel = "gemini-2.5-flash";
    }
  }

  console.log("--- AI REQUEST ---");
  console.log("Base URL:", baseURL || "Default (OpenAI)");
  console.log("Original Model:", model);
  console.log("Mapped Model:", apiModel);
  console.log("------------------");

  let searchContext = "";
  try {
    const isSynthesis = taskDescription.includes("You delegated a sub-task") || taskDescription.includes("synthesize");
    if (!isSynthesis) {
      // 1. Ưu tiên tìm kiếm thông tin thị trường, on-chain từ SurfAI
      if (process.env.SURF_API_KEY) {
        try {
          const surfResult = await searchSurfData(taskDescription);
          if (surfResult) {
            searchContext += `\n\n=== SURFAI REAL-TIME CRYPTO CONTEXT ===\n${surfResult}\n=======================================`;
          }
        } catch (surfErr: any) {
          console.warn("⚠️ SurfAI Grounding failed:", surfErr.message);
        }
      }

      // 2. Kết hợp/Dự phòng với tìm kiếm Web chung của Tavily
      if (process.env.TAVILY_API_KEY) {
        try {
          const searchResult = await fetchWebSearch(taskDescription);
          if (searchResult) {
            searchContext += `\n\n=== REAL-TIME WEB SEARCH CONTEXT ===\nUse this real-time information to answer the user request:\n${searchResult}\n===================================`;
          }
        } catch (err: any) {
          console.warn("⚠️ Web Search Grounding failed:", err.message);
        }
      }
    }

    const response = await openai.chat.completions.create({
      model: apiModel,
      messages: [
        {
          role: "system",
          content: `${systemPrompt}${searchContext}\n\nQuy tắc quan trọng:
- Trả lời bằng ngôn ngữ mà user dùng trong task description (ví dụ: Tiếng Việt tự nhiên, trôi chảy, chuyên nghiệp, không dịch word-by-word máy móc).
- Tuyệt đối KHÔNG dịch các thuật ngữ tiếng Anh chuyên ngành như "AI Agent", "Agent", "DePIN", "Tier-1", "Web3", "escrow", "gas", "blockchain", "faucet" sang tiếng Việt (giữ nguyên gốc tiếng Anh). Không dịch "AI Agent" thành "Đại lý AI" hay "Đại lý", không dịch "Tier-1" thành "cấp độ TIÊN".
- Viết bài viết hoặc kết quả một cách chi tiết, chất lượng, đầy đủ thông tin hữu ích và có cấu trúc rõ ràng (tránh viết quá sơ sài hoặc ngắn cụt ngủn).
- Chỉ trả về nội dung kết quả, không thêm lời chào hỏi hay giải thích.
- Nếu task không rõ ràng, hãy làm theo hiểu biết tốt nhất của bạn`,
        },
        {
          role: "user",
          content: taskDescription,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || "";
    return {
      content,
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model,
    };
  } catch (error: any) {
    let fallbackModel = "";
    if (apiModel === "gemini-2.5-flash") {
      fallbackModel = "gemini-1.5-flash";
    } else if (apiModel === "gemini-2.5-pro") {
      fallbackModel = "gemini-1.5-pro";
    }

    if (fallbackModel && !isMockMode && openai) {
      console.warn(`⚠️ Model ${apiModel} failed with error: ${error.message}. Attempting fallback to ${fallbackModel}...`);
      try {
        const response = await openai.chat.completions.create({
          model: fallbackModel,
          messages: [
            {
              role: "system",
              content: `${systemPrompt}${searchContext}\n\nQuy tắc quan trọng:
- Trả lời bằng ngôn ngữ mà user dùng trong task description (ví dụ: Tiếng Việt tự nhiên, trôi chảy, chuyên nghiệp, không dịch word-by-word máy móc).
- Tuyệt đối KHÔNG dịch các thuật ngữ tiếng Anh chuyên ngành như "AI Agent", "Agent", "DePIN", "Tier-1", "Web3", "escrow", "gas", "blockchain", "faucet" sang tiếng Việt (giữ nguyên gốc tiếng Anh). Không dịch "AI Agent" thành "Đại lý AI" hay "Đại lý", không dịch "Tier-1" thành "cấp độ TIÊN".
- Viết bài viết hoặc kết quả một cách chi tiết, chất lượng, đầy đủ thông tin hữu ích và có cấu trúc rõ ràng (tránh viết quá sơ sài hoặc ngắn cụt ngủn).
- Chỉ trả về nội dung kết quả, không thêm lời chào hỏi hay giải thích.
- Nếu task không rõ ràng, hãy làm theo hiểu biết tốt nhất của bạn`,
            },
            {
              role: "user",
              content: taskDescription,
            },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        });

        const content = response.choices[0].message.content || "";
        console.log(`✅ Fallback model ${fallbackModel} succeeded!`);
        return {
          content,
          tokensUsed: response.usage?.total_tokens || 0,
          model: response.model,
        };
      } catch (fallbackErr: any) {
        console.warn(`⚠️ Fallback model ${fallbackModel} also failed: ${fallbackErr.message}.`);
      }
    } else {
      console.warn(`⚠️ OpenAI API error: ${error.message}.`);
    }

    console.warn("Falling back to mock AI generation.");
    
    // Debug: Fetch raw response from Google to inspect the error body
    try {
      const axios = require("axios");
      console.log("🔍 Attempting raw request to inspect error body...");
      await axios.post(`${baseURL}chat/completions`, {
        model: apiModel,
        messages: [
          { role: "user", content: taskDescription }
        ],
        max_tokens: 100
      }, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });
    } catch (axiosErr: any) {
      console.log("--- RAW API ERROR ---");
      console.log("Status:", axiosErr.response?.status);
      console.log("Headers:", JSON.stringify(axiosErr.response?.headers || {}));
      console.log("Body:", JSON.stringify(axiosErr.response?.data || "no data"));
      console.log("----------------------");
    }
    
    return runMock();
  }
}
