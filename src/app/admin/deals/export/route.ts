import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/rbac";
import { toCsv, csvResponse } from "@/lib/csv";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DEAL_STAGE_LABELS } from "@/lib/constants";
import type { DealStage, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  await requireAdminSection("deals");

  const { searchParams } = req.nextUrl;
  const stage = searchParams.get("stage") ?? undefined;

  const where: Prisma.DealWhereInput = {
    ...(stage && { stage: stage as DealStage }),
  };

  const deals = await prisma.deal.findMany({
    where,
    include: {
      listing: { select: { title: true } },
      seller: { select: { name: true, email: true } },
      buyer: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    [
      "Listing",
      "Seller name",
      "Seller email",
      "Buyer name",
      "Buyer email",
      "Stage",
      "Amount",
      "Equity %",
      "Royalty %",
      "Opened",
      "Completed",
      "Cancelled",
      "Disputed",
      "Refunded",
    ],
    deals.map((d) => [
      d.listing.title,
      d.seller.name,
      d.seller.email,
      d.buyer.name,
      d.buyer.email,
      DEAL_STAGE_LABELS[d.stage],
      d.finalAmount ? formatCurrency(d.finalAmount as never) : "",
      d.finalEquityPercent ? String(d.finalEquityPercent) : "",
      d.finalRoyaltyPercent ? String(d.finalRoyaltyPercent) : "",
      formatDate(d.createdAt),
      formatDate(d.completedAt),
      formatDate(d.cancelledAt),
      formatDate(d.disputedAt),
      formatDate(d.refundedAt),
    ]),
  );

  return csvResponse(csv, "deals.csv");
}
