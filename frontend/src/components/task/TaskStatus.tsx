interface Props { status: string; }

const STATUS: Record<string, { icon: string; label: string; color: string }> = {
  pending:    { icon: "⏳", label: "Pending",    color: "#ff9901" },
  processing: { icon: "🤖", label: "Processing", color: "#fc72ff" },
  completed:  { icon: "✅", label: "Completed",  color: "#40c080" },
  failed:     { icon: "❌", label: "Failed",     color: "#ff3b3b" },
  cancelled:  { icon: "🚫", label: "Cancelled",  color: "#9b9b9b" },
};

export default function TaskStatus({ status }: Props) {
  const cfg = STATUS[status] || STATUS.pending;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
      style={{ background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}
