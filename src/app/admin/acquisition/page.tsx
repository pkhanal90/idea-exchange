import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { ExportCsvLink } from "@/components/admin/export-csv-link";
import { UtmLinkBuilder } from "@/components/admin/utm-link-builder";
import { getAdminNavItems } from "@/lib/admin-nav";
import { getUnreadMessageCount } from "@/lib/messages";
import { getAcquisitionReport, parseRange, type AcquisitionRange } from "@/lib/acquisition-metrics";
import { cn } from "@/lib/utils";
import { Eye, MessageSquareQuote, Percent, UserPlus } from "lucide-react";

const RANGES: { key: AcquisitionRange; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" },
];

function Empty({ children }: { children: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-ink-400">{children}</CardContent>
    </Card>
  );
}

const TABLE = "overflow-hidden rounded-lg border border-border";
const THEAD = "bg-ink-50 text-left text-xs font-medium uppercase tracking-wide text-ink-400";

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
            Where visitors and new members come from. First-party and anonymous; no IP addresses stored.
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

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Visits (sessions)" value={report.totalVisits} icon={Eye} tone="accent" />
        <StatCard label="New members" value={report.totalSignups} icon={UserPlus} tone="success" />
        <StatCard label="Visit to member" value={`${report.conversion}%`} icon={Percent} tone="warning" />
        <StatCard label="Answered the survey" value={report.answeredSurvey} icon={MessageSquareQuote} tone="ink" />
      </div>
      {report.attributedSignups < report.totalSignups && (
        <p className="mt-2 text-xs text-ink-400">
          {report.totalSignups - report.attributedSignups} of {report.totalSignups} members have no tracked source
          (they joined before tracking started, or arrived without it). Visit counts begin when tracking went live.
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
          <div className={TABLE}>
            <table className="w-full text-sm">
              <thead className={THEAD}>
                <tr>
                  <th className="px-4 py-2.5">Source</th>
                  <th className="px-4 py-2.5">Medium</th>
                  <th className="px-4 py-2.5">Visits</th>
                  <th className="px-4 py-2.5">New members</th>
                  <th className="px-4 py-2.5">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.bySource.map((r) => (
                  <tr key={r.source}>
                    <td className="px-4 py-2.5 font-medium text-ink-800">{r.source}</td>
                    <td className="px-4 py-2.5 text-ink-600">{r.medium || "-"}</td>
                    <td className="px-4 py-2.5 font-mono-nums text-ink-800">{r.visits}</td>
                    <td className="px-4 py-2.5 font-mono-nums text-ink-800">{r.signups}</td>
                    <td className="px-4 py-2.5 font-mono-nums text-ink-600">
                      {r.visits === 0 ? "-" : `${r.conversion}%`}
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
          <h2 className="text-sm font-semibold text-ink-900">By campaign or post</h2>
          <ExportCsvLink href={`/admin/acquisition/export?type=campaigns&range=${range}`} />
        </div>
        {report.byCampaign.length === 0 ? (
          <Empty>No tagged links used yet. Make one above and post it.</Empty>
        ) : (
          <div className={TABLE}>
            <table className="w-full text-sm">
              <thead className={THEAD}>
                <tr>
                  <th className="px-4 py-2.5">Campaign</th>
                  <th className="px-4 py-2.5">Source</th>
                  <th className="px-4 py-2.5">Visits</th>
                  <th className="px-4 py-2.5">New members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.byCampaign.map((r) => (
                  <tr key={`${r.campaign}|${r.source}`}>
                    <td className="px-4 py-2.5 font-medium text-ink-800">{r.campaign}</td>
                    <td className="px-4 py-2.5 text-ink-600">{r.source}</td>
                    <td className="px-4 py-2.5 font-mono-nums text-ink-800">{r.visits}</td>
                    <td className="px-4 py-2.5 font-mono-nums text-ink-800">{r.signups}</td>
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
