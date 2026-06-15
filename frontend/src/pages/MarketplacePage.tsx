import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAgents } from "../hooks/useAgents";
import AgentCard from "../components/agent/AgentCard";

const CATEGORIES = [
  { label: "All Agents", value: "all", icon: "🌐" },
  { label: "Writing", value: "writing", icon: "✍️" },
  { label: "Analysis", value: "analysis", icon: "📊" },
  { label: "Translation", value: "translation", icon: "🌏" },
  { label: "Coding", value: "coding", icon: "💻" },
  { label: "Research", value: "research", icon: "🔍" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Highest Rated", value: "rating" },
  { label: "Most Tasks", value: "tasks" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
];

function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex justify-between items-start">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="skeleton w-20 h-6 rounded-lg" />
      </div>
      <div className="skeleton h-5 w-3/4 rounded-md" />
      <div className="skeleton h-4 w-full rounded-md" />
      <div className="skeleton h-4 w-2/3 rounded-md" />
      <div className="flex justify-between">
        <div className="skeleton h-6 w-20 rounded-lg" />
        <div className="skeleton h-6 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const { data: agents, isLoading } = useAgents();

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    if (cat === "all") setSearchParams({});
    else setSearchParams({ category: cat });
  };

  const filtered = (agents || [])
    .filter((a: any) => {
      const matchCat = activeCategory === "all" || a.category === activeCategory;
      const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a: any, b: any) => {
      switch (sort) {
        case "rating":    return b.rating - a.rating;
        case "tasks":     return b.total_tasks - a.total_tasks;
        case "price_asc": return a.price_usdc - b.price_usdc;
        case "price_desc":return b.price_usdc - a.price_usdc;
        default:          return 0;
      }
    });

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-arc-text">AI Agent Marketplace</h1>
        <p className="text-arc-muted">Hire autonomous AI agents. Pay instantly with USDC on Arc.</p>
      </div>

      {/* Search + Sort + Deploy */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-arc-muted text-lg pointer-events-none">🔍</span>
          <input
            placeholder="Search agents by name or skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full glass-card border border-arc-border rounded-2xl pl-11 pr-4 py-3 text-arc-text outline-none focus:border-arc-pink/40 transition-all text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-arc-muted hover:text-arc-text transition-colors">✕</button>
          )}
        </div>

        <select value={sort} onChange={e => setSort(e.target.value)}
          className="glass-card border border-arc-border rounded-2xl px-4 py-3 text-arc-text outline-none focus:border-arc-pink/40 transition-all text-sm bg-transparent cursor-pointer min-w-44">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <Link to="/create-agent"
          className="btn-press flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-arc-btn-text transition-all shadow-md whitespace-nowrap"
          style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" }}>
          🚀 Deploy Agent
        </Link>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => handleCategoryChange(cat.value)}
            className={`btn-press flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.value
                ? "text-arc-btn-text shadow-lg"
                : "glass-card border border-arc-border text-arc-muted hover:text-arc-text hover:border-arc-pink/30"
            }`}
            style={activeCategory === cat.value ? { background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" } : {}}>
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!isLoading && (
        <div className="text-sm text-arc-muted mb-4">
          {filtered.length === 0 ? "No agents found" : `${filtered.length} agent${filtered.length !== 1 ? "s" : ""} found`}
          {search && <span> for "<span className="text-arc-text">{search}</span>"</span>}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-5 animate-float">🤖</div>
          <h3 className="text-xl font-bold text-arc-text mb-2">No agents found</h3>
          <p className="text-arc-muted mb-6">
            {search ? `No agents match "${search}"` : "Be the first to deploy one!"}
          </p>
          <Link to="/create-agent"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-arc-btn-text text-sm"
            style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" }}>
            🚀 Deploy First Agent
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((agent: any) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
