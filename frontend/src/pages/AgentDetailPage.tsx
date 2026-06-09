import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { v4 as uuidv4 } from "uuid";
import { useAgent, useAgentReviews } from "../hooks/useAgents";
import { useCreateTask } from "../hooks/useTasks";
import { useEscrow } from "../hooks/useEscrow";
import { useTokenBalance } from "../hooks/useTokenBalance";

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { data: agent, isLoading } = useAgent(id!);
  const { data: reviews, isLoading: isLoadingReviews } = useAgentReviews(id!);
  const createTask = useCreateTask();
  const { approveUSDC, lockFunds } = useEscrow();
  const { data: usdcBalance } = useTokenBalance(
    "0x3600000000000000000000000000000000000000",
    address
  );

  const [description, setDescription] = useState("");
  const [step, setStep] = useState<"idle" | "approving" | "locking" | "submitting" | "done">("idle");
  const [error, setError] = useState("");

  if (isLoading) return <div className="text-center py-16 text-arc-muted">Loading...</div>;
  if (!agent) return <div className="text-center py-16 text-arc-muted">Agent not found</div>;

  const handleHire = async () => {
    if (!address || !description.trim()) return;
    setError("");

    try {
      // Step 1: Approve USDC
      setStep("approving");
      await approveUSDC(agent.price_usdc);

      // Step 2: Lock USDC onchain
      setStep("locking");
      const taskId = uuidv4();
      const txHash = await lockFunds(taskId, agent.circle_wallet_address, agent.price_usdc);

      // Step 3: Notify backend
      setStep("submitting");
      const task = await createTask.mutateAsync({
        id: taskId,
        agent_id: agent.id,
        client_address: address,
        description: description.trim(),
        tx_lock_hash: txHash,
      });

      setStep("done");
      navigate(`/task/${task.id}`);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Transaction failed or rejected by user.");
      setStep("idle");
    }
  };

  const STEP_LABELS = {
    idle: `Hire Agent — ${agent.price_usdc} USDC`,
    approving: "1/3 — Approving USDC...",
    locking: "2/3 — Locking funds in escrow...",
    submitting: "3/3 — Submitting task...",
    done: "Done! Redirecting...",
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Agent info */}
      <div className="bg-arc-card border border-arc-border rounded-3xl p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{agent.name}</h1>
            <p className="text-arc-muted capitalize">{agent.category} Agent</p>
          </div>
          <div className="text-right">
            <div className="text-arc-pink font-bold font-mono text-2xl">{agent.price_usdc} USDC</div>
            <div className="text-arc-muted text-sm">per task</div>
          </div>
        </div>
        <p className="text-arc-text mb-6">{agent.description}</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Tasks Done", value: agent.total_tasks },
            { label: "Rating", value: `⭐ ${agent.rating.toFixed(1)}` },
            { label: "Total Earned", value: `${agent.total_earned.toFixed(2)} USDC` },
          ].map(stat => (
            <div key={stat.label} className="bg-arc-bg rounded-2xl p-4 text-center">
              <div className="font-bold text-lg font-mono">{stat.value}</div>
              <div className="text-arc-muted text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Task form */}
      <div className="bg-arc-card border border-arc-border rounded-3xl p-8">
        <h2 className="text-xl font-bold mb-4">Describe Your Task</h2>
        <textarea
          placeholder={`Tell the agent what you need...\nExample: "Write a 500-word blog post about blockchain technology in Vietnamese"`}
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={5}
          className="w-full bg-arc-bg border border-arc-border rounded-2xl p-4 text-arc-text outline-none focus:border-arc-pink/50 transition-all resize-none mb-4"
        />

        {/* Balance info */}
        {isConnected && usdcBalance !== undefined && (
          <div className="text-arc-muted text-sm mb-4">
            Your USDC balance: {Number(usdcBalance) / 1e6} USDC
            {Number(usdcBalance) / 1e6 < agent.price_usdc && (
              <span className="text-arc-error ml-2">⚠️ Insufficient balance</span>
            )}
          </div>
        )}

        {error && (
          <div className="bg-arc-error/10 border border-arc-error/30 rounded-xl p-3 text-arc-error text-sm mb-4">
            {error}
          </div>
        )}

        {/* Payment summary */}
        <div className="bg-arc-bg rounded-2xl p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between text-arc-muted">
            <span>Task fee</span><span>{agent.price_usdc} USDC</span>
          </div>
          <div className="flex justify-between text-arc-muted">
            <span>Platform fee (5%)</span><span>{(agent.price_usdc * 0.05).toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between text-arc-muted">
            <span>Agent receives</span><span className="text-arc-success">{(agent.price_usdc * 0.95).toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between font-bold border-t border-arc-border pt-2">
            <span>You pay</span><span className="text-arc-pink">{agent.price_usdc} USDC</span>
          </div>
        </div>

        {!isConnected ? (
          <div className="flex justify-center"><ConnectButton /></div>
        ) : (
          <button
            onClick={handleHire}
            disabled={step !== "idle" || !description.trim() || (usdcBalance !== undefined && Number(usdcBalance) / 1e6 < agent.price_usdc)}
            className="w-full py-4 rounded-2xl font-semibold transition-all"
            style={{
              background: step === "idle" && description.trim() ? "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" : "var(--arc-border)",
              color: step === "idle" && description.trim() ? "var(--arc-btn-text)" : "var(--arc-muted)",
            }}>
            {STEP_LABELS[step]}
          </button>
         )}
      </div>

      {/* Reviews Section */}
      <div className="bg-arc-card border border-arc-border rounded-3xl p-8 mt-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span>💬 Agent Reviews</span>
          <span className="text-sm font-normal text-arc-muted">
            ({reviews?.length || 0} reviews)
          </span>
        </h2>

        {isLoadingReviews ? (
          <div className="text-arc-muted text-sm">Loading reviews...</div>
        ) : !reviews || reviews.length === 0 ? (
          <div className="text-center py-8 bg-arc-bg/30 rounded-2xl border border-dashed border-arc-border">
            <span className="text-arc-muted text-sm">No reviews yet for this agent.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev: any) => (
              <div key={rev.id} className="bg-arc-bg/50 border border-arc-border rounded-2xl p-5 transition-all hover:border-arc-purple/20">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-sm font-semibold text-arc-text font-mono">
                      {rev.client_address.substring(0, 6)}...{rev.client_address.substring(38)}
                    </span>
                    <div className="text-arc-pink text-xs font-mono mt-1">
                      {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                    </div>
                  </div>
                  <span className="text-xs text-arc-muted font-mono">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
                {rev.comment && (
                  <p className="text-arc-muted text-sm italic mt-2">"{rev.comment}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
