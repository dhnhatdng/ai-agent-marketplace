import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAgentsByOwner, useCreateAgent, useOwnerEarnings } from "../hooks/useAgents";

const API = import.meta.env.VITE_API_URL;

function EarningsChart({ data }: { data: { date: string; earnings: number }[] }) {
  const width = 500;
  const height = 150;
  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 20;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const maxVal = Math.max(...data.map(d => d.earnings), 0.5);
  const stepX = chartWidth / (data.length - 1 || 1);
  
  // Calculate coordinates
  const points = data.map((d, i) => {
    const x = paddingLeft + i * stepX;
    const y = paddingTop + chartHeight * (1 - d.earnings / maxVal);
    return { x, y, val: d.earnings, date: d.date };
  });
  
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : "";
    
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--arc-pink)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--arc-purple)" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
        const y = paddingTop + chartHeight * ratio;
        const val = maxVal * (1 - ratio);
        return (
          <g key={idx} className="opacity-15 font-mono text-[9px] fill-arc-muted">
            <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--arc-purple)" strokeWidth="1" strokeDasharray="3 3" />
            <text x={paddingLeft - 8} y={y + 3} textAnchor="end">{val.toFixed(1)}</text>
          </g>
        );
      })}
      
      {/* Area fill */}
      {areaPath && <path d={areaPath} fill="url(#chartGrad)" />}
      
      {/* Line */}
      {linePath && <path d={linePath} fill="none" stroke="var(--arc-pink)" strokeWidth="2" strokeLinecap="round" />}
      
      {/* Data points & X axis */}
      {points.map((p, idx) => (
        <g key={idx}>
          <circle cx={p.x} cy={p.y} r="3" fill="var(--arc-card)" stroke="var(--arc-pink)" strokeWidth="1.5" className="hover:scale-150 transition-all cursor-pointer" />
          <text x={p.x} y={p.y - 8} fill="var(--arc-text)" className="font-mono text-[8px] font-bold opacity-0 hover:opacity-100 transition-opacity" textAnchor="middle">
            {p.val.toFixed(2)}
          </text>
          <text x={p.x} y={height - 4} fill="var(--arc-muted)" className="font-mono text-[9px]" textAnchor="middle">
            {p.date}
          </text>
        </g>
      ))}
    </svg>
  );
}

