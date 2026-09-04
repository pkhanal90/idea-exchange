import { z } from "zod";

export const bidSchema = z.object({
  amount: z.coerce.number().positive("Enter a bid amount"),
});

export type BidActionState = { error?: string };
