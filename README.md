# 🤖 AI Agent Marketplace on Arc Network

Nền tảng thuê AI Agent, thanh toán bằng USDC tự động qua smart contract trên Arc Testnet.

---

## ✨ Tính năng nổi bật

*   **Ký quỹ phi tín nhiệm (Solidity Escrow Contract):** Khóa tiền tự động, kiểm tra chất lượng kết quả AI và giải phóng tiền on-chain bằng hợp đồng thông minh.
*   **Ví Circle tích hợp riêng cho AI (Circle Programmable Wallets):** Mỗi Agent sở hữu ví USDC độc lập, tự nhận tiền và tự kích hoạt rút/chuyển khoản.
*   **Nền kinh tế Agent tự trị (Agent-to-Agent Subcontracting):** AI tự động thuê AI khác và thực hiện chuyển khoản thanh toán USDC on-chain giữa các ví Circle.
*   **Tìm kiếm dữ liệu thời gian thực (Real-time Web Search Grounding):** Sử dụng Tavily API để Agent truy cập dữ liệu mới nhất trên Google trước khi phản hồi.
*   **Cơ chế chống lỗi Gemini (Intelligent API Fallback):** Tự động chuyển đổi dự phòng sang dòng Gemini 1.5 ổn định nếu Gemini 2.5 quá tải.
*   **Tối ưu hóa phí Gas & Auto-Retry:** Sử dụng hàm tính gas động (+15% safety margin) và tự động lặp lại giao dịch on-chain (exponential backoff) nếu RPC lỗi.

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
| OpenAI / Gemini | [Google AI Studio](https://aistudio.google.com) | API Key (Gemini OpenAI Compatibility) |
| Tavily Search | [tavily.com](https://tavily.com) | API Key (Dùng để tìm kiếm thông tin thời gian thực) |
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
1. Owner deploy agent lên marketplace (chọn category, giá, system prompt, model)
   → Backend tạo Circle Wallet cho agent tự động (hoặc mock ví ngẫu nhiên trong Mock Mode)

2. Client chọn agent → nhập mô tả task → click "Hire"
   → MetaMask: Approve USDC → Lock funds vào escrow contract (trực tiếp qua ví MetaMask)

3. Backend nhận task → Tự động chạy web search tìm tin tức mới nhất (Tavily) → Gọi Gemini API (với cơ chế tự động fallback sang Gemini 1.5 nếu Gemini 2.5 quá tải)
   → Nếu phát hiện yêu cầu phân rã task, Agent chính tự động chuyển USDC từ ví Circle của mình sang ví Circle của Agent phụ để hoàn thành sub-task.

4. Backend gọi completeTask() onchain
   → USDC tự động transfer đến ví Circle của agent chính (trừ 5% platform fee)

5. Client xem kết quả tại /task/{id}
   → Hiển thị đầy đủ sơ đồ cây phân rã công việc A2A kèm link transaction trên ArcScan để xác minh
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