function AgentWalletRow({ agent, onWithdrawClick }: { agent: any; onWithdrawClick: (agent: any) => void }) {
  const { data: balanceData, isLoading, refetch } = useQuery({
    queryKey: ["agent-balance", agent.id],
    queryFn: () => axios.get(`${API}/api/agents/${agent.id}/balance`).then(r => r.data.data),
    refetchInterval: 10_000,
  });

  const balance = balanceData?.balance ?? 0;

  return (
    <div className="bg-arc-bg border border-arc-border rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-arc-purple/40">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl font-bold">{agent.name}</span>
          <span className="px-2 py-0.5 rounded-md bg-arc-card border border-arc-border text-xs text-arc-muted capitalize">
            {agent.category}
          </span>
        </div>
        <p className="text-sm text-arc-muted mb-3 line-clamp-2 max-w-xl">{agent.description}</p>
        <div className="text-xs text-arc-muted space-y-1 font-mono">
          <div>Circle Address: <a href={`https://testnet.arcscan.app/address/${agent.circle_wallet_address}`} target="_blank" rel="noopener noreferrer" className="text-arc-pink hover:underline">{agent.circle_wallet_address}</a></div>
          <div>Fee per task: <span className="text-arc-text">{agent.price_usdc} USDC</span></div>
        </div>
      </div>

      <div className="flex md:flex-col items-end gap-2 justify-between w-full md:w-auto border-t border-arc-border md:border-t-0 pt-4 md:pt-0">
        <div className="text-right">
          <div className="text-xs text-arc-muted">Agent Balance</div>
          <div className="text-2xl font-bold font-mono text-arc-success">
            {isLoading ? "..." : `${balance.toFixed(2)} USDC`}
          </div>
          <div className="text-[10px] text-arc-muted">Total tasks: {agent.total_tasks}</div>
        </div>
        
        <button
          onClick={() => onWithdrawClick({ ...agent, balance })}
          disabled={balance <= 0}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            balance > 0 
              ? "bg-arc-purple hover:bg-arc-purple/90 text-white" 
              : "bg-arc-border text-arc-muted cursor-not-allowed"
          }`}
        >
          Withdraw USDC
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  
  const { data: agents, isLoading: isLoadingAgents } = useAgentsByOwner(address);
  const createAgent = useCreateAgent();
  const { data: stats, isLoading: isLoadingStats } = useOwnerEarnings(address);

  // New Agent Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("writing");
  const [priceUsdc, setPriceUsdc] = useState("1.0");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [isDeploying, setIsDeploying] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Withdraw Modal State
  const [withdrawAgent, setWithdrawAgent] = useState<any | null>(null);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawStatus, setWithdrawStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [withdrawTx, setWithdrawTx] = useState("");
  const [withdrawError, setWithdrawError] = useState("");

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setFormError("");
    setFormSuccess("");
    
    if (!name || !description || !priceUsdc || !systemPrompt) {
      setFormError("All fields are required.");
      return;
    }

    try {
      setIsDeploying(true);
      await createAgent.mutateAsync({
        owner_address: address,
        name,
        description,
        category,
        price_usdc: parseFloat(priceUsdc),
        system_prompt: systemPrompt,
        model
      });
      
      setFormSuccess("Agent deployed successfully on marketplace!");
      setName("");
      setDescription("");
      setSystemPrompt("");
      setPriceUsdc("1.0");
      
      // Refresh list
      queryClient.invalidateQueries({ queryKey: ["agents", "owner", address] });
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || "Failed to deploy agent");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleWithdrawOpen = (agent: any) => {
    setWithdrawAgent(agent);
    setWithdrawAddress(address || "");
    setWithdrawAmount(agent.balance.toString());
    setWithdrawStatus("idle");
    setWithdrawError("");
    setWithdrawTx("");
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAgent || !withdrawAddress || !withdrawAmount) return;
    
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0 || amt > withdrawAgent.balance) {
      setWithdrawError("Invalid withdrawal amount.");
      return;
    }

    try {
      setWithdrawStatus("submitting");
      setWithdrawError("");
      
      const res = await axios.post(`${API}/api/agents/${withdrawAgent.id}/withdraw`, {
        destination_address: withdrawAddress,
        amount: withdrawAmount
      });
      
      setWithdrawTx(res.data.data.transferId);
      setWithdrawStatus("success");
      
      // Invalidate balance
      queryClient.invalidateQueries({ queryKey: ["agent-balance", withdrawAgent.id] });
      queryClient.invalidateQueries({ queryKey: ["agents", "owner", address] });
    } catch (err: any) {
      setWithdrawStatus("error");
      setWithdrawError(err.response?.data?.error || err.message || "Withdrawal failed");
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto text-center py-20 bg-arc-card border border-arc-border rounded-3xl p-8">
        <div className="text-5xl mb-4">🔑</div>
        <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-arc-muted mb-6 text-sm">You need to connect your MetaMask wallet to view your agent dashboard and deploy new agents.</p>
        <div className="flex justify-center"><ConnectButton /></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {/* Deployed Agents List */}
      <div className="lg:col-span-2 space-y-6">
        {/* Analytics Section */}
        {!isLoadingStats && stats && (
          <div className="bg-arc-card border border-arc-border rounded-3xl p-8 space-y-6">
            <h2 className="text-2xl font-bold">Dashboard Analytics</h2>
            
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-arc-bg border border-arc-border rounded-2xl p-4">
                <div className="text-arc-muted text-xs font-semibold uppercase tracking-wider mb-1">Total Earnings</div>
                <div className="text-2xl font-bold font-mono text-arc-success">{stats.totalEarnings?.toFixed(2)} USDC</div>
              </div>
              <div className="bg-arc-bg border border-arc-border rounded-2xl p-4">
                <div className="text-arc-muted text-xs font-semibold uppercase tracking-wider mb-1">Tasks Completed</div>
                <div className="text-2xl font-bold font-mono text-arc-text">{stats.totalTasks}</div>
              </div>
              <div className="bg-arc-bg border border-arc-border rounded-2xl p-4 col-span-2 md:col-span-1">
                <div className="text-arc-muted text-xs font-semibold uppercase tracking-wider mb-1">Active Agents</div>
                <div className="text-2xl font-bold font-mono text-arc-pink">{stats.activeAgents}</div>
              </div>
            </div>

            {/* SVG Earnings Chart */}
            <div className="bg-arc-bg border border-arc-border rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-arc-muted uppercase tracking-wider mb-4">7-Day Revenue Trend (USDC)</h3>
              <div className="w-full h-48 relative">
                {stats.chartData && stats.chartData.length > 0 ? (
                  <EarningsChart data={stats.chartData} />
                ) : (
                  <div className="flex items-center justify-center h-full text-arc-muted text-sm">No transaction history.</div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-arc-card border border-arc-border rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-2">Your Deployed Agents</h2>
          <p className="text-arc-muted text-sm mb-6">Manage your automated assistants, monitor earnings, and withdraw USDC payouts.</p>

          {isLoadingAgents ? (
            <div className="text-arc-muted text-center py-8">Loading agents...</div>
          ) : !agents || agents.length === 0 ? (
            <div className="text-center py-12 bg-arc-bg/50 border border-dashed border-arc-border rounded-2xl">
              <p className="text-arc-muted">You haven't deployed any agents yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent: any) => (
                <AgentWalletRow 
                  key={agent.id} 
                  agent={agent} 
                  onWithdrawClick={handleWithdrawOpen}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deployment Form */}
      <div className="space-y-6">
        <div className="bg-arc-card border border-arc-border rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-4">Deploy New Agent</h3>
          <form onSubmit={handleDeploy} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-arc-muted mb-1 uppercase tracking-wider">Agent Name</label>
              <input
                required
                type="text"
                placeholder="Content Writer Pro"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-arc-bg border border-arc-border rounded-xl px-4 py-2.5 text-arc-text outline-none focus:border-arc-pink/50 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-arc-muted mb-1 uppercase tracking-wider">Short Description</label>
              <textarea
                required
                rows={2}
                placeholder="Expert copywriter specializing in blockchain topics..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-arc-bg border border-arc-border rounded-xl px-4 py-2 text-arc-text outline-none focus:border-arc-pink/50 transition-all text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-arc-muted mb-1 uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-arc-bg border border-arc-border rounded-xl px-3 py-2.5 text-arc-text bg-arc-card outline-none focus:border-arc-pink/50 transition-all text-sm"
                >
                  <option value="writing">✍️ Writing</option>
                  <option value="analysis">📊 Analysis</option>
                  <option value="translation">🌐 Translation</option>
                  <option value="coding">💻 Coding</option>
                  <option value="research">🔍 Research</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-arc-muted mb-1 uppercase tracking-wider">Fee (USDC)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.1"
                  placeholder="1.5"
                  value={priceUsdc}
                  onChange={e => setPriceUsdc(e.target.value)}
                  className="w-full bg-arc-bg border border-arc-border rounded-xl px-4 py-2.5 text-arc-text outline-none focus:border-arc-pink/50 transition-all text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-arc-muted mb-1 uppercase tracking-wider">Model</label>
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-arc-bg border border-arc-border rounded-xl px-3 py-2.5 text-arc-text bg-arc-card outline-none focus:border-arc-pink/50 transition-all text-sm"
              >
                <option value="gpt-4o">GPT-4o (Premium)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-arc-muted mb-1 uppercase tracking-wider">System Prompt (Persona)</label>
              <textarea
                required
                rows={4}
                placeholder="Act as a professional writer. Complete tasks with SEO-optimized, punchy copy..."
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                className="w-full bg-arc-bg border border-arc-border rounded-xl px-4 py-2 text-arc-text outline-none focus:border-arc-pink/50 transition-all text-sm resize-none"
              />
            </div>

            {formError && (
              <div className="bg-arc-error/10 border border-arc-error/30 rounded-xl p-3 text-arc-error text-xs">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="bg-arc-success/10 border border-arc-success/30 rounded-xl p-3 text-arc-success text-xs">
                {formSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={isDeploying}
              className="w-full py-3 rounded-2xl font-semibold transition-all hover:opacity-90 disabled:bg-arc-border disabled:text-arc-muted"
              style={!isDeploying ? { background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))", color: "var(--arc-btn-text)" } : {}}
            >
              {isDeploying ? "Creating Circle Wallet..." : "Deploy Agent"}
            </button>
          </form>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {withdrawAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-arc-card border border-arc-border rounded-3xl p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setWithdrawAgent(null)}
              className="absolute top-4 right-4 text-arc-muted hover:text-arc-text text-xl"
            >
              ✕
            </button>
            
            <h3 className="text-xl font-bold mb-2">Withdraw USDC</h3>
            <p className="text-arc-muted text-xs mb-6">Transfer earnings from <strong>{withdrawAgent.name}</strong>'s developer wallet back to your MetaMask wallet.</p>

            {withdrawStatus === "success" ? (
              <div className="text-center space-y-4">
                <div className="text-5xl">🎉</div>
                <h4 className="font-bold text-arc-success text-lg">Withdrawal Triggered!</h4>
                <p className="text-sm text-arc-muted">Your transaction request has been processed successfully.</p>
                <div className="text-xs text-arc-pink break-all font-mono bg-arc-bg p-3 rounded-xl border border-arc-border">
                  Transfer Ref ID: {withdrawTx}
                </div>
                <button
                  onClick={() => setWithdrawAgent(null)}
                  className="w-full py-3 rounded-2xl bg-arc-border hover:opacity-90 text-arc-text font-semibold transition-all mt-4"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-arc-muted mb-1 uppercase tracking-wider">Destination Address</label>
                  <input
                    required
                    type="text"
                    value={withdrawAddress}
                    onChange={e => setWithdrawAddress(e.target.value)}
                    className="w-full bg-arc-bg border border-arc-border rounded-xl px-4 py-2.5 text-arc-text outline-none focus:border-arc-pink/50 transition-all text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-arc-muted mb-1 uppercase tracking-wider">Amount (Max: {withdrawAgent.balance} USDC)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={withdrawAgent.balance}
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    className="w-full bg-arc-bg border border-arc-border rounded-xl px-4 py-2.5 text-arc-text outline-none focus:border-arc-pink/50 transition-all text-sm font-mono"
                  />
                </div>

                {withdrawError && (
                  <div className="bg-arc-error/10 border border-arc-error/30 rounded-xl p-3 text-arc-error text-xs">
                    {withdrawError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={withdrawStatus === "submitting"}
                  className="w-full py-3 rounded-2xl bg-arc-purple hover:bg-arc-purple/90 text-white font-semibold transition-all"
                >
                  {withdrawStatus === "submitting" ? "Processing..." : `Withdraw ${withdrawAmount} USDC`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
