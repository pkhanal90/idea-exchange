import { z } from "zod";

const optionalPositive = z.coerce
  .number()
  .positive()
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalPercent = z.coerce
  .number()
  .min(0)
  .max(100)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const offerTermsSchema = z
  .object({
    amount: optionalPositive,
    equityPercent: optionalPercent,
    royaltyPercent: optionalPercent,
    royaltyTermMonths: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    message: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
  })
  .superRefine((data, ctx) => {
    if (!data.amount && !data.equityPercent && !data.royaltyPercent) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Include a cash amount, an equity percent, or a royalty percent",
      });
    }
    if (data.royaltyPercent && !data.royaltyTermMonths) {
      ctx.addIssue({
        code: "custom",
        path: ["royaltyTermMonths"],
        message: "Set a term length for the royalty",
      });
    }
  });

export type OfferTermsValues = z.infer<typeof offerTermsSchema>;
export type OfferFieldErrors = Partial<Record<keyof OfferTermsValues, string>>;
