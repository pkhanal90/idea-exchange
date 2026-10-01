import { NextRequest } from "next/server";
import { requireAdminSection } from "@/lib/rbac";
import { getFinancialsBreakdown } from "@/lib/admin-metrics";
import { toCsv, csvResponse } from "@/lib/csv";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { IndustryCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
  await requireAdminSection("financials");

  const type = req.nextUrl.searchParams.get("type") === "payouts" ? "payouts" : "categories";
  const data = await getFinancialsBreakdown();

  if (type === "payouts") {
    const csv = toCsv(
      ["Listing", "Seller", "Amount", "Funded"],
      data.pendingPayouts.map((p) => [p.title, p.seller, formatCurrency(p.amount), formatDate(p.fundedAt)]),
    );
    return csvResponse(csv, "pending-payouts.csv");
  }

  const csv = toCsv(
    ["Category", "Deals", "Volume", "Commission rate", "Commission earned"],
    data.byCategory.map((row) => [
      CATEGORY_LABELS[row.category as IndustryCategory],
      row.count,
      formatCurrency(row.volume),
      `${row.rate}%`,
      formatCurrency(row.commission),
    ]),
  );
  return csvResponse(csv, "commission-by-category.csv");
}
