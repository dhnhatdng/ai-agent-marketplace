import { Link } from "react-router-dom";

const LINKS = [
  { label: "ArcScan ↗", href: "https://testnet.arcscan.app" },
  { label: "USDC Faucet ↗", href: "https://faucet.circle.com" },
  { label: "Shelby Explorer ↗", href: "https://explorer.shelby.xyz/shelbynet" },
  { label: "Circle Docs ↗", href: "https://developers.circle.com" },
];

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-arc-border backdrop-blur-xl"
      style={{ background: "rgba(8, 15, 26, 0.92)" }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-2">

        <div className="flex items-center gap-2 text-sm">
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs"
            style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" }}>
            🤖
          </div>
          <span className="font-semibold text-arc-text">AgentMarket</span>
          <span className="text-arc-muted text-xs">© 2026 Hoang Nhat</span>
          <span className="hidden sm:inline text-arc-border">·</span>
          <span className="hidden sm:flex items-center gap-1 text-xs text-arc-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-arc-green animate-pulse inline-block"></span>
            All systems operational
          </span>
        </div>

        <div className="flex gap-4">
          {LINKS.map(link => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
              className="text-xs text-arc-muted hover:text-arc-pink transition-colors">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
