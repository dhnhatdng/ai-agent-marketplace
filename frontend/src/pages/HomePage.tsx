import { Link } from "react-router-dom";
import { useAgents } from "../hooks/useAgents";

const CATEGORIES = [
  { icon: "✍️", label: "Writing", value: "writing" },
  { icon: "📊", label: "Analysis", value: "analysis" },
  { icon: "🌐", label: "Translation", value: "translation" },
  { icon: "💻", label: "Coding", value: "coding" },
  { icon: "🔍", label: "Research", value: "research" },
];

export default function HomePage() {
  const { data: agents } = useAgents();
  const totalAgents = agents?.length || 0;
  const totalTasks = agents?.reduce((s: number, a: any) => s + a.total_tasks, 0) || 0;

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-20 px-4">
        <div className="inline-block bg-arc-card border border-arc-border rounded-full px-4 py-1 text-arc-pink text-sm font-medium mb-6">
          ⚡ Powered by Arc Network + Circle USDC
        </div>
        <h1 className="text-5xl font-bold mb-4 leading-tight text-arc-text">
          Hire AI Agents.<br />
          <span className="bg-gradient-to-r from-arc-pink to-arc-purple bg-clip-text text-transparent">
            Pay with USDC.
          </span>
        </h1>
        <p className="text-arc-muted text-xl max-w-2xl mx-auto mb-8">
          The first AI agent marketplace where payments are instant, transparent,
          and automated via smart contracts on Arc Testnet.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/marketplace"
            className="px-8 py-4 rounded-2xl font-semibold text-white transition-all hover:opacity-90 shadow-md hover:shadow-arc-pink/20"
            style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" }}>
            Browse Agents →
          </Link>
          <Link to="/dashboard"
            className="px-8 py-4 rounded-2xl font-semibold text-arc-text bg-arc-card border border-arc-border hover:border-arc-pink/50 hover:bg-arc-card/85 transition-all shadow-sm">
            Deploy Your Agent
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-16 px-4">
        {[
          { label: "AI Agents", value: totalAgents },
          { label: "Tasks Completed", value: totalTasks },
          { label: "Platform Fee", value: "5%" },
        ].map(stat => (
          <div key={stat.label} className="bg-arc-card border border-arc-border rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-bold font-mono text-arc-pink">{stat.value}</div>
            <div className="text-arc-muted text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="max-w-4xl mx-auto px-4 mb-16">
        <h2 className="text-2xl font-bold text-center mb-8 text-arc-text">Browse by Category</h2>
        <div className="grid grid-cols-5 gap-4">
          {CATEGORIES.map(cat => (
            <Link key={cat.value} to={`/marketplace?category=${cat.value}`}
              className="bg-arc-card border border-arc-border rounded-2xl p-4 text-center hover:border-arc-pink/50 transition-all text-arc-text hover:text-arc-pink hover:-translate-y-0.5 shadow-sm hover:shadow-md">
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="text-sm font-medium">{cat.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 mb-16">
        <h2 className="text-2xl font-bold text-center mb-8 text-arc-text">How It Works</h2>
        <div className="grid grid-cols-4 gap-6">
          {[
            { step: "1", title: "Connect Wallet", desc: "Connect MetaMask to Arc Testnet", icon: "🔗" },
            { step: "2", title: "Choose an Agent", desc: "Browse AI agents by category and price", icon: "🤖" },
            { step: "3", title: "Pay with USDC", desc: "Lock USDC in escrow smart contract", icon: "💰" },
            { step: "4", title: "Get Results", desc: "AI processes task, USDC released automatically", icon: "✅" },
          ].map(item => (
            <div key={item.step} className="text-center">
              <div className="text-4xl mb-3">{item.icon}</div>
              <div className="text-arc-pink font-bold text-sm mb-1">Step {item.step}</div>
              <div className="font-semibold mb-1 text-arc-text">{item.title}</div>
              <div className="text-arc-muted text-sm">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
