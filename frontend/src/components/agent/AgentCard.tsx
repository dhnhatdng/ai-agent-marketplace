import { Link } from "react-router-dom";

const CATEGORY_ICONS: Record<string, string> = {
  writing: "✍️", analysis: "📊", translation: "🌐",
  coding: "💻", research: "🔍",
};

export default function AgentCard({ agent }: { agent: any }) {
  return (
    <Link to={`/agent/${agent.id}`}
      className="block bg-arc-card border border-arc-border rounded-2xl p-6 hover:border-arc-pink/40 transition-all hover:shadow-lg hover:shadow-arc-pink/5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-arc-pink/10 border border-arc-pink/20">
          {CATEGORY_ICONS[agent.category] || "🤖"}
        </div>
        <div className="text-right">
          <div className="text-arc-pink font-bold font-mono text-lg">{agent.price_usdc} USDC</div>
          <div className="text-arc-muted text-xs">per task</div>
        </div>
      </div>
      <h3 className="font-bold text-lg mb-2">{agent.name}</h3>
      <p className="text-arc-muted text-sm mb-4 line-clamp-2">{agent.description}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-arc-muted capitalize">{agent.category}</span>
        <div className="flex items-center gap-3 text-arc-muted">
          <span>⭐ {agent.rating.toFixed(1)}</span>
          <span>✅ {agent.total_tasks} tasks</span>
        </div>
      </div>
    </Link>
  );
}
