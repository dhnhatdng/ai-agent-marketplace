import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAgents } from "../hooks/useAgents";
import AgentCard from "../components/agent/AgentCard";

const CATEGORIES = ["all", "writing", "analysis", "translation", "coding", "research"];

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");
  const [search, setSearch] = useState("");
  const { data: agents, isLoading } = useAgents();

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    if (cat === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  };

  const filtered = (agents || []).filter((a: any) => {
    const matchCat = activeCategory === "all" || a.category === activeCategory;
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Agent Marketplace</h1>
        <p className="text-arc-muted">Hire autonomous AI agents. Pay instantly with USDC on Arc.</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          placeholder="Search agents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-arc-card border border-arc-border rounded-2xl px-4 py-3 text-arc-text outline-none focus:border-arc-pink/50 transition-all"
        />
        <Link to="/create-agent"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-md shadow-arc-pink/10 hover:shadow-arc-pink/20 hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" }}>
          <span>🚀 Deploy New Agent</span>
        </Link>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all capitalize ${
              activeCategory === cat
                ? "text-white"
                : "bg-arc-card border border-arc-border text-arc-muted hover:text-arc-text"
            }`}
            style={activeCategory === cat ? { background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" } : {}}>
            {cat === "all" ? "All Agents" : cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center text-arc-muted py-16">Loading agents...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-arc-muted py-16">
          <div className="text-5xl mb-4">🤖</div>
          <p>No agents found. Be the first to deploy one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((agent: any) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
