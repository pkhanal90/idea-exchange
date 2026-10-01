import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { StaffRow } from "@/components/admin/staff-row";
import { StaffInviteForm } from "@/components/admin/staff-invite-form";
import { getAdminNavItems } from "@/lib/admin-nav";
import { getUnreadMessageCount } from "@/lib/messages";

export default async function AdminStaffPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin/staff");

  const [staff, unreadMessages] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true, email: true, adminRole: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    getUnreadMessageCount(session.user.id),
  ]);

  return (
    <DashboardShell
      navItems={getAdminNavItems(unreadMessages, session.user.adminRole)}
      activeHref="/admin/staff"
      eyebrow="Admin"
      tone="ADMIN"
    >
      <h1 className="text-xl font-semibold text-ink-900">Staff</h1>
      <p className="mt-1 text-sm text-ink-500">
        Everyone with admin dashboard access, and what they can each see. No passwords to set —
        a new hire signs in with a magic link to the email you add below.
      </p>

      <Card className="mt-6">
        <CardContent>
          <StaffInviteForm />
        </CardContent>
      </Card>

      <div className="mt-6 space-y-3">
        {staff.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-ink-400">
              No staff accounts yet.
            </CardContent>
          </Card>
        ) : (
          staff.map((member) => (
            <StaffRow key={member.id} staff={member} isSelf={member.id === session.user.id} />
          ))
        )}
      </div>
    </DashboardShell>
  );
}
