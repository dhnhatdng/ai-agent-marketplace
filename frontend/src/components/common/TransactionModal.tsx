interface Props {
  isOpen: boolean;
  onClose: () => void;
  status: "pending" | "success" | "error" | null;
  txHash?: string;
  message?: string;
}

export default function TransactionModal({ isOpen, onClose, status, txHash, message }: Props) {
  if (!isOpen) return null;

  const configs = {
    pending: { icon: "⏳", title: "Transaction Pending", color: "text-arc-warning" },
    success: { icon: "🎉", title: "Transaction Confirmed!", color: "text-arc-success" },
    error:   { icon: "❌", title: "Transaction Failed",   color: "text-arc-error" },
  };
  const cfg = status ? configs[status] : configs.pending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-arc-card border border-arc-border rounded-3xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="text-5xl mb-4">{cfg.icon}</div>
        <h3 className={`text-xl font-bold mb-3 ${cfg.color}`}>{cfg.title}</h3>

        {status === "pending" && (
          <div className="flex justify-center gap-1 my-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-arc-warning animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}

        {message && <p className="text-arc-muted text-sm mb-4">{message}</p>}

        {txHash && status === "success" && (
          <a href={`https://testnet.arcscan.app/tx/${txHash}`}
            target="_blank" rel="noopener noreferrer"
            className="text-arc-pink text-sm underline block mb-4">
            View on ArcScan ↗
          </a>
        )}

        {status !== "pending" && (
          <button onClick={onClose}
            className="w-full py-3 rounded-2xl bg-arc-border hover:opacity-90 text-arc-text font-semibold transition-all">
            Close
          </button>
        )}
      </div>
    </div>
  );
}
