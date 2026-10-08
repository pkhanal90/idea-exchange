import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { ExportCsvLink } from "@/components/admin/export-csv-link";
import { UtmLinkBuilder } from "@/components/admin/utm-link-builder";
import { SpendForm } from "@/components/admin/spend-form";
import { SpendDeleteButton } from "@/components/admin/spend-delete-button";
import { getAdminNavItems } from "@/lib/admin-nav";
import { getUnreadMessageCount } from "@/lib/messages";
import {
  getAcquisitionReport,
  parseRange,
  type AcquisitionRange,
  type FunnelRow,
} from "@/lib/acquisition-metrics";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Eye, MessageSquareQuote, Percent, UserPlus, Users, Wallet } from "lucide-react";

const RANGES: { key: AcquisitionRange; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" },
];

const usd = (cents: number) => formatCurrency(cents / 100);

function Empty({ children }: { children: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-ink-400">{children}</CardContent>
    </Card>
  );
}

const TABLE = "overflow-hidden rounded-lg border border-border";
const THEAD = "bg-ink-50 text-left text-xs font-medium uppercase tracking-wide text-ink-400";

function FunnelTable({ rows, bySource }: { rows: FunnelRow[]; bySource?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[760px] text-sm">
        <thead className={THEAD}>
          <tr>
            <th className="px-4 py-2.5">{bySource ? "Source" : "Campaign"}</th>
            <th className="px-4 py-2.5">{bySource ? "Medium" : "Source"}</th>
            <th className="px-4 py-2.5">Visits</th>
            <th className="px-4 py-2.5">Members</th>
            <th className="px-4 py-2.5">Signed NDA</th>
            <th className="px-4 py-2.5">Made offer</th>
            <th className="px-4 py-2.5">Deals</th>
            <th className="px-4 py-2.5">Spend</th>
            <th className="px-4 py-2.5">Cost / member</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={`${r.campaign ?? ""}|${r.source}`}>
              <td className="px-4 py-2.5 font-medium text-ink-800">{bySource ? r.source : r.campaign}</td>
              <td className="px-4 py-2.5 text-ink-600">{bySource ? r.medium || "-" : r.source}</td>
              <td className="px-4 py-2.5 font-mono-nums text-ink-800">{r.visits}</td>
              <td className="px-4 py-2.5 font-mono-nums text-ink-800">{r.members}</td>
              <td className="px-4 py-2.5 font-mono-nums text-ink-800">{r.ndaMembers}</td>
              <td className="px-4 py-2.5 font-mono-nums text-ink-800">{r.offerMembers}</td>
              <td className="px-4 py-2.5 font-mono-nums text-ink-800">
                {r.deals}
                {r.dealVolume > 0 && <span className="text-ink-400"> ({formatCurrency(r.dealVolume)})</span>}
              </td>
              <td className="px-4 py-2.5 font-mono-nums text-ink-800">{r.spendCents ? usd(r.spendCents) : "-"}</td>
              <td className="px-4 py-2.5 font-mono-nums text-ink-600">
                {r.costPerMemberCents === null ? "-" : usd(r.costPerMemberCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminAcquisitionPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin/acquisition");

  const range = parseRange((await searchParams).range);
  const [report, unreadMessages] = await Promise.all([
    getAcquisitionReport(range),
    getUnreadMessageCount(session.user.id),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ideaexchange.io";

  return (
    <DashboardShell
      navItems={getAdminNavItems(unreadMessages, session.user.adminRole)}
      activeHref="/admin/acquisition"
      eyebrow="Admin"
      tone="ADMIN"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Acquisition</h1>
          <p className="mt-1 text-sm text-ink-500">
            Where visitors and new members come from, what they go on to do, and what each channel costs.
            First-party and anonymous; no IP addresses stored.
          </p>
        </div>
        <div className="flex rounded-lg border border-border bg-white p-0.5 text-sm">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin/acquisition?range=${r.key}`}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-colors",
                r.key === range ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50",
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Visits (sessions)" value={report.totalVisits} icon={Eye} tone="accent" />
        <StatCard label="New members" value={report.totalMembers} icon={UserPlus} tone="success" />
        <StatCard label="Visit to member" value={`${report.conversion}%`} icon={Percent} tone="warning" />
        <StatCard label="Answered the survey" value={report.answeredSurvey} icon={MessageSquareQuote} tone="ink" />
        <StatCard label="Marketing spend" value={usd(report.totalSpendCents)} icon={Wallet} tone="warning" />
        <StatCard
          label="Cost per member"
          value={report.costPerMemberCents === null ? "-" : usd(report.costPerMemberCents)}
          icon={Users}
          tone="accent"
        />
      </div>
      {report.attributedMembers < report.totalMembers && (
        <p className="mt-2 text-xs text-ink-400">
          {report.totalMembers - report.attributedMembers} of {report.totalMembers} members have no tracked source
          (they joined before tracking started, or arrived without it). Visit counts begin when tracking went live.
          Demo and staff accounts are excluded.
        </p>
      )}

      <section className="mt-8">
        <h2 className="mb-1 text-sm font-semibold text-ink-900">Make a tagged link</h2>
        <p className="mb-3 text-xs text-ink-500">
          Use a different link for every channel and every post, so you can see exactly which one worked.
        </p>
        <UtmLinkBuilder baseUrl={baseUrl} />
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">By source</h2>
          <ExportCsvLink href={`/admin/acquisition/export?type=sources&range=${range}`} />
        </div>
        {report.bySource.length === 0 ? (
          <Empty>No visits or sign-ups recorded yet.</Empty>
        ) : (
          <FunnelTable rows={report.bySource} bySource />
        )}
        <p className="mt-2 text-xs text-ink-400">
          Members are people who signed up in this period. Signed NDA, Made offer and Deals show what those same
          members have done since, so you can see which channel brings people who actually transact.
        </p>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">By campaign or post</h2>
          <ExportCsvLink href={`/admin/acquisition/export?type=campaigns&range=${range}`} />
        </div>
        {report.byCampaign.length === 0 ? (
          <Empty>No tagged links used yet. Make one above and post it.</Empty>
        ) : (
          <FunnelTable rows={report.byCampaign} />
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Campaign spend</h2>
          <ExportCsvLink href={`/admin/acquisition/export?type=spend&range=${range}`} />
        </div>
        <p className="mb-3 text-xs text-ink-500">
          Log what you spend on each channel (ads, boosts, tools, freelancers). Use the same campaign name as your
          tagged link so cost per member shows up next to the results above.
        </p>
        <SpendForm today={today} />
        {report.spendEntries.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className={THEAD}>
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Channel</th>
                  <th className="px-4 py-2.5">Campaign</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Note</th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.spendEntries.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-2.5 text-ink-600">{formatDate(e.spentOn)}</td>
                    <td className="px-4 py-2.5 font-medium text-ink-800">{e.source}</td>
                    <td className="px-4 py-2.5 text-ink-600">{e.campaign ?? "-"}</td>
                    <td className="px-4 py-2.5 font-mono-nums text-ink-800">{usd(e.amountCents)}</td>
                    <td className="px-4 py-2.5 text-ink-500">{e.note ?? ""}</td>
                    <td className="px-2 py-2.5 text-right">
                      <SpendDeleteButton id={e.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">&ldquo;How did you hear about us?&rdquo;</h2>
          <ExportCsvLink href={`/admin/acquisition/export?type=survey&range=${range}`} />
        </div>
        {report.survey.length === 0 ? (
          <Empty>No answers yet.</Empty>
        ) : (
          <div className={TABLE}>
            <table className="w-full text-sm">
              <thead className={THEAD}>
                <tr>
                  <th className="px-4 py-2.5">Answer</th>
                  <th className="px-4 py-2.5">Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.survey.map((r) => (
                  <tr key={r.answer}>
                    <td className="px-4 py-2.5 font-medium text-ink-800">{r.answer}</td>
                    <td className="px-4 py-2.5 font-mono-nums text-ink-800">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
