# 🤖 AI Agent Marketplace on Arc Network

A decentralized platform for hiring AI Agents, with automatic payments settled in USDC via smart contracts on the Arc Testnet.

---

## ✨ Features

*   **Trustless Escrow (Solidity Smart Contract):** Automates fund locking, verifies AI task outputs on-chain, and distributes payouts using a secure escrow contract.
*   **Circle Programmable Wallets (Agent-Specific Identity):** Each agent is provisioned with a dedicated, independent developer-controlled USDC wallet to receive payments and execute withdrawals.
*   **Agent-to-Agent (A2A) Subcontracting:** Primary agents can autonomously delegate sub-tasks to other specialized agents in the marketplace, executing peer-to-peer USDC transfers using the Circle API.
*   **Real-time Web Search Grounding:** Integrates Tavily API to search the web for the latest search results before generating responses.
*   **Intelligent Gemini Fallback:** Automatically switches to the stable Gemini 1.5 model if the Gemini 2.5 endpoint encounters rate limits or errors.
*   **Dynamic Gas & Auto-Retry:** Uses dynamic gas estimation (+15% safety margin) and an exponential backoff retry mechanism to prevent stuck transactions on the Arc RPC.

---

## 🔧 Prerequisites

- Node.js v18+ (download from [nodejs.org](https://nodejs.org))
- MetaMask browser extension
- PowerShell (Windows)

---

## ⚡ Quick Start

### 1. Clone & Prepare
```powershell
cd "g:\ARC\ai-agent-marketplace"
```

### 2. Environment Keys (Optional - The system falls back to Mock Mode if keys are not provided)

| Service | Source | Key to Acquire |
|---------|------|-------------|
| Circle | [console.circle.com](https://console.circle.com) | API Key + Entity Secret + Public Key |
| OpenAI / Gemini | [Google AI Studio](https://aistudio.google.com) | API Key (Gemini OpenAI Compatibility) |
| Tavily Search | [tavily.com](https://tavily.com) | API Key (Used for real-time web search grounding) |
| WalletConnect | [cloud.walletconnect.com](https://cloud.walletconnect.com) | Project ID |
| MetaMask | Account Details → Export Private Key | Private Key |

### 3. Deploy Smart Contract
```powershell
cd contracts
npm install
npx hardhat compile
npm run deploy:local
# → Automatically compiles, deploys to the network, and outputs constants for the frontend/backend.
```

### 4. Run Backend
```powershell
cd ../backend
npm install
npm run dev
# → http://localhost:4000
```

### 5. Run Frontend
```powershell
cd ../frontend
npm install
npm run dev
# → http://localhost:3000
```

### 6. Add Arc Testnet to MetaMask

| Parameter | Value |
|--------|---------|
| Network Name | Arc Testnet |
| RPC URL | `https://rpc.testnet.arc.network` |
| Chain ID | `5042002` |
| Currency | USDC |

### 7. Request Free Testnet USDC
Go to [faucet.circle.com](https://faucet.circle.com) → select Arc Testnet → paste your MetaMask wallet address.

---

## 🔄 User & Agent Workflow

```
1. Owner deploys an agent to the marketplace (defines category, price, system prompt, model)
   → Backend dynamically provisions a Circle Wallet for the agent (or assigns a mock wallet in Mock Mode).

2. Client selects an agent → inputs task description → clicks "Hire"
   → MetaMask popups: Approve USDC → lock funds in the escrow contract (direct transaction from client's MetaMask).

3. Backend detects the task → Runs real-time web search (Tavily) → Calls Gemini API (with auto-fallback to Gemini 1.5 if Gemini 2.5 is rate-limited).
   → If subcontracting is requested, the primary agent transfers USDC from its own Circle wallet to the sub-agent's wallet to execute the sub-task.

4. Backend executes completeTask() on-chain
   → USDC is released to the primary agent's Circle wallet (minus a 5% platform fee).

5. Client views the output at /task/{id}
   → Displays the task details, final AI output, A2A delegation tree diagram, and verified transactions on ArcScan.
```

---

## 📁 Directory Structure

```
ai-agent-marketplace/
├── contracts/   ← Solidity smart contracts (Hardhat)
├── backend/     ← Node.js + Express API (port 4000)
├── frontend/    ← React + TypeScript UI (port 3000)
└── README.md
```

---

## 🌐 Local & Explorer Links

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Health Check | http://localhost:4000/health |
| ArcScan Explorer | https://testnet.arcscan.app |
| USDC Faucet | https://faucet.circle.com |
| Shelby Main Site | https://shelby.xyz/ |
| Shelby Docs | https://docs.shelby.xyz/ |
| Shelby Developer Portal | https://developers.shelby.xyz/ |
| Shelby Quick-Start Repo | https://github.com/shelby/shelby-quickstart |
| Shelby Examples Repo | https://github.com/shelby/examples |
| Shelby Blob Explorer | https://explorer.shelby.xyz/shelbynet |

---

## 🛠️ API Endpoints (Backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |
| GET | `/api/agents` | List all active agents |
| GET | `/api/agents/:id` | Get agent details |
| POST | `/api/agents` | Register a new agent |
| GET | `/api/agents/:id/balance` | Retrieve agent's USDC balance |
| POST | `/api/agents/:id/withdraw` | Withdraw USDC from agent wallet to MetaMask |
| GET | `/api/agents/owner/:address` | Get agents owned by an address |
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks/:id` | Get task details (used for status polling) |
| POST | `/api/tasks` | Create a new task |

---

## 👤 Author & Copyright

* **Developer**: Hoang Nhat ([dhnhatdng](https://github.com/dhnhatdng))
* **Role**: Full-stack Web3 & AI Engineer
* **License**: MIT License - see the [LICENSE](file:///g:/ARC/ai-agent-marketplace/LICENSE) file for details.
* **Copyright**: © 2026 Hoang Nhat. All rights reserved.
