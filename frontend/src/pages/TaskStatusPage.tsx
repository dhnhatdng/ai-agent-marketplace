import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAccount } from "wagmi";
import axios from "axios";
import { useTask } from "../hooks/useTasks";
import { useEscrow } from "../hooks/useEscrow";

const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  pending:    { icon: "⏳", label: "Waiting for AI agent...", color: "text-arc-warning" },
  processing: { icon: "🤖", label: "AI is working on your task...", color: "text-arc-pink" },
  completed:  { icon: "✅", label: "Task completed!", color: "text-arc-success" },
  failed:     { icon: "❌", label: "Task failed & refunded", color: "text-arc-error" },
  cancelled:  { icon: "🚫", label: "Task cancelled", color: "text-arc-muted" },
};

export default function TaskStatusPage() {
  const { id } = useParams<{ id: string }>();
  const { address } = useAccount();
  const { data: task, isLoading, refetch } = useTask(id!);
  const { cancelTask } = useEscrow();

  // Review states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Cancel states
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  if (isLoading) return <div className="text-center py-16 text-arc-muted">Loading...</div>;
  if (!task) return <div className="text-center py-16 text-arc-muted">Task not found</div>;

  const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const isClient = address && task.client_address && address.toLowerCase() === task.client_address.toLowerCase();

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/tasks/${id}/review`, {
        rating,
        comment: comment.trim()
      });
      refetch();
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientCancel = async () => {
    setIsCancelling(true);
    setCancelError("");
    try {
      await cancelTask(task.id);
      refetch();
    } catch (err: any) {
      setCancelError(err.message || "Failed to cancel task");
    } finally {
      setIsCancelling(false);
    }
  };

  const createdAtTime = new Date(task.created_at).getTime();
  const isExpired = Date.now() >= createdAtTime + 24 * 3600 * 1000;
  const showCancelButton = isClient && (task.status === "pending" || task.status === "processing") && isExpired;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Status card */}
      <div className="bg-arc-card border border-arc-border rounded-3xl p-8 mb-6 text-center">
        <div className="text-6xl mb-4">{config.icon}</div>
        <h1 className={`text-2xl font-bold mb-2 ${config.color}`}>{config.label}</h1>

        {(task.status === "pending" || task.status === "processing") && (
          <div className="flex justify-center mt-4">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-arc-pink animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Immediate Refund Alert */}
      {task.status === "failed" && (
        <div className="bg-arc-error/10 border border-arc-error/30 rounded-3xl p-6 mb-6">
          <h2 className="font-bold mb-2 text-arc-error flex items-center gap-2">
            <span>❌ Task Failed & Refunded</span>
          </h2>
          <p className="text-arc-muted text-sm mb-4">
            An error occurred while executing the AI request. The escrow contract has automatically refunded your locked USDC back to your wallet.
          </p>
          {task.tx_complete_hash && (
            <div className="text-xs">
              <span className="text-arc-muted">Refund Transaction: </span>
              <a
                href={`https://testnet.arcscan.app/tx/${task.tx_complete_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-arc-pink hover:underline font-mono"
              >
                {task.tx_complete_hash.substring(0, 10)}...{task.tx_complete_hash.substring(58)} ↗
              </a>
            </div>
          )}
        </div>
      )}

      {/* Client Cancellation Card (when running > 24 hours) */}
      {showCancelButton && (
        <div className="bg-arc-card border border-arc-border rounded-3xl p-6 mb-6">
          <h2 className="font-bold mb-2 text-arc-text text-lg">🚫 Request Escrow Refund</h2>
          <p className="text-arc-muted text-sm mb-4">
            This task has been running for over 24 hours. You can request a refund directly from the smart contract, returning your USDC immediately.
          </p>
          {cancelError && (
            <div className="bg-arc-error/10 border border-arc-error/30 rounded-xl p-3 text-arc-error text-xs mb-4">
              {cancelError}
            </div>
          )}
          <button
            onClick={handleClientCancel}
            disabled={isCancelling}
            className="px-6 py-2.5 rounded-xl bg-arc-error hover:bg-arc-error/90 text-white font-semibold transition-all text-sm animate-pulse"
          >
            {isCancelling ? "Cancelling..." : "Cancel Task & Refund"}
          </button>
        </div>
      )}

      {/* Task details */}
      <div className="bg-arc-card border border-arc-border rounded-3xl p-6 mb-6">
        <h2 className="font-bold mb-3 text-arc-muted text-sm uppercase tracking-wider">Your Request</h2>
        <p className="text-arc-text">{task.description}</p>
      </div>

      {/* AI Result */}
      {task.ai_result && (
        <div className="bg-arc-card border border-arc-success/30 rounded-3xl p-6 mb-6">
          <h2 className="font-bold mb-4 text-arc-success">🎯 AI Result</h2>
          <div className="text-arc-text whitespace-pre-wrap leading-relaxed bg-arc-bg/50 p-4 rounded-2xl border border-arc-border font-sans text-sm">
            {task.ai_result}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(task.ai_result)}
            className="mt-4 px-4 py-2 rounded-xl bg-arc-bg border border-arc-border text-sm text-arc-muted hover:text-arc-text transition-all">
            📋 Copy to clipboard
          </button>
        </div>
      )}

      {/* Review Section */}
      {task.status === "completed" && (
        <>
          {task.is_reviewed ? (
            <div className="bg-arc-card border border-arc-border rounded-3xl p-6 mb-6">
              <h2 className="font-bold mb-3 text-arc-muted text-sm uppercase tracking-wider">Your Review</h2>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-arc-pink text-lg font-mono">
                  {"★".repeat(task.review.rating)}{"☆".repeat(5 - task.review.rating)}
                </div>
                <span className="text-xs text-arc-muted">
                  {new Date(task.review.created_at).toLocaleDateString()}
                </span>
              </div>
              {task.review.comment && (
                <p className="text-arc-muted italic">"{task.review.comment}"</p>
              )}
            </div>
          ) : (
            isClient && (
              <div className="bg-arc-card border border-arc-border rounded-3xl p-6 mb-6">
                <h2 className="font-bold mb-4 text-arc-text text-lg">⭐ Rate & Review Agent</h2>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-arc-muted mb-2 uppercase tracking-wider">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="text-3xl transition-transform hover:scale-110 outline-none"
                          style={{ color: star <= (hoverRating || rating) ? "#fc72ff" : "#2f313a" }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-arc-muted mb-2 uppercase tracking-wider">Comment</label>
                    <textarea
                      placeholder="Leave your feedback about the agent's response..."
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-arc-bg border border-arc-border rounded-2xl p-4 text-arc-text outline-none focus:border-arc-pink/50 transition-all resize-none text-sm"
                    />
                  </div>
                  {submitError && (
                    <div className="bg-arc-error/10 border border-arc-error/30 rounded-xl p-3 text-arc-error text-xs">
                      {submitError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl font-semibold transition-all hover:opacity-90 disabled:bg-arc-border disabled:text-arc-muted text-sm"
                    style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))", color: "var(--arc-btn-text)" }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>
            )
          )}
        </>
      )}

      {/* Transaction info */}
      <div className="bg-arc-card border border-arc-border rounded-3xl p-6 mb-6">
        <h2 className="font-bold mb-3 text-arc-muted text-sm uppercase tracking-wider">Transaction Info</h2>
        <div className="space-y-3 text-sm">
          {task.tx_lock_hash && (
            <div className="flex justify-between items-center">
              <span className="text-arc-muted">Lock Escrow TX</span>
              <a href={`https://testnet.arcscan.app/tx/${task.tx_lock_hash}`} target="_blank" rel="noopener noreferrer" className="text-arc-pink hover:underline font-mono">
                {task.tx_lock_hash.substring(0, 8)}...{task.tx_lock_hash.substring(58)} ↗
              </a>
            </div>
          )}
          {task.tx_complete_hash && (
            <div className="flex justify-between items-center">
              <span className="text-arc-muted">Release Payment TX</span>
              <a href={`https://testnet.arcscan.app/tx/${task.tx_complete_hash}`} target="_blank" rel="noopener noreferrer" className="text-arc-pink hover:underline font-mono">
                {task.tx_complete_hash.substring(0, 8)}...{task.tx_complete_hash.substring(58)} ↗
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="text-center mt-6">
        <Link to="/marketplace" className="text-arc-pink hover:underline text-sm font-medium">
          ← Back to Marketplace
        </Link>
      </div>
    </div>
  );
}
