// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAgentEscrow.sol";

/**
 * @title AgentEscrow
 * @notice Quản lý escrow USDC cho AI Agent Marketplace trên Arc Network.
 *
 * Luồng hoạt động:
 * 1. Client gọi lockFunds() → USDC bị lock, task được tạo
 * 2. Backend (operator) gọi completeTask() sau khi AI xử lý xong
 * 3. USDC tự động transfer đến ví agent, trừ platform fee
 * 4. Nếu timeout (24h), client có thể gọi cancelTask() để hoàn tiền
 *
 * Platform fee: 5% (có thể điều chỉnh bởi owner)
 */
contract AgentEscrow is ReentrancyGuard, Ownable, IAgentEscrow {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public operator;          // Backend server address có quyền completeTask
    address public feeRecipient;      // Địa chỉ nhận platform fee
    uint256 public platformFeePercent = 500; // 5% (basis points / 100)
    uint256 public constant CANCEL_TIMEOUT = 24 hours;
    uint256 public constant MAX_FEE = 1000; // Max 10%

    mapping(bytes32 => Task) public tasks;

    modifier onlyOperator() {
        require(msg.sender == operator, "AgentEscrow: NOT_OPERATOR");
        _;
    }

    constructor(
        address _usdc,
        address _operator,
        address _feeRecipient
    ) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        operator = _operator;
        feeRecipient = _feeRecipient;
    }

    /**
     * @notice Client lock USDC vào escrow để tạo task mới.
     * @param taskId   Unique task ID (bytes32, tạo từ backend)
     * @param agentWallet  Địa chỉ ví Circle của agent sẽ nhận thanh toán
     * @param amount   Số USDC (tính theo decimals của token)
     */
    function lockFunds(
        bytes32 taskId,
        address agentWallet,
        uint256 amount
    ) external nonReentrant {
        require(tasks[taskId].createdAt == 0, "AgentEscrow: TASK_EXISTS");
        require(agentWallet != address(0), "AgentEscrow: ZERO_ADDRESS");
        require(amount > 0, "AgentEscrow: ZERO_AMOUNT");

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        tasks[taskId] = Task({
            taskId: taskId,
            client: msg.sender,
            agentWallet: agentWallet,
            amount: amount,
            status: TaskStatus.Pending,
            createdAt: block.timestamp,
            completedAt: 0,
            resultHash: bytes32(0)
        });

        emit TaskCreated(taskId, msg.sender, agentWallet, amount);
    }

    /**
     * @notice Operator (backend) gọi sau khi AI xử lý task xong.
     * Tự động release USDC đến agent wallet (trừ platform fee).
     * @param taskId     ID của task đã hoàn thành
     * @param resultHash Hash của kết quả AI (lưu onchain để audit)
     */
    function completeTask(
        bytes32 taskId,
        bytes32 resultHash
    ) external nonReentrant onlyOperator {
        Task storage task = tasks[taskId];
        require(task.createdAt != 0, "AgentEscrow: TASK_NOT_FOUND");
        require(task.status == TaskStatus.Pending, "AgentEscrow: INVALID_STATUS");

        task.status = TaskStatus.Completed;
        task.completedAt = block.timestamp;
        task.resultHash = resultHash;

        // Tính platform fee
        uint256 fee = (task.amount * platformFeePercent) / 10000;
        uint256 agentAmount = task.amount - fee;

        // Chuyển tiền cho agent
        usdc.safeTransfer(task.agentWallet, agentAmount);

        // Chuyển fee cho platform
        if (fee > 0) {
            usdc.safeTransfer(feeRecipient, fee);
        }

        emit TaskCompleted(taskId, task.agentWallet, agentAmount);
    }

    /**
     * @notice Client huỷ task và lấy lại USDC nếu quá 24h chưa xong.
     */
    function cancelTask(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.createdAt != 0, "AgentEscrow: TASK_NOT_FOUND");
        require(task.client == msg.sender, "AgentEscrow: NOT_CLIENT");
        require(task.status == TaskStatus.Pending, "AgentEscrow: INVALID_STATUS");
        require(
            block.timestamp >= task.createdAt + CANCEL_TIMEOUT,
            "AgentEscrow: TOO_EARLY"
        );

        task.status = TaskStatus.Cancelled;
        usdc.safeTransfer(task.client, task.amount);

        emit TaskCancelled(taskId, task.client, task.amount);
    }

    /**
     * @notice Operator (backend) huỷ task và hoàn tiền cho client ngay lập tức nếu xử lý lỗi.
     */
    function cancelTaskByOperator(bytes32 taskId) external nonReentrant onlyOperator {
        Task storage task = tasks[taskId];
        require(task.createdAt != 0, "AgentEscrow: TASK_NOT_FOUND");
        require(task.status == TaskStatus.Pending, "AgentEscrow: INVALID_STATUS");

        task.status = TaskStatus.Cancelled;
        usdc.safeTransfer(task.client, task.amount);

        emit TaskCancelled(taskId, task.client, task.amount);
    }

    function getTask(bytes32 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    // ── Admin functions ──────────────────────────────────────────────
    function setOperator(address _operator) external onlyOwner {
        operator = _operator;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= MAX_FEE, "AgentEscrow: FEE_TOO_HIGH");
        platformFeePercent = _feePercent;
    }
}
