import * as fs from "fs";
import * as path from "path";

const DB_FILE_PATH = path.join(__dirname, "../../data/db.json");

interface Agent {
  id: string;
  owner_address: string;
  name: string;
  description: string;
  category: string;
  price_usdc: number;
  system_prompt: string;
  model: string;
  circle_wallet_id: string;
  circle_wallet_address: string;
  total_tasks: number;
  total_earned: number;
  rating: number;
  is_active: number;
  created_at: string;
}

interface Task {
  id: string;
  task_id_hex: string;
  agent_id: string;
  client_address: string;
  description: string;
  status: string;
  price_usdc: number;
  tx_lock_hash: string;
  tx_complete_hash: string;
  ai_result: string;
  result_hash: string;
  error_message: string;
  created_at: string;
  completed_at: string;
}

export interface Review {
  id: string;
  task_id: string;
  agent_id: string;
  client_address: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface DBState {
  agents: Agent[];
  tasks: Task[];
  reviews: Review[];
}

class JSONDatabase {
  private state: DBState = { agents: [], tasks: [], reviews: [] };

  constructor() {
    this.load();
  }

  private load() {
    try {
      fs.mkdirSync(path.dirname(DB_FILE_PATH), { recursive: true });
      if (fs.existsSync(DB_FILE_PATH)) {
        const data = fs.readFileSync(DB_FILE_PATH, "utf-8");
        this.state = JSON.parse(data);
        this.state.reviews = this.state.reviews || [];
      } else {
        this.state.reviews = [];
        this.save();
      }
    } catch (e) {
      console.error("Failed to load JSON DB:", e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.state, null, 2));
    } catch (e) {
      console.error("Failed to save JSON DB:", e);
    }
  }

  pragma(cmd: string) {
    // SQLite compatibility
    return this;
  }

  exec(sql: string) {
    // SQLite compatibility
    return this;
  }

