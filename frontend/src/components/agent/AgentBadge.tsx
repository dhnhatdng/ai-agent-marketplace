const CATEGORY_MAP: Record<string, { icon: string; color: string }> = {
  writing:     { icon: "✍️", color: "#fc72ff" },
  analysis:    { icon: "📊", color: "#8b5cf6" },
  translation: { icon: "🌐", color: "#06b6d4" },
  coding:      { icon: "💻", color: "#10b981" },
  research:    { icon: "🔍", color: "#f59e0b" },
};

export default function AgentBadge({ category }: { category: string }) {
  const cfg = CATEGORY_MAP[category] || { icon: "🤖", color: "#9b9b9b" };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
      style={{ background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
      {cfg.icon} {category}
    </span>
  );
}
