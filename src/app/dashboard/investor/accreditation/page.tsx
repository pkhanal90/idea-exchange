import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { attestAccreditationAction } from "@/app/dashboard/investor/actions";
import { formatDate } from "@/lib/utils";
import { BadgeCheck, Bookmark, LayoutGrid, MessageSquare } from "lucide-react";

const navItems = [
  { href: "/dashboard/investor", label: "Deal Room", icon: LayoutGrid },
  { href: "/dashboard/investor/accreditation", label: "Accreditation", icon: BadgeCheck },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

export default async function AccreditationPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/investor/accreditation");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { accreditationStatus: true, accreditationAttestedAt: true },
  });

  const attested = user?.accreditationStatus === "SELF_ATTESTED";

  return (
    <DashboardShell
      navItems={navItems}
      activeHref="/dashboard/investor/accreditation"
      eyebrow="Investor"
    >
      <h1 className="text-xl font-semibold text-ink-900">Accreditation</h1>
      <p className="mt-1 text-sm text-ink-500">
        A lightweight, self-attested check ahead of making offers. This is not a substitute
        for real KYC/accreditation verification.
      </p>

      <Card className="mt-6">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-800">Current status</p>
            <Badge tone={attested ? "success" : "warning"}>
              {attested ? "Self-attested" : "Unsubmitted"}
            </Badge>
          </div>
          {attested && user?.accreditationAttestedAt && (
            <p className="text-xs text-ink-400">
              Attested on {formatDate(user.accreditationAttestedAt)}
            </p>
          )}

          <form action={attestAccreditationAction} className="space-y-4 border-t border-border pt-4">
            <label className="flex items-start gap-2.5 text-sm text-ink-700">
              <input
                type="checkbox"
                name="attested"
                defaultChecked={attested}
                className="mt-0.5 h-4 w-4 rounded border-border text-accent-600 focus:ring-accent-500"
              />
              I attest that I qualify as an accredited investor (or equivalent institutional
              status) under applicable regulations, and understand this platform does not
              independently verify this claim in its current prototype form.
            </label>
            <Button type="submit" size="sm">
              Save attestation
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
