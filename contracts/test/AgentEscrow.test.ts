import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("AgentEscrow", () => {
  async function deploy() {
    const [owner, operator, feeRecipient, client, agentWallet] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);

    const AgentEscrow = await ethers.getContractFactory("AgentEscrow");
    const escrow = await AgentEscrow.deploy(
      await usdc.getAddress(), operator.address, feeRecipient.address
    );

    // Mint USDC to client
    await usdc.mint(client.address, ethers.parseUnits("100", 6));
    await usdc.connect(client).approve(await escrow.getAddress(), ethers.MaxUint256);

    const AMOUNT = ethers.parseUnits("10", 6);
    const TASK_ID = ethers.keccak256(ethers.toUtf8Bytes("task-001"));
    const RESULT_HASH = ethers.keccak256(ethers.toUtf8Bytes("result-content"));

    return { escrow, usdc, owner, operator, feeRecipient, client, agentWallet, AMOUNT, TASK_ID, RESULT_HASH };
  }

  it("lockFunds: locks USDC and creates task", async () => {
    const { escrow, usdc, client, agentWallet, AMOUNT, TASK_ID } = await deploy();
    await escrow.connect(client).lockFunds(TASK_ID, agentWallet.address, AMOUNT);
    const task = await escrow.getTask(TASK_ID);
    expect(task.amount).to.equal(AMOUNT);
    expect(task.client).to.equal(client.address);
    expect(task.status).to.equal(0); // Pending
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(AMOUNT);
  });

  it("completeTask: releases USDC to agent minus fee", async () => {
    const { escrow, usdc, client, agentWallet, operator, feeRecipient, AMOUNT, TASK_ID, RESULT_HASH } = await deploy();
    await escrow.connect(client).lockFunds(TASK_ID, agentWallet.address, AMOUNT);
    await escrow.connect(operator).completeTask(TASK_ID, RESULT_HASH);

    const fee = (AMOUNT * 500n) / 10000n; // 5%
    expect(await usdc.balanceOf(agentWallet.address)).to.equal(AMOUNT - fee);
    expect(await usdc.balanceOf(feeRecipient.address)).to.equal(fee);

    const task = await escrow.getTask(TASK_ID);
    expect(task.status).to.equal(2); // Completed
  });

  it("cancelTask: refunds client after 24h timeout", async () => {
    const { escrow, usdc, client, agentWallet, AMOUNT, TASK_ID } = await deploy();
    await escrow.connect(client).lockFunds(TASK_ID, agentWallet.address, AMOUNT);

    await expect(escrow.connect(client).cancelTask(TASK_ID))
      .to.be.revertedWith("AgentEscrow: TOO_EARLY");

    await time.increase(24 * 3600 + 1);
    await escrow.connect(client).cancelTask(TASK_ID);
    expect(await usdc.balanceOf(client.address)).to.equal(ethers.parseUnits("100", 6));
  });

  it("reverts if non-operator calls completeTask", async () => {
    const { escrow, client, agentWallet, AMOUNT, TASK_ID, RESULT_HASH } = await deploy();
    await escrow.connect(client).lockFunds(TASK_ID, agentWallet.address, AMOUNT);
    await expect(escrow.connect(client).completeTask(TASK_ID, RESULT_HASH))
      .to.be.revertedWith("AgentEscrow: NOT_OPERATOR");
  });

  it("cancelTaskByOperator: operator can refund immediately", async () => {
    const { escrow, usdc, client, agentWallet, operator, AMOUNT, TASK_ID } = await deploy();
    await escrow.connect(client).lockFunds(TASK_ID, agentWallet.address, AMOUNT);
    
    // Operator cancels task
    await escrow.connect(operator).cancelTaskByOperator(TASK_ID);
    
    const task = await escrow.getTask(TASK_ID);
    expect(task.status).to.equal(3); // Cancelled
    expect(await usdc.balanceOf(client.address)).to.equal(ethers.parseUnits("100", 6));
  });

  it("reverts if non-operator calls cancelTaskByOperator", async () => {
    const { escrow, client, agentWallet, AMOUNT, TASK_ID } = await deploy();
    await escrow.connect(client).lockFunds(TASK_ID, agentWallet.address, AMOUNT);
    
    await expect(escrow.connect(client).cancelTaskByOperator(TASK_ID))
      .to.be.revertedWith("AgentEscrow: NOT_OPERATOR");
  });
});
