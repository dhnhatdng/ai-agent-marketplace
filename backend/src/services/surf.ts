import axios from "axios";

const BASE_URL = "https://api.asksurf.ai/gateway";

export interface SurfPriceResult {
  symbol: string;
  price: number;
  change24h?: number;
}

/**
 * Lấy giá của một token tiền điện tử từ SurfAI API
 * @param symbol Ký hiệu token (VD: BTC, ETH)
 */
export async function fetchTokenPrice(symbol: string): Promise<SurfPriceResult | null> {
  const apiKey = process.env.SURF_API_KEY;
  
  try {
    console.log(`📡 Fetching price from SurfAI for: ${symbol}...`);
    const response = await axios.get(`${BASE_URL}/v1/market/price`, {
      params: { symbol: symbol.toUpperCase() },
      headers: {
        ...(apiKey ? { "x-api-key": apiKey } : {})
      },
      timeout: 5000
    });

    const data = response.data;
    // Lấy giá trị mới nhất trong phần summary hoặc phần tử cuối của data
    if (data && data.summary && data.summary.last !== undefined) {
      return {
        symbol: symbol.toUpperCase(),
        price: data.summary.last,
        change24h: data.summary.change_pct
      };
    } else if (data && data.data && data.data.length > 0) {
      const latest = data.data[data.data.length - 1];
      return {
        symbol: symbol.toUpperCase(),
        price: latest.value
      };
    }
    return null;
  } catch (error: any) {
    console.warn(`⚠️ SurfAI Price Fetch failed for ${symbol}:`, error.response?.data || error.message);
    return null;
  }
}

/**
 * Tìm kiếm dữ liệu onchain hoặc thị trường qua tính năng Search của SurfAI
 * @param query Câu hỏi/truy vấn từ client
 */
export async function searchSurfData(query: string): Promise<string> {
  const apiKey = process.env.SURF_API_KEY;
  try {
    console.log(`📡 Searching SurfAI crypto database for query: "${query}"...`);
    const response = await axios.get(`${BASE_URL}/v1/search/web`, {
      params: { q: query }, // Truy vấn cần truyền vào parameter 'q'
      headers: {
        ...(apiKey ? { "x-api-key": apiKey } : {})
      },
      timeout: 8000
    });

    // SurfAI trả kết quả trong mảng 'data'
    const results = response.data?.data || [];
    if (results.length === 0) return "";
    
    return results.map((res: any, idx: number) => {
      return `[Surf Source ${idx + 1}] Title: ${res.title}\nURL: ${res.url}\nDescription: ${res.description || res.content || ""}`;
    }).join("\n\n");
  } catch (error: any) {
    console.warn("⚠️ SurfAI Search failed:", error.response?.data || error.message);
    return "";
  }
}

