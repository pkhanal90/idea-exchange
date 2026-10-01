import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/rbac";
import { toCsv, csvResponse } from "@/lib/csv";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CATEGORY_LABELS, LISTING_STATUS_LABELS, STAGE_LABELS } from "@/lib/constants";
import type { IndustryCategory, ListingStatus, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  await requireAdminSection("listings");

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const category = searchParams.get("category") ?? undefined;

  const where: Prisma.ListingWhereInput = {
    ...(q && { title: { contains: q, mode: "insensitive" } }),
    ...(status && { status: status as ListingStatus }),
    ...(category && { category: category as IndustryCategory }),
  };

  const listings = await prisma.listing.findMany({
    where,
    include: { seller: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    [
      "Title",
      "Category",
      "Stage",
      "Status",
      "Asking price",
      "Seller name",
      "Seller email",
      "Views",
      "Featured",
      "Listed",
    ],
    listings.map((l) => [
      l.title,
      CATEGORY_LABELS[l.category],
      STAGE_LABELS[l.stage],
      LISTING_STATUS_LABELS[l.status],
      l.askingPrice ? formatCurrency(l.askingPrice as never) : "",
      l.seller.name,
      l.seller.email,
      l.viewCount,
      l.isFeatured ? "Yes" : "No",
      formatDate(l.createdAt),
    ]),
  );

  return csvResponse(csv, "listings.csv");
}
