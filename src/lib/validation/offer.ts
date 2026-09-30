import { z } from "zod";

// Matches the Decimal(14, 2) column this ultimately gets written to — a
// value above this would round-trip through Zod fine but throw on the
// Prisma write, surfacing as an unhandled 500 instead of a field error.
const MAX_AMOUNT = 999_999_999_999;

// Blank must become `undefined`, not coerce to 0 — done via preprocess
// rather than `.or(z.literal("").transform(...))` because that pattern only
// falls through to the empty-string branch when the numeric branch *fails*
// first. z.coerce.number() happily turns "" into 0, so any range that
// accepts 0 (like .min(0) below) swallows blank input as a real 0 before
// the empty-string branch is ever tried — which is exactly how equityPercent
// and royaltyPercent ended up stored as 0 instead of null on every offer
// that left them blank.
const blankToUndefined = (val: unknown) => (val === "" ? undefined : val);

const optionalPositive = z.preprocess(
  blankToUndefined,
  z.coerce
    .number()
    .positive()
    .max(MAX_AMOUNT, `Must be ${MAX_AMOUNT.toLocaleString("en-US")} or less`)
    .optional(),
);

const optionalPercent = z.preprocess(blankToUndefined, z.coerce.number().min(0).max(100).optional());

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
