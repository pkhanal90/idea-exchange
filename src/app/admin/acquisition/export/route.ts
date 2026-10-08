import { NextRequest } from "next/server";
import { requireAdminSection } from "@/lib/rbac";
import { getAcquisitionReport, parseRange } from "@/lib/acquisition-metrics";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(req: NextRequest) {
  await requireAdminSection("acquisition");

  const type = req.nextUrl.searchParams.get("type");
  const range = parseRange(req.nextUrl.searchParams.get("range") ?? undefined);
  const report = await getAcquisitionReport(range);

  if (type === "campaigns") {
    return csvResponse(
      toCsv(
        ["Campaign", "Source", "Visits", "New members"],
        report.byCampaign.map((r) => [r.campaign, r.source, r.visits, r.signups]),
      ),
      `acquisition-campaigns-${range}.csv`,
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
  return csvResponse(
    toCsv(
      ["Source", "Medium", "Visits", "New members", "Conversion %"],
      report.bySource.map((r) => [r.source, r.medium, r.visits, r.signups, r.visits === 0 ? "" : r.conversion]),
    ),
    `acquisition-sources-${range}.csv`,
  );
}
