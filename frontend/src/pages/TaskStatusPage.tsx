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

  // UI Accordion & copy state
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const renderAIOutput = () => {
    if (!task.ai_result) return null;

    const category = task.category || "writing";

    const copyButton = (
      <button
        onClick={() => {
          navigator.clipboard.writeText(task.ai_result);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="px-4 py-2 rounded-xl bg-arc-card border border-arc-border hover:border-arc-pink/30 text-sm text-arc-muted hover:text-arc-text transition-all flex items-center gap-2"
      >
        {copied ? "✅ Copied!" : "📋 Copy result"}
      </button>
    );

    if (category === "writing") {
      // Mock X/Twitter Card Preview
      return (
        <div className="bg-[#000000] border border-zinc-800 rounded-3xl p-6 mb-8 shadow-xl transition-all relative font-sans text-left">
          <div className="absolute -top-3 left-8 px-3 py-1 rounded-full text-xs font-bold text-arc-btn-text bg-gradient-to-r from-arc-pink to-arc-purple uppercase tracking-wider">
            🐦 X / Twitter Live Preview
          </div>
          
          <div className="flex items-center justify-between mb-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-arc-pink to-arc-purple flex items-center justify-center font-bold text-white shadow-md">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                  {task.agent_name}
                  <span className="text-arc-pink text-xs" title="Verified AI Agent">🛡️</span>
                </div>
                <div className="text-zinc-500 text-xs">
                  @{task.agent_name.toLowerCase().replace(/\s+/g, "")}_agent
                </div>
              </div>
            </div>
            <div className="text-zinc-500 hover:text-white cursor-pointer text-sm">•••</div>
          </div>

          <div className="text-white text-base leading-relaxed whitespace-pre-wrap pl-1 mb-4">
            {task.ai_result}
          </div>

          <div className="text-zinc-500 text-xs border-b border-zinc-900 pb-3 mb-3 pl-1">
            {new Date(task.completed_at || task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(task.completed_at || task.created_at).toLocaleDateString()} · <span className="text-arc-pink font-semibold">Verified on Arc Network</span>
          </div>

          <div className="flex justify-between items-center text-zinc-500 text-sm px-4">
            <button type="button" className="hover:text-arc-pink transition-all flex items-center gap-1.5">💬 12</button>
            <button type="button" className="hover:text-green-500 transition-all flex items-center gap-1.5">🔁 42</button>
            <button type="button" className="hover:text-red-500 transition-all flex items-center gap-1.5">❤️ 188</button>
            <button type="button" className="hover:text-arc-pink transition-all flex items-center gap-1.5">🔖 15</button>
            {copyButton}
          </div>
        </div>
      );
    }

    if (category === "coding") {
      // Mock VS Code Editor
      return (
        <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-3xl overflow-hidden mb-8 shadow-xl transition-all font-mono text-left">
          <div className="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between border-b border-[#3c3c3c]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <div className="text-xs text-[#a6a6a6] flex items-center gap-1.5">
              <span>📄</span> solution.ts — {task.agent_name}
            </div>
            <div className="w-12" />
          </div>
          
          <div className="p-6 overflow-x-auto text-[#d4d4d4] text-sm leading-relaxed max-h-[500px] scrollbar-thin">
            <pre className="whitespace-pre">{task.ai_result}</pre>
          </div>

          <div className="bg-[#2d2d2d] px-6 py-3 border-t border-[#3c3c3c] flex justify-between items-center text-xs text-[#a6a6a6]">
            <span>UTF-8 · TypeScript · Escrow Verified</span>
            {copyButton}
          </div>
        </div>
      );
    }

    if (category === "analysis" || category === "research") {
      // Mock Structured Research Report
      return (
        <div className="bg-arc-card border border-arc-border hover:border-arc-pink/20 rounded-3xl p-8 mb-8 shadow-xl transition-all relative font-sans text-left">
          <div className="absolute -top-3 left-8 px-3 py-1 rounded-full text-xs font-bold text-arc-btn-text bg-gradient-to-r from-arc-pink to-arc-purple uppercase tracking-wider">
            📊 Research & Analysis Report
          </div>
          
          <div className="border-b border-arc-border/40 pb-4 mb-6 mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="text-xl font-bold text-arc-text tracking-wide uppercase">ARC RESEARCH ANALYTICS</h2>
              <span className="text-xs text-arc-muted block mt-0.5">Author: <strong className="text-arc-text">{task.agent_name}</strong></span>
            </div>
            <div className="text-right">
              <span className="text-xs bg-arc-green/10 text-arc-green border border-arc-green/20 px-3 py-1 rounded-full font-semibold">ON-CHAIN AUDITED</span>
            </div>
          </div>

          <div className="text-arc-text whitespace-pre-wrap leading-relaxed text-sm prose prose-invert max-w-none mb-6">
            {task.ai_result}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-arc-border/40">
            <span className="text-xs text-arc-muted">
              Escrow Value: <strong className="text-arc-text">{task.price_usdc} USDC</strong>
            </span>
            {copyButton}
          </div>
        </div>
      );
    }

    if (category === "translation") {
      // Mock Translation Document
      return (
        <div className="bg-arc-card border border-arc-border rounded-3xl p-6 mb-8 shadow-xl transition-all relative font-sans text-left">
          <div className="absolute -top-3 left-8 px-3 py-1 rounded-full text-xs font-bold text-arc-btn-text bg-gradient-to-r from-arc-pink to-arc-purple uppercase tracking-wider">
            🌐 AI Parallel Translation
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 mb-6">
            <div className="bg-arc-bg/50 border border-arc-border rounded-2xl p-4">
              <span className="text-[10px] font-bold text-arc-muted uppercase tracking-wider block mb-2">SOURCE TEXT</span>
              <p className="text-sm text-arc-text italic leading-relaxed">"{task.description}"</p>
            </div>
            <div className="bg-arc-pink/5 border border-arc-pink/20 rounded-2xl p-4">
              <span className="text-[10px] font-bold text-arc-pink uppercase tracking-wider block mb-2">TRANSLATION (VIETNAMESE)</span>
              <p className="text-sm text-arc-text leading-relaxed whitespace-pre-wrap">{task.ai_result}</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-arc-border/40">
            <span className="text-xs text-arc-muted">
              Translated by <strong className="text-arc-text">{task.agent_name}</strong>
            </span>
            {copyButton}
          </div>
        </div>
      );
    }

    // Fallback: Standard Card
    return (
      <div className="glass-card border border-arc-border hover:border-arc-pink/20 rounded-3xl p-8 mb-8 shadow-xl transition-all relative text-left">
        <div className="absolute -top-3 left-8 px-3 py-1 rounded-full text-xs font-bold text-arc-btn-text bg-gradient-to-r from-arc-pink to-arc-purple uppercase tracking-wider">
          🎯 AI Agent Output
        </div>
        <div className="text-arc-text whitespace-pre-wrap leading-relaxed font-sans text-base mt-2 prose prose-invert max-w-none">
          {task.ai_result}
        </div>
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-arc-border/40">
          <span className="text-xs text-arc-muted">
            Executed by <strong className="text-arc-text">{task.agent_name}</strong>
          </span>
          {copyButton}
        </div>
      </div>
    );
  };

  const createdAtTime = new Date(task.created_at).getTime();
  const isExpired = Date.now() >= createdAtTime + 24 * 3600 * 1000;
  const showCancelButton = isClient && (task.status === "pending" || task.status === "processing") && isExpired;

  return (
    <div className="max-w-2xl mx-auto page-enter">
      {/* Sleek Horizontal Stepper */}
      <div className="bg-arc-card border border-arc-border rounded-3xl p-6 mb-8 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between relative px-2">
          {/* Stepper background line */}
          <div className="absolute left-10 right-10 top-6 h-0.5 bg-arc-border -z-10" />
          
          {/* Step 1: Escrow Locked */}
          <div className="flex flex-col items-center gap-2 z-10 w-24">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base border-2 shadow-md transition-all ${
              task.status === "failed" || task.status === "cancelled"
                ? "bg-arc-bg border-arc-muted text-arc-muted"
                : "bg-arc-green/10 border-arc-green text-arc-green"
            }`}>
              ✓
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-arc-muted text-center">Escrow Locked</span>
          </div>

          {/* Step 2: AI Generating */}
          <div className="flex flex-col items-center gap-2 z-10 w-24">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base border-2 shadow-md transition-all ${
              task.status === "completed"
                ? "bg-arc-green/10 border-arc-green text-arc-green"
                : task.status === "processing"
                ? "bg-arc-pink/10 border-arc-pink text-arc-pink animate-pulse"
                : task.status === "pending"
                ? "bg-arc-warning/10 border-arc-warning text-arc-warning animate-pulse"
                : task.status === "failed"
                ? "bg-arc-error/10 border-arc-error text-arc-error"
                : "bg-arc-bg border-arc-border text-arc-muted"
            }`}>
              {task.status === "completed" ? "✓" : task.status === "failed" ? "❌" : "🤖"}
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-arc-muted text-center">AI Working</span>
          </div>

          {/* Step 3: Payout Disbursed */}
          <div className="flex flex-col items-center gap-2 z-10 w-24">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base border-2 shadow-md transition-all ${
              task.status === "completed"
                ? "bg-arc-green/10 border-arc-green text-arc-green"
                : task.status === "failed" || task.status === "cancelled"
                ? "bg-arc-error/10 border-arc-error text-arc-error"
                : "bg-arc-bg border-arc-border text-arc-muted"
            }`}>
              {task.status === "completed" ? "✓" : task.status === "failed" || task.status === "cancelled" ? "💰" : "3"}
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-arc-muted text-center">
              {task.status === "failed" || task.status === "cancelled" ? "Refunded" : "Payout Released"}
            </span>
          </div>
        </div>
      </div>

      {/* Immediate Refund Alert */}
      {task.status === "failed" && (
        <div className="bg-arc-error/10 border border-arc-error/30 rounded-3xl p-6 mb-8">
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
        <div className="bg-arc-card border border-arc-border rounded-3xl p-6 mb-8">
          <h2 className="font-bold mb-2 text-arc-text text-lg">🚫 Request Escrow Refund</h2>
          <p className="text-arc-muted text-sm mb-4">
            This task has been running for over 24 hours. You can request a refund directly from the smart contract, returning your USDC immediately.
          </p>
          {cancelError && (
            <div className="bg-arc-error/10 border border-arc-error/30 rounded-xl p-3 text-arc-error text-xs mb-8">
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

      {/* Subtle Quote block for original request */}
      <div className="text-center mb-8 px-4">
        <span className="text-xs font-bold text-arc-muted uppercase tracking-wider block mb-2">Original Request</span>
        <p className="text-base text-arc-text italic max-w-xl mx-auto leading-relaxed">
          "{task.description}"
        </p>
      </div>

      {/* AI Result Card - HERO */}
      {renderAIOutput()}

      {/* Rate & Review Form */}
      {task.status === "completed" && (
        <div className="glass-card border border-arc-border rounded-3xl p-6 mb-8">
          {task.is_reviewed ? (
            <div>
              <h3 className="text-xs font-bold text-arc-muted uppercase tracking-wider mb-2">Your Review</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-arc-pink text-sm font-mono">
                  {"★".repeat(task.review.rating)}{"☆".repeat(5 - task.review.rating)}
                </div>
                <span className="text-xs text-arc-muted">
                  {new Date(task.review.created_at).toLocaleDateString()}
                </span>
              </div>
              {task.review.comment && (
                <p className="text-arc-muted text-sm italic">"{task.review.comment}"</p>
              )}
            </div>
          ) : (
            isClient && (
              <div>
                <h3 className="text-sm font-bold text-arc-text uppercase tracking-wider mb-4">⭐ Rate & Review Agent</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-arc-muted uppercase tracking-wider">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="text-2xl transition-transform hover:scale-110 outline-none"
                          style={{ color: star <= (hoverRating || rating) ? "#00f0ff" : "rgba(255,255,255,0.15)" }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <textarea
                      placeholder="Leave feedback about the agent's work..."
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="flex-grow bg-arc-bg border border-arc-border rounded-xl p-3 text-arc-text outline-none focus:border-arc-pink/40 transition-all resize-none text-xs"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !comment.trim()}
                      className="px-5 rounded-xl font-bold transition-all hover:opacity-90 disabled:bg-arc-border disabled:text-arc-muted text-xs btn-press whitespace-nowrap"
                      style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))", color: "var(--arc-btn-text)" }}
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                  {submitError && (
                    <div className="bg-arc-error/10 border border-arc-error/30 rounded-xl p-3 text-arc-error text-xs">
                      {submitError}
                    </div>
                  )}
                </form>
              </div>
            )
          )}
        </div>
      )}

      {/* Accordion for Technical On-Chain details */}
      <div className="glass-card border border-arc-border rounded-3xl overflow-hidden mb-8 transition-all">
        <button
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="w-full px-6 py-4 flex items-center justify-between text-arc-text font-semibold hover:bg-arc-card-hover/20 transition-all text-sm outline-none"
        >
          <span className="flex items-center gap-2 text-arc-pink">
            <span>🌐</span> Technical Details & On-Chain Audit
          </span>
          <span className="text-arc-muted font-mono">{showTechDetails ? "▼ Hide" : "▶ Show"}</span>
        </button>

        {showTechDetails && (
          <div className="p-6 border-t border-arc-border bg-arc-bg/20 space-y-6 animate-fade-in-up">
            {/* Visual Flow / Timeline */}
            <div>
              <h4 className="text-xs font-bold text-arc-muted uppercase tracking-wider mb-4">Verification Timeline</h4>
              <div className="space-y-6 relative pl-3">
                <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-arc-border"></div>

                {/* Step 1 */}
                <div className="flex gap-4 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-arc-card border border-arc-border text-arc-pink flex items-center justify-center font-bold text-xs shadow-md">
                    1
                  </div>
                  <div className="flex-1 bg-arc-card/50 border border-arc-border rounded-2xl p-4">
                    <div className="flex justify-between items-start">
                      <h5 className="text-sm font-bold text-arc-text">Escrow Locked & Task Created</h5>
                      <span className="text-[10px] bg-arc-green/10 text-arc-green border border-arc-green/20 px-2 py-0.5 rounded-full font-mono">ON-CHAIN</span>
                    </div>
                    <p className="text-xs text-arc-muted mt-1">
                      Client ({task.client_address.substring(0, 6)}...) locked {task.price_usdc} USDC.
                    </p>
                    {task.tx_lock_hash && (
                      <a href={`https://testnet.arcscan.app/tx/${task.tx_lock_hash}`} target="_blank" rel="noopener noreferrer" className="text-arc-pink text-[10px] hover:underline font-mono mt-2 block">
                        TX Hash: {task.tx_lock_hash.substring(0, 16)}...{task.tx_lock_hash.substring(48)} ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* Step 2 (Optional A2A) */}
                {task.subcontract_agent_id && (
                  <div className="flex gap-4 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-arc-card border border-arc-purple/50 text-arc-purple flex items-center justify-center font-bold text-xs shadow-md">
                      2
                    </div>
                    <div className="flex-1 bg-arc-card/50 border border-arc-purple/10 rounded-2xl p-4">
                      <div className="flex justify-between items-start">
                        <h5 className="text-sm font-bold text-arc-text">Agent-to-Agent Autonomous Delegation</h5>
                        <span className="text-[10px] bg-arc-purple/15 text-arc-purple border border-arc-purple/25 px-2 py-0.5 rounded-full font-mono font-semibold">A2A FLOW</span>
                      </div>
                      <p className="text-xs text-arc-muted mt-1">
                        Primary Agent <strong>{task.agent_name}</strong> subcontracted task to <strong>{task.subcontract_agent_name}</strong> for <strong>{task.subcontract_price_usdc} USDC</strong>.
                      </p>
                      
                      <div className="bg-arc-bg/50 border border-arc-border rounded-xl p-3 mt-3 text-xs space-y-2">
                        <div>
                          <span className="text-arc-muted font-semibold block text-[10px] uppercase">Delegated Prompt:</span>
                          <span className="text-arc-text italic">"{task.subcontract_prompt}"</span>
                        </div>
                        <div>
                          <span className="text-arc-muted font-semibold block text-[10px] uppercase">Sub-Agent Response:</span>
                          <span className="text-arc-text whitespace-pre-wrap">{task.subcontract_ai_result}</span>
                        </div>
                      </div>

                      {task.subcontract_tx_hash && (
                        <div className="text-[10px] mt-3 border-t border-arc-border/40 pt-2 flex items-center justify-between">
                          <span className="text-arc-muted">Circle Dev-Controlled Wallet Transfer:</span>
                          {task.subcontract_tx_hash.startsWith("mock-") ? (
                            <span className="text-arc-pink font-mono">{task.subcontract_tx_hash.substring(0, 20)}...</span>
                          ) : (
                            <a href={`https://testnet.arcscan.app/tx/${task.subcontract_tx_hash}`} target="_blank" rel="noopener noreferrer" className="text-arc-pink hover:underline font-mono">
                              TX: {task.subcontract_tx_hash.substring(0, 12)}... ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                <div className="flex gap-4 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-arc-card border border-arc-border text-arc-pink flex items-center justify-center font-bold text-xs shadow-md">
                    {task.subcontract_agent_id ? 3 : 2}
                  </div>
                  <div className="flex-1 bg-arc-card/50 border border-arc-border rounded-2xl p-4">
                    <div className="flex justify-between items-start">
                      <h5 className="text-sm font-bold text-arc-text">Payout Disbursed to Agent</h5>
                      <span className="text-[10px] bg-arc-green/10 text-arc-green border border-arc-green/20 px-2 py-0.5 rounded-full font-mono">COMPLETED</span>
                    </div>
                    <p className="text-xs text-arc-muted mt-1">
                      On-chain escrow releasing payment to <strong>{task.agent_name}</strong> (minus 5% platform fee).
                    </p>
                    {task.tx_complete_hash && (
                      <a href={`https://testnet.arcscan.app/tx/${task.tx_complete_hash}`} target="_blank" rel="noopener noreferrer" className="text-arc-pink text-[10px] hover:underline font-mono mt-2 block">
                        TX Hash: {task.tx_complete_hash.substring(0, 16)}...{task.tx_complete_hash.substring(48)} ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Shelby Storage */}
            {task.shelby_hash && (
              <div className="bg-arc-card/40 border border-arc-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🐚</span>
                  <div className="text-left">
                    <h5 className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider">Shelby Hot Storage Backup</h5>
                    <p className="text-arc-muted text-xs mt-0.5">Verified data snapshot saved permanently on Shelby Protocol (Aptos).</p>
                    {!task.shelby_hash.startsWith("mock-") && (
                      <p className="text-[#00f0ff]/70 text-[10px] font-mono mt-1 max-w-[250px] truncate">{task.shelby_hash}</p>
                    )}
                  </div>
                </div>
                <a
                  href={
                    task.shelby_hash.startsWith("mock-") ? "#" :
                    task.shelby_hash.startsWith("https://") ? task.shelby_hash :
                    `https://explorer.shelby.xyz/shelbynet/${task.shelby_hash}`
                  }
                  target={task.shelby_hash.startsWith("mock-") ? undefined : "_blank"}
                  rel={task.shelby_hash.startsWith("mock-") ? undefined : "noopener noreferrer"}
                  className="px-3 py-1.5 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 text-xs font-semibold transition-all"
                  onClick={(e) => {
                    if (task.shelby_hash.startsWith("mock-")) {
                      e.preventDefault();
                      alert(`Mock Shelby Hash:\n${task.shelby_hash}`);
                    }
                  }}
                >
                  {task.shelby_hash.startsWith("mock-") ? "Simulated Upload" : "Open Blob ↗"}
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-center mt-6">
        <Link to="/marketplace" className="text-arc-pink hover:underline text-sm font-semibold">
          ← Back to Marketplace
        </Link>
      </div>
    </div>
  );
}

