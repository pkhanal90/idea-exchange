import { z } from "zod";

export const listingSchema = z
  .object({
    title: z.string().trim().min(8, "Title should be at least 8 characters").max(120),
    teaserSummary: z
      .string()
      .trim()
      .min(20, "Give buyers at least a sentence to go on")
      .max(280, "Keep the public teaser under 280 characters"),
    problemStatement: z.string().trim().min(30, "Explain the problem in more detail"),
    proposedSolution: z.string().trim().min(30, "Explain the solution in more detail"),
    targetMarket: z.string().trim().min(20, "Describe the target market"),
    tamEstimate: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
    monetizationPlan: z.string().trim().min(20, "Describe how this idea makes money"),
    stage: z.enum(["CONCEPT", "PROTOTYPE", "TRACTION"]),
    category: z.enum([
      "AI_ML",
      "FINTECH",
      "HEALTHTECH",
      "ECOMMERCE",
      "SAAS_B2B",
      "CONSUMER_SOCIAL",
      "MARKETPLACE",
      "CLIMATE_ENERGY",
      "EDTECH",
      "DEVTOOLS",
      "HARDWARE_IOT",
      "BIOTECH",
      "GAMING",
      "OTHER",
    ]),
    listingType: z.enum(["FIXED_PRICE", "AUCTION", "EQUITY_ROYALTY"]),
    askingPrice: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
    reservePrice: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
    startingBid: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
    auctionEndsAt: z
      .string()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    openToEquity: z.coerce.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.listingType === "FIXED_PRICE" && !data.askingPrice) {
      ctx.addIssue({
        code: "custom",
        path: ["askingPrice"],
        message: "Set an asking price for a Buy It Now listing",
      });
    }
    if (data.listingType === "AUCTION") {
      if (!data.startingBid) {
        ctx.addIssue({
          code: "custom",
          path: ["startingBid"],
          message: "Set a starting bid for an auction",
        });
      }
      if (!data.auctionEndsAt) {
        ctx.addIssue({
          code: "custom",
          path: ["auctionEndsAt"],
          message: "Set an auction end date",
        });
      } else if (new Date(data.auctionEndsAt).getTime() <= Date.now()) {
        ctx.addIssue({
          code: "custom",
          path: ["auctionEndsAt"],
          message: "Auction end date must be in the future",
        });
      }
    }
  });

export type ListingFormValues = z.infer<typeof listingSchema>;
export type ListingFieldErrors = Partial<Record<keyof ListingFormValues, string>>;
