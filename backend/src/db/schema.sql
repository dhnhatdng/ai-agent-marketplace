-- Bảng agents: thông tin agent trên marketplace
CREATE TABLE IF NOT EXISTS agents (
  id          TEXT PRIMARY KEY,          -- UUID
  owner_address TEXT NOT NULL,           -- MetaMask address của owner
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL,             -- writing|analysis|translation|coding|research
  price_usdc  REAL NOT NULL,             -- Giá mỗi task (VD: 1.5)
  system_prompt TEXT NOT NULL,           -- Prompt hệ thống cho GPT-4o
  model       TEXT DEFAULT 'gpt-4o',     -- OpenAI model
  circle_wallet_id TEXT,                 -- Circle Wallet ID (tạo tự động)
  circle_wallet_address TEXT,            -- Địa chỉ ví nhận USDC
  total_tasks INTEGER DEFAULT 0,
  total_earned REAL DEFAULT 0,
  rating      REAL DEFAULT 5.0,
  is_active   INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- Bảng tasks: lịch sử task
CREATE TABLE IF NOT EXISTS tasks (
  id              TEXT PRIMARY KEY,      -- UUID (cũng là taskId onchain)
  task_id_hex     TEXT NOT NULL,         -- bytes32 hex cho smart contract
  agent_id        TEXT NOT NULL,
  client_address  TEXT NOT NULL,         -- MetaMask address của client
  description     TEXT NOT NULL,         -- Mô tả task từ client
  status          TEXT DEFAULT 'pending', -- pending|processing|completed|failed|cancelled
  price_usdc      REAL NOT NULL,
  tx_lock_hash    TEXT,                  -- TX hash của lockFunds()
  tx_complete_hash TEXT,                 -- TX hash của completeTask()
  ai_result       TEXT,                  -- Kết quả trả về từ GPT-4o
  result_hash     TEXT,                  -- keccak256 của ai_result
  error_message   TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  completed_at    TEXT,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Index để query nhanh
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_address);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
