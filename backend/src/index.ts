import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();

import { getDB } from "./db/database";
import agentsRouter from "./routes/agents";
import tasksRouter from "./routes/tasks";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/agents", agentsRouter);
app.use("/api/tasks", tasksRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    network: "Arc Testnet",
    chainId: 5042002,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// Init DB and start server
getDB();
app.listen(PORT, () => {
  console.log(`\n🚀 AI Agent Marketplace Backend`);
  console.log(`   URL:     http://localhost:${PORT}`);
  console.log(`   Network: Arc Testnet (Chain ID: 5042002)`);
  console.log(`   Health:  http://localhost:${PORT}/health\n`);
});
// Trigger reload

