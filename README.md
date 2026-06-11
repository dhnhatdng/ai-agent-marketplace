# 🤖 AI Agent Marketplace on Arc Network

Nền tảng thuê AI Agent, thanh toán bằng USDC tự động qua smart contract trên Arc Testnet.

---

## 🔧 Yêu cầu hệ thống

- Node.js v18+ (tải tại [nodejs.org](https://nodejs.org))
- MetaMask browser extension
- PowerShell (Windows)

---

## ⚡ Chạy nhanh (Quick Start)

### 1. Clone & chuẩn bị
```powershell
cd "g:\ARC\ai-agent-marketplace"
```

### 2. Lấy API Keys cần thiết (Optional - Nếu không cung cấp, hệ thống tự động chạy Mock Mode)

| Service | Link | Key cần lấy |
|---------|------|-------------|
| Circle | [console.circle.com](https://console.circle.com) | API Key + Entity Secret + Public Key |
| OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) | API Key |
| WalletConnect | [cloud.walletconnect.com](https://cloud.walletconnect.com) | Project ID |
| MetaMask | Account Details → Export Private Key | Private Key |

### 3. Deploy Smart Contract
```powershell
cd contracts
npm install
npx hardhat compile
npm run deploy:local
# → Sẽ tự động lưu cấu hình và deploy contract lên local network, viết file constants cho frontend/backend
```

### 4. Chạy Backend
```powershell
cd ../backend
npm install
npm run dev
# → http://localhost:4000
```

### 5. Chạy Frontend
```powershell
cd ../frontend
npm install
npm run dev
# → http://localhost:3000
```

### 6. Thêm Arc Testnet vào MetaMask

| Trường | Giá trị |
|--------|---------|
| Network Name | Arc Testnet |
| RPC URL | `https://rpc.testnet.arc.network` |
| Chain ID | `5042002` |
| Currency | USDC |

### 7. Lấy USDC testnet miễn phí
Vào [faucet.circle.com](https://faucet.circle.com) → chọn Arc Testnet → paste địa chỉ MetaMask.

---

## 🔄 Luồng hoạt động

```
1. Owner deploy agent lên marketplace (chọn category, giá, system prompt)
   → Backend tạo Circle Wallet cho agent tự động (hoặc mock ví ngẫu nhiên trong Mock Mode)

2. Client chọn agent → nhập mô tả task → click "Hire"
   → MetaMask: Approve USDC → Lock funds vào escrow contract (trực tiếp qua ví MetaMask)

3. Backend nhận task → gọi GPT-4o (hoặc sinh câu trả lời thông minh dựa theo category trong Mock Mode)

4. Backend gọi completeTask() onchain
   → USDC tự động transfer đến agent wallet (trừ 5% platform fee)

5. Client xem kết quả tại /task/{id}
   → Kèm link transaction trên ArcScan để xác minh
```

---

## 📁 Cấu trúc project

```
ai-agent-marketplace/
├── contracts/   ← Solidity smart contracts (Hardhat)
├── backend/     ← Node.js + Express API (port 4000)
├── frontend/    ← React + TypeScript UI (port 3000)
└── README.md
```

---

## 🌐 URLs khi chạy local

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Health check | http://localhost:4000/health |
| ArcScan Explorer | https://testnet.arcscan.app |
| USDC Faucet | https://faucet.circle.com |

---

## 🛠️ API Endpoints (Backend)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/health` | Health check |
| GET | `/api/agents` | Danh sách agents |
| GET | `/api/agents/:id` | Chi tiết agent |
| POST | `/api/agents` | Tạo agent mới |
| GET | `/api/agents/:id/balance` | Số dư USDC của agent |
| POST | `/api/agents/:id/withdraw` | Rút USDC về MetaMask |
| GET | `/api/agents/owner/:address` | Agents của owner |
| GET | `/api/tasks` | Danh sách tasks |
| GET | `/api/tasks/:id` | Chi tiết task (dùng để poll status) |
| POST | `/api/tasks` | Tạo task mới |

---

## 👤 Tác giả (Author & Copyright)

* **Developer**: Hoang Nhat ([dhnhatdng](https://github.com/dhnhatdng))
* **Role**: Full-stack Web3 & AI Engineer
* **License**: MIT License - xem file [LICENSE](file:///g:/ARC/ai-agent-marketplace/LICENSE) để biết chi tiết.
* **Copyright**: © 2026 Hoang Nhat. All rights reserved.
