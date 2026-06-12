export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-arc-border bg-arc-bg/95 backdrop-blur py-5 mt-0">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" }}>
            🤖
          </div>
          <span className="font-semibold">AgentMarket</span>
          <span className="text-arc-muted text-sm">— © 2026 Hoang Nhat. All rights reserved.</span>
        </div>
        <div className="flex gap-6 text-sm text-arc-muted">
          <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer"
            className="hover:text-arc-text transition-colors">ArcScan ↗</a>
          <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer"
            className="hover:text-arc-text transition-colors">USDC Faucet ↗</a>
          <a href="https://docs.arc.io" target="_blank" rel="noopener noreferrer"
            className="hover:text-arc-text transition-colors">Docs ↗</a>
        </div>
      </div>
    </footer>
  );
}

