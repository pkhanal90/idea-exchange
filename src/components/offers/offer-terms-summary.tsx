import { formatCurrency } from "@/lib/utils";

export function OfferTermsSummary({
  amount,
  equityPercent,
  royaltyPercent,
  royaltyTermMonths,
  size = "md",
}: {
  amount: unknown;
  equityPercent: unknown;
  royaltyPercent: unknown;
  royaltyTermMonths: number | null;
  size?: "sm" | "md";
}) {
  const parts: string[] = [];
  if (amount) parts.push(formatCurrency(amount as never));
  if (equityPercent) parts.push(`${Number(equityPercent)}% equity`);
  if (royaltyPercent) {
    parts.push(
      `${Number(royaltyPercent)}% royalty${royaltyTermMonths ? ` for ${royaltyTermMonths}mo` : ""}`,
    );
  }
  if (parts.length === 0) parts.push("Terms only");

  return (
    <p className={size === "sm" ? "text-sm font-semibold text-ink-900" : "text-lg font-semibold text-ink-900"}>
      {parts.join(" + ")}
    </p>
  );
}
