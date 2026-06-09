// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAgentEscrow {
    enum TaskStatus { Pending, Processing, Completed, Cancelled, Disputed }

    struct Task {
        bytes32 taskId;
        address client;
        address agentWallet;
        uint256 amount;
        TaskStatus status;
        uint256 createdAt;
        uint256 completedAt;
        bytes32 resultHash;
    }

    event TaskCreated(bytes32 indexed taskId, address indexed client, address indexed agentWallet, uint256 amount);
    event TaskCompleted(bytes32 indexed taskId, address indexed agentWallet, uint256 amount);
    event TaskCancelled(bytes32 indexed taskId, address indexed client, uint256 refundAmount);
    event TaskDisputed(bytes32 indexed taskId);

    function lockFunds(bytes32 taskId, address agentWallet, uint256 amount) external;
    function completeTask(bytes32 taskId, bytes32 resultHash) external;
    function cancelTask(bytes32 taskId) external;
    function cancelTaskByOperator(bytes32 taskId) external;
    function getTask(bytes32 taskId) external view returns (Task memory);
    function platformFeePercent() external view returns (uint256);
}
