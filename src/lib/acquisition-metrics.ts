import { prisma } from "@/lib/prisma";
import { HEARD_ABOUT_LABELS } from "@/lib/acquisition";

export type AcquisitionRange = "7d" | "30d" | "all";

export function parseRange(value: string | undefined): AcquisitionRange {
  return value === "7d" || value === "all" ? value : "30d";
}

function sinceFor(range: AcquisitionRange): Date | undefined {
  if (range === "all") return undefined;
  const days = range === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export type SourceRow = {
  source: string;
  medium: string;
  visits: number;
  signups: number;
  conversion: number; // percent, 1 decimal
};

export type CampaignRow = { campaign: string; source: string; visits: number; signups: number };
export type SurveyRow = { answer: string; count: number };

export type AcquisitionReport = {
  range: AcquisitionRange;
  totalVisits: number;
  totalSignups: number;
  attributedSignups: number;
  answeredSurvey: number;
  conversion: number;
  bySource: SourceRow[];
  byCampaign: CampaignRow[];
  survey: SurveyRow[];
};

const pct = (num: number, den: number) => (den === 0 ? 0 : Math.round((num / den) * 1000) / 10);

export async function getAcquisitionReport(range: AcquisitionRange): Promise<AcquisitionReport> {
  const since = sinceFor(range);
  const visitWhere = since ? { createdAt: { gte: since } } : {};
  // Staff accounts aren't "sign-ups" in any marketing sense.
  const userWhere = { role: { not: "ADMIN" as const }, ...(since ? { createdAt: { gte: since } } : {}) };

  const [visitsBySource, visitsByCampaign, usersBySource, usersByCampaign, surveyGroups, totalSignups] =
    await Promise.all([
      prisma.siteVisit.groupBy({ by: ["source", "medium"], where: visitWhere, _count: { _all: true } }),
      prisma.siteVisit.groupBy({
        by: ["campaign", "source"],
        where: { ...visitWhere, campaign: { not: null } },
        _count: { _all: true },
      }),
      prisma.user.groupBy({ by: ["acqSource"], where: userWhere, _count: { _all: true } }),
      prisma.user.groupBy({
        by: ["acqCampaign", "acqSource"],
        where: { ...userWhere, acqCampaign: { not: null } },
        _count: { _all: true },
      }),
      prisma.user.groupBy({ by: ["heardAbout"], where: userWhere, _count: { _all: true } }),
      prisma.user.count({ where: userWhere }),
    ]);

  const sources = new Map<string, SourceRow>();
  for (const v of visitsBySource) {
    const row = sources.get(v.source) ?? { source: v.source, medium: v.medium, visits: 0, signups: 0, conversion: 0 };
    row.visits += v._count._all;
    sources.set(v.source, row);
  }
  let attributedSignups = 0;
  for (const u of usersBySource) {
    // Accounts that predate tracking (or arrived with no cookie) have no
    // source — they're shown as one explicit bucket rather than hidden.
    const key = u.acqSource ?? "(not tracked)";
    if (u.acqSource) attributedSignups += u._count._all;
    const row = sources.get(key) ?? { source: key, medium: "", visits: 0, signups: 0, conversion: 0 };
    row.signups += u._count._all;
    sources.set(key, row);
  }
  const bySource = [...sources.values()]
    .map((r) => ({ ...r, conversion: r.visits === 0 ? 0 : pct(r.signups, r.visits) }))
    .sort((a, b) => b.visits + b.signups - (a.visits + a.signups));

  const campaigns = new Map<string, CampaignRow>();
  for (const v of visitsByCampaign) {
    const key = `${v.campaign}|${v.source}`;
    campaigns.set(key, { campaign: v.campaign!, source: v.source, visits: v._count._all, signups: 0 });
  }
  for (const u of usersByCampaign) {
    const key = `${u.acqCampaign}|${u.acqSource}`;
    const row = campaigns.get(key) ?? { campaign: u.acqCampaign!, source: u.acqSource ?? "", visits: 0, signups: 0 };
    row.signups += u._count._all;
    campaigns.set(key, row);
  }
  const byCampaign = [...campaigns.values()].sort((a, b) => b.visits + b.signups - (a.visits + a.signups));

  let answeredSurvey = 0;
  const survey: SurveyRow[] = surveyGroups
    .map((g) => {
      if (g.heardAbout) answeredSurvey += g._count._all;
      return {
        answer: g.heardAbout ? (HEARD_ABOUT_LABELS[g.heardAbout] ?? g.heardAbout) : "No answer",
        count: g._count._all,
      };
    })
    .sort((a, b) => b.count - a.count);

  const totalVisits = visitsBySource.reduce((n, v) => n + v._count._all, 0);
  return {
    range,
    totalVisits,
    totalSignups,
    attributedSignups,
    answeredSurvey,
    conversion: pct(totalSignups, totalVisits),
    bySource,
    byCampaign,
    survey,
  };
}
