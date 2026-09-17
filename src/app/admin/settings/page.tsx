import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";
import { formatDate } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true, twoFactorEnabledAt: true },
  });

  return (
    <DashboardShell navItems={ADMIN_NAV_ITEMS} activeHref="/admin/settings" eyebrow="Admin" tone="ADMIN">
      <h1 className="text-xl font-semibold text-ink-900">Platform Settings</h1>
      <p className="mt-1 text-sm text-ink-500">
        Commission rate, per-category overrides, featured-listing pricing, and categories —
        editable without a code deploy.
      </p>

      <Card className="mt-6">
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ink-700 to-ink-900 text-white">
              <ShieldCheck className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink-800">Two-factor authentication</p>
              <p className="text-xs text-ink-400">
                Required for every admin account, verified once per browser every 12 hours.
              </p>
            </div>
          </div>
          <Badge tone={user?.twoFactorEnabled ? "success" : "warning"}>
            {user?.twoFactorEnabled && user.twoFactorEnabledAt
              ? `Enabled ${formatDate(user.twoFactorEnabledAt)}`
              : "Not enabled"}
          </Badge>
        </CardContent>
      </Card>

      <div className="mt-6">
        <ComingSoon
          title="The settings panel is next"
          body="Reads and writes the singleton PlatformSettings row (plus CategoryCommissionOverride) already added to the schema, so every value here takes effect immediately across the app."
        />
      </div>
    </DashboardShell>
  );
}
