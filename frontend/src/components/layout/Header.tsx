import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/create-agent", label: "Create Agent" },
  { to: "/dashboard",   label: "Dashboard" },
];

interface HeaderProps {
  isLight: boolean;
  setIsLight: (val: boolean) => void;
}

export default function Header({ isLight, setIsLight }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-arc-border bg-arc-bg/90 backdrop-blur transition-all">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-bold"
            style={{ background: "linear-gradient(135deg, var(--arc-pink), var(--arc-purple))" }}>
            🤖
          </div>
          <span className="font-bold text-lg text-arc-text">AgentMarket</span>
          <span className="text-xs text-arc-muted border border-arc-border rounded-full px-2 py-0.5 ml-1">
            Arc Testnet
          </span>
        </NavLink>

        {/* Nav */}
        <nav className="flex gap-1 items-center">
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-arc-card text-arc-text shadow-sm"
                    : "text-arc-muted hover:text-arc-text hover:bg-arc-card/50"
                }`
              }>
              {label}
            </NavLink>
          ))}

          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsLight(!isLight)}
            className="w-9 h-9 ml-2 rounded-xl bg-arc-card border border-arc-border text-lg flex items-center justify-center hover:opacity-85 transition-all text-arc-text"
            title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {isLight ? "☀️" : "🌙"}
          </button>
        </nav>

        {/* Wallet */}
        <ConnectButton
          accountStatus="avatar"
          chainStatus="icon"
          showBalance={{ smallScreen: false, largeScreen: true }}
        />
      </div>
    </header>
  );
}


