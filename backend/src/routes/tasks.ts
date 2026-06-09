import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { keccak256, toUtf8Bytes } from "ethers";
import { getDB } from "../db/database";
import { processTask } from "../services/taskProcessor";

const router = Router();

// GET /api/tasks — Lấy tasks (filter by client hoặc agent)
router.get("/", (req, res) => {
  const db = getDB();
  const { client, agent_id } = req.query;
  let query = "SELECT t.*, a.name as agent_name, a.category FROM tasks t JOIN agents a ON t.agent_id = a.id WHERE 1=1";
  const params: any[] = [];

  if (client) { query += " AND t.client_address = ?"; params.push(client); }
  if (agent_id) { query += " AND t.agent_id = ?"; params.push(agent_id); }

  query += " ORDER BY t.created_at DESC LIMIT 50";
  res.json({ success: true, data: db.prepare(query).all(...params) });
});

// GET /api/tasks/:id — Lấy 1 task (polling status)
router.get("/:id", (req, res) => {
  const db = getDB();
  const task = db.prepare(`
    SELECT t.*, a.name as agent_name, a.category, a.price_usdc
    FROM tasks t JOIN agents a ON t.agent_id = a.id
    WHERE t.id = ?
  `).get(req.params.id) as any;
  if (!task) return res.status(404).json({ success: false, error: "Task not found" });

  // Kiểm tra xem đã review chưa
  const review = db.prepare("SELECT * FROM reviews WHERE task_id = ?").get(task.id);
  task.is_reviewed = !!review;
  if (review) {
    task.review = review;
  }

  res.json({ success: true, data: task });
});

// POST /api/tasks — Client tạo task mới
// Gọi sau khi client đã lock USDC onchain (tx_lock_hash bắt buộc)
router.post("/", async (req, res) => {
  try {
    const { agent_id, client_address, description, tx_lock_hash } = req.body;
    if (!agent_id || !client_address || !description || !tx_lock_hash) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const db = getDB();
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(agent_id) as any;
    if (!agent) return res.status(404).json({ success: false, error: "Agent not found" });

    const id = req.body.id || uuidv4();
    const taskIdHex = keccak256(toUtf8Bytes(id));

    db.prepare(`
      INSERT INTO tasks (id, task_id_hex, agent_id, client_address, description, price_usdc, tx_lock_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, taskIdHex, agent_id, client_address, description, agent.price_usdc, tx_lock_hash);

    // Xử lý task ngay (async, không block response)
    processTask(id).catch(console.error);

    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tasks/:id/review — Client đánh giá và phản hồi về task đã hoàn thành
router.post("/:id/review", (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (rating === undefined || rating === null) {
      return res.status(400).json({ success: false, error: "Rating is required" });
    }

    const rNum = parseInt(rating);
    if (isNaN(rNum) || rNum < 1 || rNum > 5) {
      return res.status(400).json({ success: false, error: "Rating must be an integer between 1 and 5" });
    }

    const db = getDB();
    // 1. Kiểm tra task có tồn tại không
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id) as any;
    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    // 2. Xác thực trạng thái task
    if (task.status !== "completed") {
      return res.status(400).json({ success: false, error: "Only completed tasks can be reviewed" });
    }

    // 3. Kiểm tra xem task đã được review chưa
    const existingReview = db.prepare("SELECT * FROM reviews WHERE task_id = ?").get(task.id);
    if (existingReview) {
      return res.status(400).json({ success: false, error: "This task has already been reviewed" });
    }

    // 4. Lưu review và tự động cập nhật rating của Agent
    const id = uuidv4();
    db.prepare(`
      INSERT INTO reviews (id, task_id, agent_id, client_address, rating, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, task.id, task.agent_id, task.client_address, rNum, comment || "");

    const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(id);
    res.json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
