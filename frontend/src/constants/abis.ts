export const ERC20_ABI = [
  { name: "balanceOf", type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "allowance", type: "function", stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ type: "uint256" }] },
  { name: "approve", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ type: "bool" }] },
] as const;

export const ESCROW_ABI = [
  { name: "lockFunds", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "taskId", type: "bytes32" },
      { name: "agentWallet", type: "address" },
      { name: "amount", type: "uint256" },
    ], outputs: [] },
  { name: "cancelTask", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "taskId", type: "bytes32" }], outputs: [] },
  { name: "getTask", type: "function", stateMutability: "view",
    inputs: [{ name: "taskId", type: "bytes32" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "taskId", type: "bytes32" },
        { name: "client", type: "address" },
        { name: "agentWallet", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "status", type: "uint8" },
        { name: "createdAt", type: "uint256" },
        { name: "completedAt", type: "uint256" },
        { name: "resultHash", type: "bytes32" },
      ],
    }] },
  { name: "TaskCreated", type: "event",
    inputs: [
      { name: "taskId", type: "bytes32", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "agentWallet", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ] },
] as const;
