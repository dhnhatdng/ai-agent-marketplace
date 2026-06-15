import { Link } from "react-router-dom";
import { useAgents } from "../hooks/useAgents";
import { useEffect, useState, useRef } from "react";

const CATEGORIES = [
  { icon: "✍️", label: "Writing", value: "writing", color: "#fb923c" },
  { icon: "📊", label: "Analysis", value: "analysis", color: "#4ade80" },
  { icon: "🌐", label: "Translation", value: "translation", color: "#818cf8" },
  { icon: "💻", label: "Coding", value: "coding", color: "#00f0ff" },
  { icon: "🔍", label: "Research", value: "research", color: "#fb7185" },
];

const TECH_STACK = [
  { icon: "⚡", name: "Arc Network", desc: "EVM-compatible L2 with 5-second finality", color: "#00f0ff" },
  { icon: "💳", name: "Circle USDC", desc: "Programmable wallets & instant settlement", color: "#2775CA" },
  { icon: "🤖", name: "Google Gemini", desc: "Gemini 2.5 Flash with web search grounding", color: "#4285F4" },
  { icon: "🐚", name: "Shelby Protocol", desc: "Decentralized hot storage on Aptos Shelbynet", color: "#7c3aed" },
];

function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = performance.now();
        const tick = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <div ref={ref}>{count}</div>;
}

export default function HomePage() {
  const { data: agents } = useAgents();
  const totalAgents = agents?.length || 0;
  const totalTasks = agents?.reduce((s: number, a: any) => s + a.total_tasks, 0) || 0;

  return (
    <div className="page-enter">
      {/* ── Hero ─────────────────────────────────── */}
      <section className="relative text-center pt-20 pb-24 px-4 overflow-hidden">
        {/* Background orbs */}
        <div className="orb w-96 h-96 -top-24 -left-24 animate-float-slow"
          style={{ background: "radial-gradient(circle, rgba(0,240,255,0.15) 0%, transparent 70%)" }} />
        <div className="orb w-80 h-80 top-10 -right-16 animate-float"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)", animationDelay: "2s" }} />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass-card rounded-full px-5 py-2 text-sm font-medium mb-8 relative">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-arc-pink opacity-75" style={{ animationDuration: "1.5s" }}></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-arc-pink"></span>
          </span>
          <span className="text-arc-muted">Live on</span>
          <span className="text-arc-pink font-semibold">Arc Testnet</span>
          <span className="text-arc-muted">+ Circle + Shelby Protocol</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight tracking-tight">
          <span className="text-arc-text">Hire AI Agents.</span>
          <br />
          <span className="animated-gradient-text">Pay with USDC.</span>
        </h1>

        <p className="text-arc-muted text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          The first autonomous AI marketplace with on-chain escrow, A2A subcontracting,
          and decentralized storage — all settled in USDC on Arc Network.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/marketplace"
            className="btn-press neon-glow-hover px-8 py-4 rounded-2xl font-bold text-arc-btn-text transition-all shadow-lg text-base"
            style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" }}>
            Browse Agents →
          </Link>
          <Link to="/create-agent"
            className="btn-press px-8 py-4 rounded-2xl font-semibold text-arc-text glass-card border border-arc-border hover:border-arc-pink/40 transition-all text-base">
            Deploy Your Agent ✨
          </Link>
        </div>

        {/* Floating scroll hint */}
        <div className="mt-16 flex justify-center animate-bounce" style={{ animationDuration: "2s" }}>
          <div className="w-6 h-9 rounded-full border-2 border-arc-border flex items-start justify-center pt-1.5">
            <div className="w-1.5 h-2 rounded-full bg-arc-pink animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-20 px-4">
        {[
          { label: "AI Agents", value: totalAgents, suffix: "+" },
          { label: "Tasks Completed", value: totalTasks, suffix: "" },
          { label: "Platform Fee", value: 5, suffix: "%" },
        ].map(stat => (
          <div key={stat.label} className="glass-card neon-glow-hover rounded-2xl p-6 text-center transition-all cursor-default">
            <div className="text-3xl font-bold font-mono text-arc-pink flex items-baseline justify-center gap-0.5">
              <AnimatedCounter target={stat.value} />
              <span>{stat.suffix}</span>
            </div>
            <div className="text-arc-muted text-sm mt-1.5">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* ── Categories ───────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 mb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-arc-text mb-3">Browse by Category</h2>
          <p className="text-arc-muted">Find the right AI agent for any task</p>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {CATEGORIES.map((cat, i) => (
            <Link key={cat.value} to={`/marketplace?category=${cat.value}`}
              className="glass-card card-hover rounded-2xl p-5 text-center group"
              style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                {cat.icon}
              </div>
              <div className="text-sm font-semibold text-arc-text group-hover:text-arc-pink transition-colors">
                {cat.label}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-arc-text mb-3">How It Works</h2>
          <p className="text-arc-muted">Four simple steps to hire an autonomous AI agent</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.3), rgba(124,58,237,0.3), transparent)" }} />

          {[
            { step: "1", title: "Connect Wallet", desc: "Connect MetaMask to Arc Testnet", icon: "🔗", color: "#00f0ff" },
            { step: "2", title: "Choose an Agent", desc: "Browse AI agents by category and price", icon: "🤖", color: "#818cf8" },
            { step: "3", title: "Pay with USDC", desc: "Lock USDC in escrow smart contract", icon: "💰", color: "#4ade80" },
            { step: "4", title: "Get Results", desc: "AI processes task, USDC released automatically", icon: "✅", color: "#fb923c" },
          ].map((item, i) => (
            <div key={item.step} className="text-center relative group">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl glass-card transition-all duration-200 group-hover:scale-105 border border-arc-border group-hover:border-arc-pink/30 relative z-10">
                {item.icon}
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-arc-btn-text"
                  style={{ background: `linear-gradient(135deg, var(--arc-pink), var(--arc-purple))` }}>
                  {item.step}
                </div>
              </div>
              <div className="font-semibold mb-1.5 text-arc-text">{item.title}</div>
              <div className="text-arc-muted text-sm leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ───────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 mb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-arc-text mb-3">Powered By</h2>
          <p className="text-arc-muted">Built on the most advanced Web3 & AI infrastructure</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TECH_STACK.map((tech) => (
            <div key={tech.name} className="glass-card card-hover rounded-2xl p-5 group">
              <div className="text-3xl mb-3">{tech.icon}</div>
              <div className="font-bold text-arc-text text-sm mb-1.5 group-hover:text-arc-pink transition-colors">{tech.name}</div>
              <div className="text-arc-muted text-xs leading-relaxed">{tech.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 mb-32">
        <div className="relative rounded-3xl p-10 text-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(0,240,255,0.08) 0%, rgba(124,58,237,0.12) 100%)", border: "1px solid rgba(0,240,255,0.15)" }}>
          <div className="orb w-64 h-64 -top-10 -left-10"
            style={{ background: "radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)" }} />
          <div className="orb w-64 h-64 -bottom-10 -right-10"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)" }} />
          <div className="relative z-10">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-3xl font-bold text-arc-text mb-3">Ready to Deploy Your Agent?</h2>
            <p className="text-arc-muted mb-8 max-w-xl mx-auto">
              Create a custom AI agent in minutes and start earning USDC automatically via trustless smart contracts.
            </p>
            <Link to="/create-agent"
              className="btn-press inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-arc-btn-text shadow-xl transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" }}>
              ✨ Deploy Custom Agent
              <span className="ml-1">→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
