import axios from "axios";

export async function fetchWebSearch(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || apiKey.includes("your_tavily")) {
    console.log("⚠️ Tavily Web Search Key not configured in .env. Skipping real-time search.");
    return "";
  }

  try {
    console.log(`📡 Performing real-time web search for query: "${query}"...`);
    const response = await axios.post("https://api.tavily.com/search", {
      api_key: apiKey,
      query: query,
      search_depth: "basic",
      include_answer: false,
      max_results: 3
    }, {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 5000
    });

    const results = response.data.results || [];
    if (results.length === 0) {
      return "[No search results found]";
    }

    const context = results.map((res: any, idx: number) => {
      return `[Source ${idx + 1}] Title: ${res.title}\nURL: ${res.url}\nContent: ${res.content}`;
    }).join("\n\n");

    console.log(`✅ Web search returned ${results.length} sources.`);
    return context;
  } catch (error: any) {
    console.error("❌ Tavily Search failed:", error.response?.data || error.message);
    return "";
  }
}
