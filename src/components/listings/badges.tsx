import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_LABELS,
  LISTING_STATUS_LABELS,
  LISTING_TYPE_LABELS,
  STAGE_LABELS,
} from "@/lib/constants";
import type {
  IndustryCategory,
  ListingStage,
  ListingStatus,
  ListingType,
} from "@prisma/client";

export function StageBadge({ stage }: { stage: ListingStage }) {
  const tone = stage === "TRACTION" ? "success" : stage === "PROTOTYPE" ? "accent" : "neutral";
  return <Badge tone={tone}>{STAGE_LABELS[stage]}</Badge>;
}

export function CategoryBadge({ category }: { category: IndustryCategory }) {
  return <Badge tone="neutral">{CATEGORY_LABELS[category]}</Badge>;
}

export function ListingTypeBadge({ type }: { type: ListingType }) {
  const tone = type === "AUCTION" ? "warning" : type === "EQUITY_ROYALTY" ? "accent" : "ink";
  return <Badge tone={tone}>{LISTING_TYPE_LABELS[type]}</Badge>;
}

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const tone =
    status === "PUBLISHED"
      ? "success"
      : status === "PENDING_REVIEW"
        ? "warning"
        : status === "REJECTED"
          ? "danger"
          : status === "SOLD"
            ? "ink"
            : "neutral";
  return <Badge tone={tone}>{LISTING_STATUS_LABELS[status]}</Badge>;
}
