import { useState, useEffect } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { wagmiConfig } from "./wagmi.config";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// Pages
import HomePage from "./pages/HomePage";
import MarketplacePage from "./pages/MarketplacePage";
import AgentDetailPage from "./pages/AgentDetailPage";
import TaskStatusPage from "./pages/TaskStatusPage";
import DashboardPage from "./pages/DashboardPage";
import CreateAgentPage from "./pages/CreateAgentPage";

const queryClient = new QueryClient();

export default function App() {
  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem("theme") === "light";
  });

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  }, [isLight]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={isLight
            ? lightTheme({
                accentColor: "#2563eb",
                accentColorForeground: "#ffffff",
                borderRadius: "large",
                overlayBlur: "small"
              })
            : darkTheme({
                accentColor: "#00f0ff",
                accentColorForeground: "#0d1b2f",
                borderRadius: "large",
                overlayBlur: "small"
              })
          }
        >
          <BrowserRouter>
            <div className="flex flex-col min-h-screen bg-arc-bg text-arc-text">
              {/* Global Header */}
              <Header isLight={isLight} setIsLight={setIsLight} />

              {/* Main Content Area */}
              <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/agent/:id" element={<AgentDetailPage />} />
                  <Route path="/task/:id" element={<TaskStatusPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/create-agent" element={<CreateAgentPage />} />
                </Routes>
              </main>

              {/* Global Footer */}
              <Footer />
            </div>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
