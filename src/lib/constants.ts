import type {
  IndustryCategory,
  ListingStage,
  ListingStatus,
  ListingType,
} from "@prisma/client";

export const CATEGORY_LABELS: Record<IndustryCategory, string> = {
  AI_ML: "AI / ML",
  FINTECH: "Fintech",
  HEALTHTECH: "Healthtech",
  ECOMMERCE: "E-commerce",
  SAAS_B2B: "B2B SaaS",
  CONSUMER_SOCIAL: "Consumer / Social",
  MARKETPLACE: "Marketplace",
  CLIMATE_ENERGY: "Climate & Energy",
  EDTECH: "Edtech",
  DEVTOOLS: "Dev Tools",
  HARDWARE_IOT: "Hardware / IoT",
  BIOTECH: "Biotech",
  GAMING: "Gaming",
  OTHER: "Other",
};

export const STAGE_LABELS: Record<ListingStage, string> = {
  CONCEPT: "Concept",
  PROTOTYPE: "Prototype",
  TRACTION: "Early Traction",
};

export const STAGE_DESCRIPTIONS: Record<ListingStage, string> = {
  CONCEPT: "Idea is defined but unbuilt",
  PROTOTYPE: "A working prototype or MVP exists",
  TRACTION: "Live with users, revenue, or signed LOIs",
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  FIXED_PRICE: "Buy It Now",
  AUCTION: "Auction",
  EQUITY_ROYALTY: "Equity / Royalty",
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  REJECTED: "Rejected",
  PUBLISHED: "Published",
  UNDER_OFFER: "Under Offer",
  SOLD: "Sold",
  ARCHIVED: "Archived",
};

export const PRICE_RANGES = [
  { label: "Any price", min: undefined, max: undefined },
  { label: "Under $10k", min: 0, max: 10_000 },
  { label: "$10k – $50k", min: 10_000, max: 50_000 },
  { label: "$50k – $250k", min: 50_000, max: 250_000 },
  { label: "$250k – $1M", min: 250_000, max: 1_000_000 },
  { label: "$1M+", min: 1_000_000, max: undefined },
] as const;
