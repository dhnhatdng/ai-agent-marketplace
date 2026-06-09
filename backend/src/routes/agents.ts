import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getDB } from "../db/database";
import { createAgentWallet, getWalletBalance, transferFromAgentWallet } from "../services/circleWallet";

const router = Router();

// GET /api/agents — Lấy tất cả agents
router.get("/", (req, res) => {
  const db = getDB();
  const agents = db.prepare(`
    SELECT id, owner_address, name, description, category,
           price_usdc, circle_wallet_address, total_tasks, total_earned, rating, is_active, created_at
    FROM agents WHERE is_active = 1
    ORDER BY total_tasks DESC
  `).all();
  res.json({ success: true, data: agents });
});

// GET /api/agents/:id — Lấy 1 agent
router.get("/:id", (req, res) => {
  const db = getDB();
  const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(req.params.id);
  if (!agent) return res.status(404).json({ success: false, error: "Agent not found" });
  res.json({ success: true, data: agent });
});

// POST /api/agents — Tạo agent mới
router.post("/", async (req, res) => {
  try {
    const { owner_address, name, description, category, price_usdc, system_prompt, model } = req.body;

    if (!owner_address || !name || !description || !category || !price_usdc || !system_prompt) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    // Tạo Circle wallet cho agent
    console.log(`Creating Circle wallet for agent: ${name}`);
    const { walletId, walletAddress } = await createAgentWallet(name);

    const id = uuidv4();
    const db = getDB();
    db.prepare(`
      INSERT INTO agents (id, owner_address, name, description, category, price_usdc, system_prompt, model, circle_wallet_id, circle_wallet_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, owner_address, name, description, category, price_usdc, system_prompt, model || "gpt-4o", walletId, walletAddress);

    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
    res.json({ success: true, data: agent });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agents/:id/balance — Số dư USDC của agent wallet
router.get("/:id/balance", async (req, res) => {
  try {
    const db = getDB();
    const agent = db.prepare("SELECT circle_wallet_id FROM agents WHERE id = ?").get(req.params.id) as any;
    if (!agent) return res.status(404).json({ success: false, error: "Agent not found" });

    const balance = await getWalletBalance(agent.circle_wallet_id);
    res.json({ success: true, data: { balance } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agents/:id/withdraw — Rút USDC về ví MetaMask
router.post("/:id/withdraw", async (req, res) => {
  try {
    const { destination_address, amount } = req.body;
    const db = getDB();
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(req.params.id) as any;
    if (!agent) return res.status(404).json({ success: false, error: "Agent not found" });

    const transferId = await transferFromAgentWallet(
      agent.circle_wallet_id,
      destination_address,
      amount
    );
    res.json({ success: true, data: { transferId } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agents/owner/:address — Agents của một owner
router.get("/owner/:address", (req, res) => {
  const db = getDB();
  const agents = db.prepare("SELECT * FROM agents WHERE owner_address = ?").all(req.params.address);
  res.json({ success: true, data: agents });
});

// GET /api/agents/owner/:address/earnings — Thống kê doanh thu của chủ sở hữu
router.get("/owner/:address/earnings", (req, res) => {
  try {
    const db = getDB();
    const ownerAddress = req.params.address.toLowerCase();

    // Lấy tất cả agent của owner này
    const agents = db.prepare("SELECT * FROM agents WHERE owner_address = ?").all(ownerAddress);
    
    // Gom tất cả các task đã hoàn thành
    let allCompletedTasks: any[] = [];
    for (const agent of agents) {
      const tasks = db.prepare("SELECT * FROM tasks JOIN agents WHERE agent_id = ?").all(agent.id);
      const completed = tasks.filter((t: any) => t.status === "completed");
      allCompletedTasks.push(...completed);
    }

    // Gom doanh thu theo ngày (7 ngày gần nhất)
    const dailyEarnings: Record<string, number> = {};
    
    // Khởi tạo 7 ngày gần nhất với giá trị 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }); // "MM/DD"
      dailyEarnings[label] = 0;
    }

    let totalEarnings = 0;

    for (const task of allCompletedTasks) {
      const earnings = task.price_usdc * 0.95; // 95% sau phí platform
      totalEarnings += earnings;

      if (task.completed_at) {
        const d = new Date(task.completed_at);
        const label = d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
        if (dailyEarnings[label] !== undefined) {
          dailyEarnings[label] = parseFloat((dailyEarnings[label] + earnings).toFixed(6));
        }
      }
    }

    const chartData = Object.keys(dailyEarnings).map(date => ({
      date,
      earnings: dailyEarnings[date]
    }));

    res.json({
      success: true,
      data: {
        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
        totalTasks: allCompletedTasks.length,
        activeAgents: agents.filter((a: any) => a.is_active === 1).length,
        chartData
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agents/:id/reviews — Lấy tất cả đánh giá của 1 agent
router.get("/:id/reviews", (req, res) => {
  const db = getDB();
  const reviews = db.prepare("SELECT * FROM reviews WHERE agent_id = ?").all(req.params.id);
  res.json({ success: true, data: reviews });
});

export default router;
