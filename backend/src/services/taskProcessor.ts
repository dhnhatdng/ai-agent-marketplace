import { getDB } from "../db/database";
import { processTaskWithAI } from "./openai";
import { completeTaskOnChain, refundTaskOnChain, taskIdToBytes32 } from "./escrow";
import { uploadToShelby } from "./shelby";

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
    // 4. Gọi AI (với hướng dẫn subcontract nếu có nhiều agent)
    const allAgents = db.state.agents.filter((a: any) => a.id !== task.agent_id && a.is_active === 1);
    const agentsListStr = allAgents.map((a: any) => `- ID: ${a.id}, Name: ${a.name}, Price: ${a.price_usdc} USDC, Category: ${a.category}, Description: ${a.description}`).join("\n");
    
    let subcontractInstruction = "";
    if (allAgents.length > 0) {
      subcontractInstruction = `\n\n=== AGENT-TO-AGENT DELEGATION ===
You have the power to autonomously delegate a sub-task to one of the following specialized agents in the marketplace if you think it would help you achieve a better result. To delegate, you MUST start your response with a JSON block in this exact format:
{
  "subcontract": {
    "agent_id": "CHOSEN_AGENT_ID",
    "prompt": "Specific instruction for the subcontracted agent",
    "amount_usdc": 0.5
  }
}
And then output your general thoughts or explanation.
Note: You can only delegate if the amount_usdc is less than or equal to your own price (${task.price_usdc} USDC).

Here are the available agents you can delegate to:
${agentsListStr}

If you do NOT want to delegate or subcontract, simply reply with your direct answer without the JSON block.
=================================`;
    }

    const enhancedSystemPrompt = agent.system_prompt + subcontractInstruction;

    console.log(`   📡 Calling ${agent.model}...`);
    const aiResult = await processTaskWithAI(
      enhancedSystemPrompt,
      task.description,
      agent.model
    );
    console.log(`   ✅ AI responded (${aiResult.tokensUsed} tokens)`);

    let finalContent = aiResult.content;
    let subcontractData: any = null;

    // Check if there is a subcontract JSON block at the start of the content
    const jsonMatch = aiResult.content.match(/^\s*\{\s*"subcontract"\s*:\s*\{[\s\S]+?\}\s*\}/);
    if (jsonMatch) {
      try {
        const jsonBlock = JSON.parse(jsonMatch[0]);
        const { agent_id, prompt, amount_usdc } = jsonBlock.subcontract;
        
        // Find the subcontracted agent
        const subAgent = db.state.agents.find((a: any) => a.id === agent_id);
        if (subAgent) {
          console.log(`🤖 [A2A Subcontracting] Agent ${agent.name} is subcontracting to ${subAgent.name} for ${amount_usdc} USDC...`);
          
          // Trigger a Circle transfer from Agent A to Agent B (simulate or real)
          let transferTxHash = `mock-transfer-${Math.random().toString(36).substring(2, 15)}`;
          try {
            const { transferFromAgentWallet } = require("./circleWallet");
            transferTxHash = await transferFromAgentWallet(
              agent.circle_wallet_id,
              subAgent.circle_wallet_address,
              amount_usdc.toString()
            );
            console.log(`🤖 [A2A Subcontracting] Circle USDC transfer successful: ${transferTxHash}`);
          } catch (txErr: any) {
            console.error(`🤖 [A2A Subcontracting] Circle USDC transfer failed, falling back to simulated hash:`, txErr.message);
          }

          // Execute sub-task using Agent B
          console.log(`🤖 [A2A Subcontracting] Calling sub-agent ${subAgent.name}...`);
          const subtaskResult = await processTaskWithAI(
            subAgent.system_prompt,
            prompt,
            subAgent.model
          );
          console.log(`🤖 [A2A Subcontracting] Sub-agent responded.`);

          // Feed result back to Agent A to synthesize the final answer
          const synthesisPrompt = `You delegated a sub-task to ${subAgent.name} (ID: ${agent_id}) with prompt: "${prompt}".
Their execution result is:
"${subtaskResult.content}"

Now, synthesize this result and your own knowledge into a final, comprehensive response to the original task request: "${task.description}". Do NOT include any JSON subcontract blocks in this final answer.`;

          console.log(`🤖 [A2A Subcontracting] Synthesizing final answer using Agent ${agent.name}...`);
          const finalResult = await processTaskWithAI(
            agent.system_prompt,
            synthesisPrompt,
            agent.model
          );
          
          finalContent = finalResult.content;
          subcontractData = {
            agent_id,
            agent_name: subAgent.name,
            prompt,
            amount_usdc,
            tx_hash: transferTxHash,
            ai_result: subtaskResult.content
          };
        }
      } catch (err: any) {
        console.error(`⚠️ Failed to parse/execute subcontracting JSON:`, err.message);
      }
    }

    // 5. Upload final AI result to Shelby Protocol
    let shelbyHash = "";
    try {
      const fileName = `task-report-${taskId}.md`;
      const reportBuffer = Buffer.from(finalContent, "utf-8");
      shelbyHash = await uploadToShelby(reportBuffer, fileName);
    } catch (shelbyErr: any) {
      console.error(`⚠️ Failed to upload result to Shelby:`, shelbyErr.message);
    }

    // Mutate the record directly in state to store subcontract and shelby details BEFORE completing on-chain
    // This ensures that even if on-chain completeTask fails, the shelby_hash is saved.
    const taskRecord = db.state.tasks.find((t: any) => t.id === taskId);
    if (taskRecord) {
      if (shelbyHash) {
        taskRecord.shelby_hash = shelbyHash;
      }
      if (subcontractData) {
        taskRecord.subcontract_agent_id = subcontractData.agent_id;
        taskRecord.subcontract_agent_name = subcontractData.agent_name;
        taskRecord.subcontract_prompt = subcontractData.prompt;
        taskRecord.subcontract_price_usdc = subcontractData.amount_usdc;
        taskRecord.subcontract_tx_hash = subcontractData.tx_hash;
        taskRecord.subcontract_ai_result = subcontractData.ai_result;
      }
    }

    // 6. Release escrow onchain
    console.log(`   ⛓️ Completing task onchain...`);
    const txHash = await completeTaskOnChain(taskId, finalContent);
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
    `).run(finalContent, taskIdToBytes32(finalContent), txHash, taskId);

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
