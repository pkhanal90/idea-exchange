import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { AuditAction, Prisma } from "@prisma/client";

interface AdminAuditLogPageProps {
  searchParams: Promise<{ actor?: string; action?: string }>;
}

const AUDIT_ACTIONS: AuditAction[] = [
  "LISTING_APPROVED",
  "LISTING_REJECTED",
  "LISTING_FEATURED",
  "LISTING_UNFEATURED",
  "LISTING_REMOVED",
  "USER_SUSPENDED",
  "USER_BANNED",
  "USER_REACTIVATED",
  "USER_ACCREDITATION_UPDATED",
  "DEAL_CANCELLED",
  "DEAL_REFUNDED",
  "DEAL_MARKED_DISPUTED",
  "SETTINGS_UPDATED",
  "SPONSORED_PLACEMENT_CREATED",
  "SPONSORED_PLACEMENT_UPDATED",
  "SPONSORED_PLACEMENT_REMOVED",
];

function targetHref(targetType: string, targetId: string | null) {
  if (!targetId) return null;
  if (targetType === "User") return `/admin/users/${targetId}`;
  if (targetType === "Listing") return `/listings/${targetId}`;
  if (targetType === "Deal") return `/deals/${targetId}`;
  return null;
}

export default async function AdminAuditLogPage({ searchParams }: AdminAuditLogPageProps) {
  const { actor, action } = await searchParams;

  const where: Prisma.AuditLogWhereInput = {
    ...(actor && {
      actor: {
        OR: [
          { name: { contains: actor, mode: "insensitive" } },
          { email: { contains: actor, mode: "insensitive" } },
        ],
      },
    }),
    ...(action && { action: action as AuditAction }),
  };

  const entries = await prisma.auditLog.findMany({
    where,
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  return (
    <DashboardShell navItems={ADMIN_NAV_ITEMS} activeHref="/admin/audit-log" eyebrow="Admin">
      <h1 className="text-xl font-semibold text-ink-900">Audit Log</h1>
      <p className="mt-1 text-sm text-ink-500">
        Every admin action, with who took it, when, and — where relevant — a before/after
        snapshot of the affected record.
      </p>

      <form className="mt-6 flex flex-wrap gap-3">
        <Input name="actor" defaultValue={actor} placeholder="Search by admin name or email" className="max-w-xs" />
        <Select name="action" defaultValue={action ?? ""} className="max-w-56">
          <option value="">All actions</option>
          {AUDIT_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <div className="mt-6 space-y-2">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-ink-400">
              No audit log entries match those filters.
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => {
            const href = targetHref(entry.targetType, entry.targetId);
            return (
              <Card key={entry.id}>
                <CardContent className="py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-ink-700">
                      <span className="font-medium text-ink-900">
                        {entry.actor.name ?? entry.actor.email}
                      </span>{" "}
                      <Badge tone="accent">{entry.action.replaceAll("_", " ")}</Badge>{" "}
                      {entry.targetType}
                      {href && (
                        <>
                          {" "}
                          ·{" "}
                          <Link href={href} className="text-accent-700 hover:text-accent-800">
                            view
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="shrink-0 text-xs text-ink-400">
                      {formatDate(entry.createdAt)}
                      {entry.ipAddress && ` · ${entry.ipAddress}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </DashboardShell>
  );
}
