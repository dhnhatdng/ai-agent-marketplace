import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useCreateAgent } from "../hooks/useAgents";

const CATEGORIES = [
  { value: "writing",     icon: "✍️", label: "Writing",     desc: "Blog posts, copywriting, storytelling" },
  { value: "analysis",    icon: "📊", label: "Analysis",    desc: "Data insights, market research, reports" },
  { value: "translation", icon: "🌐", label: "Translation", desc: "Multi-language, localization, culture" },
  { value: "coding",      icon: "💻", label: "Coding",      desc: "Scripts, review, debugging, docs" },
  { value: "research",    icon: "🔍", label: "Research",    desc: "Web search, fact-check, summaries" },
];

const MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Recommended", icon: "🤖",
    desc: "Best balance of speed & intelligence. Supports web search grounding.", color: "#4285F4" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", badge: "Fast", icon: "⚡",
    desc: "Fastest response times for simpler tasks at lower cost.", color: "#34A853" },
  { value: "gpt-4o", label: "GPT-4o", badge: "Powerful", icon: "🧠",
    desc: "OpenAI's multimodal flagship model with broad reasoning.", color: "#10a37f" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", badge: "Economy", icon: "💨",
    desc: "Cost-efficient for straightforward, high-volume tasks.", color: "#9ca3af" },
];

const STEPS = [
  { id: 1, label: "Identity", icon: "🏷️" },
  { id: 2, label: "AI Engine", icon: "🤖" },
  { id: 3, label: "Prompt", icon: "💬" },
];

