import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useCreateAgent } from "../hooks/useAgents";

const CATEGORY_ICONS: Record<string, string> = {
  writing: "✍️",
  analysis: "📊",
  translation: "🌐",
  coding: "💻",
  research: "🔍",
};

export default function CreateAgentPage() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const createAgent = useCreateAgent();

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("writing");
  const [priceUsdc, setPriceUsdc] = useState("1.0");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setFormError("Please connect your wallet first.");
      return;
    }
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
        model,
      });

      setFormSuccess("Agent deployed successfully on the marketplace!");
      
      // Clear inputs
      setName("");
      setDescription("");
      setSystemPrompt("");
      
      // Redirect after 1.5 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || "Failed to deploy agent");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Deploy Custom AI Agent</h1>
        <p className="text-arc-muted">Create and monetize your own autonomous AI Assistant with custom pricing and prompts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-arc-card border border-arc-border rounded-3xl p-8 shadow-sm">
            <form onSubmit={handleDeploy} className="space-y-5">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">
                  ⚠️ {formError}
                </div>
              )}
              {formSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl text-sm">
                  ✨ {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-arc-muted mb-1.5 uppercase tracking-wider">Agent Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Translation Bot"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-arc-bg border border-arc-border rounded-xl px-4 py-2.5 text-arc-text outline-none focus:border-arc-pink/50 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-arc-muted mb-1.5 uppercase tracking-wider">Price (USDC)</label>
                  <input
                    required
                    type="number"
                    step="0.05"
                    min="0.05"
                    placeholder="e.g. 1.0"
                    value={priceUsdc}
                    onChange={e => setPriceUsdc(e.target.value)}
                    className="w-full bg-arc-bg border border-arc-border rounded-xl px-4 py-2.5 text-arc-text outline-none focus:border-arc-pink/50 transition-all text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-arc-muted mb-1.5 uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-arc-bg border border-arc-border rounded-xl px-3 py-2.5 text-arc-text outline-none focus:border-arc-pink/50 transition-all text-sm"
                  >
                    <option value="writing">✍️ Writing</option>
                    <option value="analysis">📊 Analysis</option>
                    <option value="translation">🌐 Translation</option>
                    <option value="coding">💻 Coding</option>
                    <option value="research">🔍 Research</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-arc-muted mb-1.5 uppercase tracking-wider">AI Engine Model</label>
                  <select
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="w-full bg-arc-bg border border-arc-border rounded-xl px-3 py-2.5 text-arc-text outline-none focus:border-arc-pink/50 transition-all text-sm"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                    <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Fast)</option>
                    <option value="gpt-4o">GPT-4o (Standard)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-arc-muted mb-1.5 uppercase tracking-wider">Short Description</label>
                <input
                  required
                  type="text"
                  placeholder="Short summary of what this agent excels at..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-arc-bg border border-arc-border rounded-xl px-4 py-2.5 text-arc-text outline-none focus:border-arc-pink/50 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-arc-muted mb-1.5 uppercase tracking-wider">System Prompt (AI Persona)</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Define the behavior, rules, and style of your Agent. Example: 'You are an expert crypto translator. Translate the text into Vietnamese while keeping technical terms correct.'"
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  className="w-full bg-arc-bg border border-arc-border rounded-xl px-4 py-2.5 text-arc-text outline-none focus:border-arc-pink/50 transition-all text-sm resize-y"
                />
              </div>

              {isConnected ? (
                <button
                  type="submit"
                  disabled={isDeploying}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-arc-pink/20 hover:shadow-arc-pink/35 disabled:opacity-50 transition-all duration-200 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" }}
                >
                  {isDeploying ? "Deploying & Provisioning Circle Wallet..." : "🚀 Deploy Custom Agent"}
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    disabled
                    className="w-full py-3.5 bg-arc-border/30 border border-arc-border rounded-xl text-sm font-bold text-arc-muted cursor-not-allowed"
                  >
                    🔌 Connect Wallet in Header to Deploy
                  </button>
                  <p className="text-center text-[11px] text-arc-muted">
                    Please connect your Web3 wallet (MetaMask) on the Arc Network to enable deployment.
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold">Live Card Preview</h3>
          
          <div className="bg-arc-card border border-arc-border rounded-2xl p-6 relative hover:shadow-lg transition-all duration-200 border-arc-pink/20 shadow-md">
            <div className="absolute top-3 right-3 bg-arc-pink/15 text-arc-pink text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-arc-pink/25">
              Live Preview
            </div>
            
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-arc-pink/10 border border-arc-pink/20">
                {CATEGORY_ICONS[category] || "🤖"}
              </div>
              <div className="text-right">
                <div className="text-arc-pink font-bold font-mono text-lg">{priceUsdc || "0.0"} USDC</div>
                <div className="text-arc-muted text-xs">per task</div>
              </div>
            </div>

            <h3 className="font-bold text-lg mb-2 truncate">{name || "Your Agent's Name"}</h3>
            <p className="text-arc-muted text-sm mb-4 line-clamp-2 h-10">
              {description || "The short description you type on the left will display here..."}
            </p>

            <div className="flex items-center justify-between text-sm border-t border-arc-border/40 pt-3">
              <span className="text-arc-muted capitalize font-medium">{category}</span>
              <div className="flex items-center gap-3 text-arc-muted text-xs">
                <span>⭐ 5.0</span>
                <span>✅ 0 tasks</span>
              </div>
            </div>
          </div>

          <div className="bg-arc-card/50 border border-arc-border rounded-2xl p-5 text-xs text-arc-muted space-y-2">
            <p className="font-semibold text-arc-text">What happens when you deploy?</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Your Agent is instantly registered in the marketplace DB.</li>
              <li>The backend interacts with Circle API to provision a dedicated non-custodial wallet address.</li>
              <li>Users can immediately find and hire your agent.</li>
              <li>You can monitor task metrics and withdraw earned USDC directly from your Dashboard page.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
