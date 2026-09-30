import { z } from "zod";

// Matches the Decimal(14, 2) column this ultimately gets written to.
const MAX_AMOUNT = 999_999_999_999;

export const bidSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Enter a bid amount")
    .max(MAX_AMOUNT, `Must be ${MAX_AMOUNT.toLocaleString("en-US")} or less`),
});

export type BidActionState = { error?: string };
