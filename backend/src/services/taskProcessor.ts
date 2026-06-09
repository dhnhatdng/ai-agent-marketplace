import { getDB } from "../db/database";
import { processTaskWithAI } from "./openai";
import { completeTaskOnChain, refundTaskOnChain, taskIdToBytes32 } from "./escrow";

/**
 * Orchestrator chính: nhận task mới → gọi AI → release escrow → lưu DB
 */
export async function processTask(taskId: string): Promise<void> {
  const db = getDB();

  // 1. Load task từ DB
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as any;
  if (!task) throw new Error(`Task ${taskId} not found`);
  if (task.status !== "pending") return; // Tránh chạy lại

  // 2. Load agent config
  const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(task.agent_id) as any;
  if (!agent) throw new Error(`Agent ${task.agent_id} not found`);

  console.log(`\n🤖 Processing task ${taskId}`);
  console.log(`   Agent: ${agent.name}`);
  console.log(`   Task: ${task.description.substring(0, 80)}...`);

  // 3. Update status → processing
  db.prepare("UPDATE tasks SET status = 'processing' WHERE id = ?").run(taskId);

  try {
    // 4. Gọi GPT-4o
    console.log(`   📡 Calling ${agent.model}...`);
    const aiResult = await processTaskWithAI(
      agent.system_prompt,
      task.description,
      agent.model
    );
    console.log(`   ✅ AI responded (${aiResult.tokensUsed} tokens)`);

    // 5. Release escrow onchain
    console.log(`   ⛓️ Completing task onchain...`);
    const txHash = await completeTaskOnChain(taskId, aiResult.content);
    console.log(`   ✅ TX: ${txHash}`);

    // 6. Update DB
    db.prepare(`
      UPDATE tasks SET
        status = 'completed',
        ai_result = ?,
        result_hash = ?,
        tx_complete_hash = ?,
        completed_at = datetime('now')
      WHERE id = ?
    `).run(aiResult.content, taskIdToBytes32(aiResult.content), txHash, taskId);

    // 7. Update agent stats
    db.prepare(`
      UPDATE agents SET
        total_tasks = total_tasks + 1,
        total_earned = total_earned + ?
      WHERE id = ?
    `).run(task.price_usdc * 0.95, task.agent_id); // 95% sau fee

    console.log(`   🎉 Task ${taskId} completed successfully!`);
  } catch (error: any) {
    console.error(`   ❌ Task ${taskId} failed:`, error.message);
    db.prepare(`
      UPDATE tasks SET status = 'failed', error_message = ? WHERE id = ?
    `).run(error.message, taskId);

    // Auto-refund client onchain
    try {
      console.log(`   ⛓️ Refunding client onchain...`);
      const refundTxHash = await refundTaskOnChain(taskId);
      console.log(`   ✅ Refund TX: ${refundTxHash}`);
      db.prepare(`
        UPDATE tasks SET tx_complete_hash = ?, status = 'failed' WHERE id = ?
      `).run(refundTxHash, taskId);
    } catch (refundError: any) {
      console.error(`   ❌ Failed to refund onchain:`, refundError.message);
    }
  }
}
