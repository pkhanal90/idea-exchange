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
  // A Prisma Decimal is an object, not a primitive — `if (decimalZero)` is
  // always true regardless of the value it represents, so every one of
  // these has to compare the numeric value rather than truthy-check the
  // field itself (this is also why offers with blank equity/royalty used to
  // render "0% equity + 0% royalty": see the preprocess fix in
  // lib/validation/offer.ts for the other half of that bug).
  const parts: string[] = [];
  if (amount && Number(amount) > 0) parts.push(formatCurrency(amount as never));
  if (equityPercent && Number(equityPercent) > 0) parts.push(`${Number(equityPercent)}% equity`);
  if (royaltyPercent && Number(royaltyPercent) > 0) {
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
