import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/marketplace",   label: "Marketplace", icon: "🏪" },
  { to: "/create-agent",  label: "Create Agent", icon: "✨" },
  { to: "/dashboard",     label: "Dashboard",    icon: "📊" },
];

interface HeaderProps {
  isLight: boolean;
  setIsLight: (val: boolean) => void;
}

export default function Header({ isLight, setIsLight }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-arc-border backdrop-blur-xl transition-all"
      style={{ background: "rgba(8, 15, 26, 0.85)" }}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold transition-transform group-hover:scale-110 duration-200"
            style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" }}>
            🤖
          </div>
          <span className="font-bold text-base text-arc-text hidden sm:block">AgentMarket</span>
          <span className="hidden md:flex items-center gap-1 text-xs text-arc-muted border border-arc-border rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-arc-green animate-pulse inline-block"></span>
            Arc Testnet
          </span>
        </NavLink>

        {/* Nav */}
        <nav className="flex gap-1 items-center">
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `relative px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "text-arc-pink"
                    : "text-arc-muted hover:text-arc-text"
                }`
              }>
              {({ isActive }) => (
                <>
                  <span className="hidden lg:inline">{icon}</span>
                  <span>{label}</span>
                  {isActive && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-arc-pink" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Theme Toggle */}
          <button
            onClick={() => setIsLight(!isLight)}
            className="btn-press w-9 h-9 ml-1 rounded-xl glass-card border border-arc-border text-base flex items-center justify-center hover:border-arc-pink/30 transition-all"
            title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}>
            {isLight ? "☀️" : "🌙"}
          </button>
        </nav>

        {/* Wallet */}
        <div className="flex-shrink-0">
          <ConnectButton
            accountStatus="avatar"
            chainStatus="icon"
            showBalance={{ smallScreen: false, largeScreen: true }}
          />
        </div>
      </div>
    </header>
  );
}