  prepare(sql: string) {
    const db = this;
    const normalizedSql = sql.replace(/\s+/g, " ").trim().toLowerCase();

    return {
      all(...params: any[]): any[] {
        // --- GET ALL AGENTS ---
        if (normalizedSql.includes("select") && normalizedSql.includes("from agents") && normalizedSql.includes("is_active = 1")) {
          // If filtering by owner_address
          if (normalizedSql.includes("owner_address = ?")) {
            const owner = params[0]?.toLowerCase();
            return db.state.agents.filter(a => a.owner_address.toLowerCase() === owner && a.is_active === 1);
          }
          // Default list
          return [...db.state.agents]
            .filter(a => a.is_active === 1)
            .sort((a, b) => b.total_tasks - a.total_tasks);
        }

        // --- GET OWNER AGENTS ---
        if (normalizedSql.includes("select") && normalizedSql.includes("from agents") && normalizedSql.includes("owner_address = ?")) {
          const owner = params[0]?.toLowerCase();
          return db.state.agents.filter(a => a.owner_address.toLowerCase() === owner);
        }

        // --- GET TASKS WITH AGENT NAME JOIN ---
        if (normalizedSql.includes("select") && normalizedSql.includes("from tasks") && normalizedSql.includes("join agents")) {
          let tasksList = db.state.tasks.map(t => {
            const agent = db.state.agents.find(a => a.id === t.agent_id);
            return {
              ...t,
              agent_name: agent ? agent.name : "Unknown Agent",
              category: agent ? agent.category : "general"
            };
          });

          // Filter by client_address
          if (normalizedSql.includes("client_address = ?") || normalizedSql.includes("client = ?")) {
            const client = params[0]?.toLowerCase();
            tasksList = tasksList.filter(t => t.client_address.toLowerCase() === client);
          }

          // Filter by agent_id
          if (normalizedSql.includes("agent_id = ?")) {
            const agentId = params[params.length - 1]; // could be last index depending on filter structure
            tasksList = tasksList.filter(t => t.agent_id === agentId);
          }

          return tasksList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50);
        }

        // --- GET REVIEWS FOR AGENT ---
        if (normalizedSql.includes("select") && normalizedSql.includes("from reviews")) {
          if (normalizedSql.includes("agent_id = ?")) {
            const agentId = params[0];
            return db.state.reviews
              .filter(r => r.agent_id === agentId)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          }
          if (normalizedSql.includes("task_id = ?")) {
            const taskId = params[0];
            return db.state.reviews.filter(r => r.task_id === taskId);
          }
          return [...db.state.reviews];
        }

        return [];
      },

      get(...params: any[]): any {
        // --- GET SINGLE AGENT BY ID ---
        if (normalizedSql.includes("select") && normalizedSql.includes("from agents") && normalizedSql.includes("id = ?")) {
          const id = params[0];
          return db.state.agents.find(a => a.id === id) || null;
        }

        // --- GET SINGLE AGENT BALANCE ---
        if (normalizedSql.includes("select circle_wallet_id") && normalizedSql.includes("from agents") && normalizedSql.includes("id = ?")) {
          const id = params[0];
          const agent = db.state.agents.find(a => a.id === id);
          return agent ? { circle_wallet_id: agent.circle_wallet_id } : null;
        }
        
        if (normalizedSql.includes("select total_earned") && normalizedSql.includes("from agents") && normalizedSql.includes("circle_wallet_id = ?")) {
          const walletId = params[0];
          const agent = db.state.agents.find(a => a.circle_wallet_id === walletId);
          return agent ? { total_earned: agent.total_earned } : null;
        }

        // --- GET SINGLE TASK ---
        if (normalizedSql.includes("select") && normalizedSql.includes("from tasks")) {
          const id = params[0];
          const task = db.state.tasks.find(t => t.id === id);
          if (!task) return null;

          const agent = db.state.agents.find(a => a.id === task.agent_id);
          return {
            ...task,
            agent_name: agent ? agent.name : "Unknown Agent",
            category: agent ? agent.category : "general",
            price_usdc: agent ? agent.price_usdc : task.price_usdc
          };
        }

        // --- GET SINGLE REVIEW ---
        if (normalizedSql.includes("select") && normalizedSql.includes("from reviews")) {
          if (normalizedSql.includes("task_id = ?")) {
            const taskId = params[0];
            return db.state.reviews.find(r => r.task_id === taskId) || null;
          }
          if (normalizedSql.includes("id = ?")) {
            const id = params[0];
            return db.state.reviews.find(r => r.id === id) || null;
          }
        }

        return null;
      },

      run(...params: any[]): { changes: number; lastInsertRowid: number } {
        // --- INSERT AGENT ---
        if (normalizedSql.includes("insert into agents")) {
          const [id, owner_address, name, description, category, price_usdc, system_prompt, model, circle_wallet_id, circle_wallet_address] = params;
          const newAgent: Agent = {
            id,
            owner_address,
            name,
            description,
            category,
            price_usdc: parseFloat(price_usdc),
            system_prompt,
            model: model || "gpt-4o",
            circle_wallet_id,
            circle_wallet_address,
            total_tasks: 0,
            total_earned: 0,
            rating: 5.0,
            is_active: 1,
            created_at: new Date().toISOString()
          };
          db.state.agents.push(newAgent);
          db.save();
          return { changes: 1, lastInsertRowid: 0 };
        }

        // --- INSERT TASK ---
        if (normalizedSql.includes("insert into tasks")) {
          const [id, task_id_hex, agent_id, client_address, description, price_usdc, tx_lock_hash] = params;
          const newTask: Task = {
            id,
            task_id_hex,
            agent_id,
            client_address,
            description,
            status: "pending",
            price_usdc: parseFloat(price_usdc),
            tx_lock_hash,
            tx_complete_hash: "",
            ai_result: "",
            result_hash: "",
            error_message: "",
            created_at: new Date().toISOString(),
            completed_at: ""
          };
          db.state.tasks.push(newTask);
          db.save();
          return { changes: 1, lastInsertRowid: 0 };
        }

        // --- UPDATE TASK STATUS TO PROCESSING ---
        if (normalizedSql.includes("update tasks set status = 'processing'")) {
          const id = params[0];
          const task = db.state.tasks.find(t => t.id === id);
          if (task) {
            task.status = "processing";
            db.save();
          }
          return { changes: 1, lastInsertRowid: 0 };
        }

        // --- UPDATE TASK COMPLETED ---
        if (normalizedSql.includes("update tasks set status = 'completed'")) {
          const [ai_result, result_hash, tx_complete_hash, id] = params;
          const task = db.state.tasks.find(t => t.id === id);
          if (task) {
            task.status = "completed";
            task.ai_result = ai_result;
            task.result_hash = result_hash;
            task.tx_complete_hash = tx_complete_hash;
            task.completed_at = new Date().toISOString();
            db.save();
          }
          return { changes: 1, lastInsertRowid: 0 };
        }

        // --- UPDATE TASK FAILED ---
        if (normalizedSql.includes("update tasks set status = 'failed'")) {
          const [error_message, id] = params;
          const task = db.state.tasks.find(t => t.id === id);
          if (task) {
            task.status = "failed";
            task.error_message = error_message;
            db.save();
          }
          return { changes: 1, lastInsertRowid: 0 };
        }

        // --- UPDATE AGENT EARNED / TASKS ---
        if (normalizedSql.includes("update agents set total_tasks = total_tasks + 1")) {
          const [earned_amount, id] = params;
          const agent = db.state.agents.find(a => a.id === id);
          if (agent) {
            agent.total_tasks += 1;
            agent.total_earned = parseFloat((agent.total_earned + parseFloat(earned_amount)).toFixed(6));
            db.save();
          }
          return { changes: 1, lastInsertRowid: 0 };
        }
        
        // --- MOCK WITHDRAW UPDATE ---
        if (normalizedSql.includes("update agents set total_earned = ? where circle_wallet_id = ?")) {
          const [new_earned, wallet_id] = params;
          const agent = db.state.agents.find(a => a.circle_wallet_id === wallet_id);
          if (agent) {
            agent.total_earned = parseFloat(new_earned);
            db.save();
          }
          return { changes: 1, lastInsertRowid: 0 };
        }

        // --- INSERT REVIEW ---
        if (normalizedSql.includes("insert into reviews")) {
          const [id, task_id, agent_id, client_address, rating, comment] = params;
          const newReview: Review = {
            id,
            task_id,
            agent_id,
            client_address,
            rating: parseInt(rating),
            comment: comment || "",
            created_at: new Date().toISOString()
          };
          db.state.reviews.push(newReview);
          
          // Recalculate agent rating
          const agentReviews = db.state.reviews.filter(r => r.agent_id === agent_id);
          if (agentReviews.length > 0) {
            const sum = agentReviews.reduce((acc, r) => acc + r.rating, 0);
            const avg = parseFloat((sum / agentReviews.length).toFixed(1));
            const agent = db.state.agents.find(a => a.id === agent_id);
            if (agent) {
              agent.rating = avg;
            }
          }
          
          db.save();
          return { changes: 1, lastInsertRowid: 0 };
        }

        return { changes: 0, lastInsertRowid: 0 };
      }
    };
  }
}

let dbInstance: JSONDatabase;

export function getDB(): any {
  if (!dbInstance) {
    dbInstance = new JSONDatabase();
    console.log("✅ Custom JSON-based database initialized:", DB_FILE_PATH);
  }
  return dbInstance;
}
