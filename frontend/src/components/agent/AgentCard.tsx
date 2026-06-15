import { Link } from "react-router-dom";

const CATEGORY_ICONS: Record<string, string> = {
  writing: "✍️", analysis: "📊", translation: "🌐",
  coding: "💻", research: "🔍",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className="text-xs" style={{ color: i <= Math.round(rating) ? "#facc15" : "rgba(255,255,255,0.15)" }}>
          ★
        </span>
      ))}
      <span className="text-xs text-arc-muted ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function AgentCard({ agent }: { agent: any }) {
  return (
    <Link to={`/agent/${agent.id}`}
      className="block glass-card card-hover rounded-2xl p-5 group relative overflow-hidden">
      {/* Subtle top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "linear-gradient(90deg, var(--arc-pink), var(--arc-purple))" }} />

      <div className="flex items-start justify-between mb-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl relative"
          style={{ background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.15)" }}>
          {CATEGORY_ICONS[agent.category] || "🤖"}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-arc-card flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
          </div>
        </div>

        {/* Price */}
        <div className="text-right">
          <div className="text-arc-pink font-bold font-mono text-lg leading-none">{agent.price_usdc} USDC</div>
          <div className="text-arc-muted text-xs mt-0.5">per task</div>
        </div>
      </div>

      {/* Name & Description */}
      <h3 className="font-bold text-base mb-1.5 text-arc-text group-hover:text-arc-pink transition-colors leading-tight">
        {agent.name}
      </h3>
      <p className="text-arc-muted text-sm mb-4 line-clamp-2 leading-relaxed" style={{ minHeight: "2.5rem" }}>
        {agent.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Category badge */}
        <span className={`badge-${agent.category} text-xs font-semibold px-2.5 py-1 rounded-lg capitalize`}>
          {CATEGORY_ICONS[agent.category]} {agent.category}
        </span>

        <div className="flex items-center gap-3 text-xs text-arc-muted">
          <StarRating rating={agent.rating} />
          <span className="flex items-center gap-1">
            <span className="text-arc-green">✓</span>
            {agent.total_tasks}
          </span>
        </div>
      </div>
    </Link>
  );
}
