import { useWriteContract } from "wagmi";
import { parseUnits, keccak256, toHex } from "viem";
import { ESCROW_ABI, ERC20_ABI } from "../constants/abis";

const ESCROW_ADDRESS = import.meta.env.VITE_ESCROW_ADDRESS as `0x${string}`;
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`;
const GAS = { maxFeePerGas: parseUnits("20", 9) };

export function useEscrow() {
  const { writeContractAsync } = useWriteContract();

  /**
   * Bước 1: Approve USDC cho escrow contract
   */
  const approveUSDC = async (amount: number) => {
    const parsedAmount = parseUnits(amount.toString(), 6);
    return writeContractAsync({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [ESCROW_ADDRESS, parsedAmount],
      ...GAS,
    });
  };

  /**
   * Bước 2: Lock USDC vào escrow để tạo task
   */
  const lockFunds = async (taskId: string, agentWalletAddress: `0x${string}`, amount: number) => {
    const taskIdBytes32 = keccak256(toHex(taskId)) as `0x${string}`;
    const parsedAmount = parseUnits(amount.toString(), 6);
    return writeContractAsync({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: "lockFunds",
      args: [taskIdBytes32, agentWalletAddress, parsedAmount],
      ...GAS,
    });
  };

  /**
   * Bước 3: Hủy task và nhận lại tiền (sau 24h)
   */
  const cancelTask = async (taskId: string) => {
    const taskIdBytes32 = keccak256(toHex(taskId)) as `0x${string}`;
    return writeContractAsync({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: "cancelTask",
      args: [taskIdBytes32],
      ...GAS,
    });
  };

  return { approveUSDC, lockFunds, cancelTask };
}
