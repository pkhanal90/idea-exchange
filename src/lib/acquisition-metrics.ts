import { prisma } from "@/lib/prisma";
import { HEARD_ABOUT_LABELS } from "@/lib/acquisition";
import type { Prisma } from "@prisma/client";

export type AcquisitionRange = "7d" | "30d" | "all";

export function parseRange(value: string | undefined): AcquisitionRange {
  return value === "7d" || value === "all" ? value : "30d";
}

function sinceFor(range: AcquisitionRange): Date | undefined {
  if (range === "all") return undefined;
  const days = range === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const UNTRACKED = "(not tracked)";

// One funnel row, used for both the by-source and by-campaign tables.
// Members are the cohort that signed up in the range; NDA / offer / deal
// columns count what those same members have done since (lifetime, not just
// in the range), so a member who signed up last week and bought today counts.
export type FunnelRow = {
  source: string;
  campaign: string | null;
  medium: string;
  visits: number;
  members: number;
  ndaMembers: number;
  offerMembers: number;
  deals: number;
  dealVolume: number; // dollars
  spendCents: number;
  costPerMemberCents: number | null;
};

export type SpendEntry = {
  id: string;
  source: string;
  campaign: string | null;
  amountCents: number;
  spentOn: Date;
  note: string | null;
};

export type SurveyRow = { answer: string; count: number };

export type AcquisitionReport = {
  range: AcquisitionRange;
  totalVisits: number;
  totalMembers: number;
  attributedMembers: number;
  answeredSurvey: number;
  conversion: number;
  totalSpendCents: number;
  costPerMemberCents: number | null;
  bySource: FunnelRow[];
  byCampaign: FunnelRow[];
  survey: SurveyRow[];
  spendEntries: SpendEntry[];
};

const pct = (num: number, den: number) => (den === 0 ? 0 : Math.round((num / den) * 1000) / 10);
const perMember = (cents: number, members: number) => (members === 0 || cents === 0 ? null : Math.round(cents / members));

function emptyRow(source: string, campaign: string | null, medium = ""): FunnelRow {
  return {
    source,
    campaign,
    medium,
    visits: 0,
    members: 0,
    ndaMembers: 0,
    offerMembers: 0,
    deals: 0,
    dealVolume: 0,
    spendCents: 0,
    costPerMemberCents: null,
  };
}

export async function getAcquisitionReport(range: AcquisitionRange): Promise<AcquisitionReport> {
  const since = sinceFor(range);
  const visitWhere: Prisma.SiteVisitWhereInput = since ? { createdAt: { gte: since } } : {};
  const spendWhere: Prisma.CampaignSpendWhereInput = since ? { spentOn: { gte: since } } : {};

  // The signup cohort: real members who joined in the range. Staff and the
  // seeded demo accounts are excluded so demo deals never show up as marketing results.
  const cohort: Prisma.UserWhereInput = {
    role: { not: "ADMIN" },
    NOT: { email: { endsWith: "@ideaexchange.test" } },
    ...(since ? { createdAt: { gte: since } } : {}),
  };

  const [visitGroups, members, ndaRows, offerRows, dealRows, spendEntries] = await Promise.all([
    prisma.siteVisit.groupBy({
      by: ["source", "medium", "campaign"],
      where: visitWhere,
      _count: { _all: true },
    }),
    prisma.user.findMany({ where: cohort, select: { id: true, acqSource: true, acqCampaign: true, heardAbout: true } }),
    prisma.ndaAcceptance.findMany({ where: { user: cohort }, distinct: ["userId"], select: { userId: true } }),
    prisma.offer.findMany({ where: { buyer: cohort }, distinct: ["buyerId"], select: { buyerId: true } }),
    prisma.deal.findMany({
      where: { buyer: cohort, stage: "COMPLETE" },
      select: { buyerId: true, finalAmount: true },
    }),
    prisma.campaignSpend.findMany({ where: spendWhere, orderBy: { spentOn: "desc" } }),
  ]);

  const sourceRows = new Map<string, FunnelRow>();
  const campaignRows = new Map<string, FunnelRow>();
  const getSource = (source: string, medium = "") => {
    let row = sourceRows.get(source);
    if (!row) sourceRows.set(source, (row = emptyRow(source, null, medium)));
    if (!row.medium && medium) row.medium = medium;
    return row;
  };
  const getCampaign = (source: string, campaign: string) => {
    const key = `${campaign}|${source}`;
    let row = campaignRows.get(key);
    if (!row) campaignRows.set(key, (row = emptyRow(source, campaign)));
    return row;
  };

  let totalVisits = 0;
  for (const v of visitGroups) {
    const n = v._count._all;
    totalVisits += n;
    getSource(v.source, v.medium).visits += n;
    if (v.campaign) getCampaign(v.source, v.campaign).visits += n;
  }

  // member id -> where they came from, so NDA / offer / deal rows can be
  // credited back to the channel that brought the person in.
  const origin = new Map<string, { source: string; campaign: string | null }>();
  let attributedMembers = 0;
  for (const m of members) {
    const source = m.acqSource ?? UNTRACKED;
    if (m.acqSource) attributedMembers++;
    origin.set(m.id, { source, campaign: m.acqCampaign });
    getSource(source).members++;
    if (m.acqCampaign) getCampaign(source, m.acqCampaign).members++;
  }

  const credit = (id: string, apply: (row: FunnelRow) => void) => {
    const o = origin.get(id);
    if (!o) return;
    apply(getSource(o.source));
    if (o.campaign) apply(getCampaign(o.source, o.campaign));
  };
  for (const r of ndaRows) credit(r.userId, (row) => row.ndaMembers++);
  for (const r of offerRows) credit(r.buyerId, (row) => row.offerMembers++);
  for (const r of dealRows) {
    credit(r.buyerId, (row) => {
      row.deals++;
      row.dealVolume += Number(r.finalAmount ?? 0);
    });
  }

  let totalSpendCents = 0;
  for (const e of spendEntries) {
    totalSpendCents += e.amountCents;
    getSource(e.source).spendCents += e.amountCents;
    if (e.campaign) getCampaign(e.source, e.campaign).spendCents += e.amountCents;
  }

  const finish = (rows: Map<string, FunnelRow>) =>
    [...rows.values()]
      .map((r) => ({ ...r, costPerMemberCents: perMember(r.spendCents, r.members) }))
      .sort((a, b) => b.visits + b.members + b.spendCents / 100 - (a.visits + a.members + a.spendCents / 100));

  const surveyCounts = new Map<string, number>();
  let answeredSurvey = 0;
  for (const m of members) {
    const key = m.heardAbout ? (HEARD_ABOUT_LABELS[m.heardAbout] ?? m.heardAbout) : "No answer";
    if (m.heardAbout) answeredSurvey++;
    surveyCounts.set(key, (surveyCounts.get(key) ?? 0) + 1);
  }
  const survey = [...surveyCounts.entries()]
    .map(([answer, count]) => ({ answer, count }))
    .sort((a, b) => b.count - a.count);

  return {
    range,
    totalVisits,
    totalMembers: members.length,
    attributedMembers,
    answeredSurvey,
    conversion: pct(members.length, totalVisits),
    totalSpendCents,
    costPerMemberCents: perMember(totalSpendCents, members.length),
    bySource: finish(sourceRows),
    byCampaign: finish(campaignRows),
    survey,
    spendEntries: spendEntries.map((e) => ({
      id: e.id,
      source: e.source,
      campaign: e.campaign,
      amountCents: e.amountCents,
      spentOn: e.spentOn,
      note: e.note,
    })),
  };
}
