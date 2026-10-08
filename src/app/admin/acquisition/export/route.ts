import { NextRequest } from "next/server";
import { requireAdminSection } from "@/lib/rbac";
import { getAcquisitionReport, parseRange, type FunnelRow } from "@/lib/acquisition-metrics";
import { toCsv, csvResponse } from "@/lib/csv";

const dollars = (cents: number) => (cents / 100).toFixed(2);

function funnelCsv(rows: FunnelRow[], byCampaign: boolean) {
  return toCsv(
    [
      byCampaign ? "Campaign" : "Source",
      byCampaign ? "Source" : "Medium",
      "Visits",
      "Members",
      "Signed NDA",
      "Made offer",
      "Deals",
      "Deal volume ($)",
      "Spend ($)",
      "Cost per member ($)",
    ],
    rows.map((r) => [
      byCampaign ? r.campaign : r.source,
      byCampaign ? r.source : r.medium,
      r.visits,
      r.members,
      r.ndaMembers,
      r.offerMembers,
      r.deals,
      r.dealVolume,
      dollars(r.spendCents),
      r.costPerMemberCents === null ? "" : dollars(r.costPerMemberCents),
    ]),
  );
}

export async function GET(req: NextRequest) {
  await requireAdminSection("acquisition");

  const type = req.nextUrl.searchParams.get("type");
  const range = parseRange(req.nextUrl.searchParams.get("range") ?? undefined);
  const report = await getAcquisitionReport(range);

  if (type === "campaigns") {
    return csvResponse(funnelCsv(report.byCampaign, true), `acquisition-campaigns-${range}.csv`);
  }
  if (type === "spend") {
    return csvResponse(
      toCsv(
        ["Date", "Channel", "Campaign", "Amount ($)", "Note"],
        report.spendEntries.map((e) => [
          e.spentOn.toISOString().slice(0, 10),
          e.source,
          e.campaign,
          dollars(e.amountCents),
          e.note,
        ]),
      ),
      `acquisition-spend-${range}.csv`,
    );
  }
  if (type === "survey") {
    return csvResponse(
      toCsv(
        ["Answer", "Members"],
        report.survey.map((r) => [r.answer, r.count]),
      ),
      `acquisition-survey-${range}.csv`,
    );
  }
  return csvResponse(funnelCsv(report.bySource, false), `acquisition-sources-${range}.csv`);
}