export default function CreateAgentPage() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const createAgent = useCreateAgent();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("writing");
  const [priceUsdc, setPriceUsdc] = useState("1.0");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [isDeploying, setIsDeploying] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedCategory = CATEGORIES.find(c => c.value === category)!;
  const selectedModel = MODELS.find(m => m.value === model)!;
  const charLimit = 500;

  const canNext1 = name.trim().length >= 3 && description.trim().length >= 10 && parseFloat(priceUsdc) >= 0.05;
  const canNext2 = !!model;
  const canDeploy = systemPrompt.trim().length >= 20;

  const handleDeploy = async () => {
    if (!address) { setFormError("Please connect your wallet first."); return; }
    setFormError("");
    try {
      setIsDeploying(true);
      await createAgent.mutateAsync({
        owner_address: address,
        name, description, category,
        price_usdc: parseFloat(priceUsdc),
        system_prompt: systemPrompt,
        model,
      });
      setIsSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || "Failed to deploy agent");
    } finally {
      setIsDeploying(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 page-enter">
        <div className="text-7xl mb-6 animate-bounce">🎉</div>
        <h2 className="text-3xl font-bold text-arc-text mb-3">Agent Deployed!</h2>
        <p className="text-arc-muted mb-2">Your AI agent is now live on the marketplace.</p>
        <p className="text-arc-muted text-sm">Redirecting to dashboard...</p>
        <div className="mt-8 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-arc-pink/30 border-t-arc-pink animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto page-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Deploy Custom AI Agent</h1>
        <p className="text-arc-muted text-sm">Create and monetize your autonomous AI assistant with custom pricing and prompts.</p>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-0 mb-10 max-w-sm">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <button onClick={() => step > s.id && setStep(s.id)}
              className={`flex flex-col items-center gap-1 group transition-all ${step > s.id ? "cursor-pointer" : "cursor-default"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                step === s.id ? "text-arc-btn-text shadow-lg scale-110" :
                step > s.id  ? "bg-arc-green/20 text-arc-green border border-arc-green/40" :
                "glass-card border border-arc-border text-arc-muted"
              }`} style={step === s.id ? { background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" } : {}}>
                {step > s.id ? "✓" : s.icon}
              </div>
              <span className={`text-xs font-medium ${step === s.id ? "text-arc-pink" : "text-arc-muted"}`}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-2 mt-[-12px] transition-colors duration-300"
                style={{ background: step > s.id ? "var(--arc-green)" : "var(--arc-border)" }} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form */}
        <div className="lg:col-span-7">
          {formError && (
            <div className="glass-card border border-red-500/30 text-red-400 p-4 rounded-xl text-sm mb-5 flex items-start gap-2">
              <span>⚠️</span> {formError}
            </div>
          )}

          {/* ─── Step 1: Identity ─────────── */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-lg font-bold text-arc-text">🏷️ Agent Identity</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-arc-muted mb-1.5 uppercase tracking-wider">Agent Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required
                    placeholder="e.g. DeFi Research Pro"
                    className="arc-input" />
                  {name.length > 0 && name.length < 3 && (
                    <p className="text-xs text-red-400 mt-1">Minimum 3 characters</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-arc-muted mb-1.5 uppercase tracking-wider">Price (USDC) *</label>
                  <div className="relative">
                    <input type="number" step="0.05" min="0.05" value={priceUsdc}
                      onChange={e => setPriceUsdc(e.target.value)} required
                      className="arc-input font-mono pr-16" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-arc-muted font-semibold">USDC</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-arc-muted mb-1.5 uppercase tracking-wider">Short Description *</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} required
                  placeholder="Short summary of what this agent excels at..."
                  className="arc-input" />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-arc-muted mb-3 uppercase tracking-wider">Category *</label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                      className={`btn-press flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                        category === cat.value
                          ? "border-arc-pink/50 text-arc-pink"
                          : "glass-card border-arc-border text-arc-muted hover:border-arc-pink/30"
                      }`}
                      style={category === cat.value ? { background: "rgba(0,240,255,0.08)" } : {}}>
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-xs font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => canNext1 && setStep(2)} disabled={!canNext1}
                className="btn-press w-full py-3.5 rounded-xl text-sm font-bold text-arc-btn-text shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" }}>
                Continue → AI Engine
              </button>
            </div>
          )}

          {/* ─── Step 2: AI Model ─────────── */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-lg font-bold text-arc-text">🤖 AI Engine Selection</h3>
              <div className="space-y-3">
                {MODELS.map(m => (
                  <button key={m.value} type="button" onClick={() => setModel(m.value)}
                    className={`btn-press w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                      model === m.value
                        ? "border-arc-pink/50"
                        : "glass-card border-arc-border hover:border-arc-pink/30"
                    }`}
                    style={model === m.value ? { background: "rgba(0,240,255,0.06)", borderColor: "rgba(0,240,255,0.4)" } : {}}>
                    <div className="text-2xl flex-shrink-0 mt-0.5">{m.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-arc-text text-sm">{m.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${m.color}20`, color: m.color, border: `1px solid ${m.color}30` }}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-arc-muted text-xs leading-relaxed">{m.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      model === m.value ? "border-arc-pink bg-arc-pink" : "border-arc-border"
                    }`}>
                      {model === m.value && <div className="w-2 h-2 rounded-full bg-arc-btn-text" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="btn-press flex-1 py-3.5 rounded-xl text-sm font-bold text-arc-muted glass-card border border-arc-border hover:border-arc-pink/30 transition-all">
                  ← Back
                </button>
                <button onClick={() => canNext2 && setStep(3)} disabled={!canNext2}
                  className="btn-press flex-1 py-3.5 rounded-xl text-sm font-bold text-arc-btn-text shadow-lg disabled:opacity-40 transition-all"
                  style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" }}>
                  Continue → Write Prompt
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Prompt ─────────────── */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-lg font-bold text-arc-text">💬 System Prompt (AI Persona)</h3>
              <div>
                <label className="block text-xs font-semibold text-arc-muted mb-1.5 uppercase tracking-wider">
                  Prompt * — Define how your agent thinks and responds
                </label>
                <div className="relative">
                  <textarea rows={8} value={systemPrompt} onChange={e => setSystemPrompt(e.target.value.slice(0, charLimit))} required
                    placeholder={`Example:\n"You are an expert DeFi research analyst. When given a topic, you search the web for the latest data, then provide a structured report with market trends, key players, risks, and an investment thesis."`}
                    className="arc-input resize-none leading-relaxed"
                    style={{ borderRadius: "12px", paddingBottom: "32px" }} />
                  <span className={`absolute bottom-3 right-4 text-xs font-mono ${systemPrompt.length > charLimit * 0.9 ? "text-orange-400" : "text-arc-muted"}`}>
                    {systemPrompt.length}/{charLimit}
                  </span>
                </div>
                <p className="text-xs text-arc-muted mt-2">
                  💡 Tip: Be specific about tone, format, and expertise. Agents with detailed prompts perform better.
                </p>
              </div>

              {isConnected ? (
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)}
                    className="btn-press flex-1 py-3.5 rounded-xl text-sm font-bold text-arc-muted glass-card border border-arc-border hover:border-arc-pink/30 transition-all">
                    ← Back
                  </button>
                  <button onClick={handleDeploy} disabled={isDeploying || !canDeploy}
                    className="btn-press flex-1 py-3.5 rounded-xl text-sm font-bold text-arc-btn-text shadow-lg shadow-arc-pink/20 disabled:opacity-50 transition-all"
                    style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" }}>
                    {isDeploying ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Deploying...
                      </span>
                    ) : "🚀 Deploy Agent to Marketplace"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button disabled className="w-full py-3.5 glass-card border border-arc-border rounded-xl text-sm font-bold text-arc-muted cursor-not-allowed">
                    🔌 Connect Wallet to Deploy
                  </button>
                  <p className="text-center text-xs text-arc-muted">Connect MetaMask with Arc Network to enable deployment</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-lg font-bold text-arc-text">Live Preview</h3>

          {/* Agent Card Preview */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-arc-pink/20">
            <div className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background: "linear-gradient(90deg, var(--arc-pink), var(--arc-purple))" }} />
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.15)" }}>
                {selectedCategory.icon}
              </div>
              <div className="text-right">
                <div className="text-arc-pink font-bold font-mono text-lg">{priceUsdc || "0.0"} USDC</div>
                <div className="text-arc-muted text-xs">per task</div>
              </div>
            </div>
            <h3 className="font-bold text-base mb-1.5 text-arc-text truncate">{name || "Your Agent's Name"}</h3>
            <p className="text-arc-muted text-sm mb-4 line-clamp-2 leading-relaxed" style={{ minHeight: "2.5rem" }}>
              {description || "The description you type will display here..."}
            </p>
            <div className="flex items-center justify-between">
              <span className={`badge-${category} text-xs font-semibold px-2.5 py-1 rounded-lg capitalize`}>
                {selectedCategory.icon} {selectedCategory.label}
              </span>
              <div className="flex items-center gap-2 text-xs text-arc-muted">
                <span>⭐ 5.0</span>
                <span className="text-arc-green">✓ 0</span>
              </div>
            </div>
          </div>

          {/* Deployment Info */}
          <div className="glass-card border border-arc-border rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-sm text-arc-text flex items-center gap-2">🚀 What happens when you deploy?</h4>
            <div className="space-y-3 text-xs text-arc-muted">
              {[
                { n: "1", title: "Instant Registration", desc: "Your agent is immediately listed publicly.", color: "arc-pink" },
                { n: "2", title: "Circle Wallet Provisioning", desc: "A secure USDC wallet is created automatically.", color: "arc-purple" },
                { n: "3", title: "Live Hiring Status", desc: "Clients can hire your agent via smart contract escrow.", color: "arc-pink" },
                { n: "4", title: "Revenue & Dashboard", desc: "Track tasks, withdraw accumulated USDC.", color: "arc-purple" },
              ].map(item => (
                <div key={item.n} className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono text-arc-btn-text text-xs"
                    style={{ background: `linear-gradient(135deg, var(--arc-pink), var(--arc-purple))` }}>
                    {item.n}
                  </span>
                  <div>
                    <strong className="text-arc-text block mb-0.5">{item.title}</strong>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected model pill */}
          {step >= 2 && (
            <div className="glass-card border border-arc-border rounded-xl p-3 flex items-center gap-3 text-sm">
              <span className="text-lg">{selectedModel.icon}</span>
              <div>
                <div className="font-semibold text-arc-text text-xs">{selectedModel.label}</div>
                <div className="text-arc-muted text-xs">{selectedModel.badge} model</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
