interface Props { amount: number; size?: "sm" | "md" | "lg"; }

export default function USDCBadge({ amount, size = "md" }: Props) {
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl" };
  return (
    <span className={`font-bold font-mono text-arc-pink ${sizes[size]}`}>
      {amount.toFixed(2)} USDC
    </span>
  );
}
