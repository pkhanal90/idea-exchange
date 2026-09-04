import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createConnectOnboardingLinkAction } from "@/app/dashboard/seller/payouts/actions";
import { Bookmark, CreditCard, Handshake, LayoutGrid, MessageSquare, Star } from "lucide-react";

const navItems = [
  { href: "/dashboard/seller", label: "My Listings", icon: LayoutGrid },
  { href: "/dashboard/seller/offers", label: "Offers", icon: Handshake },
  { href: "/dashboard/seller/payouts", label: "Payouts", icon: CreditCard },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/seller/ratings", label: "Ratings", icon: Star },
];

export default async function PayoutsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/seller/payouts");

  let user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  // Local dev usually doesn't have the Stripe webhook forwarded, so re-check
  // onboarding status live from Stripe whenever we have an account on file.
  if (stripeEnabled && user.stripeConnectAccountId && !user.stripeConnectOnboarded) {
    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
    if (account.details_submitted && account.charges_enabled) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectOnboarded: true },
      });
    }
  }

  return (
    <DashboardShell navItems={navItems} activeHref="/dashboard/seller/payouts" eyebrow="Seller">
      <h1 className="text-xl font-semibold text-ink-900">Payouts</h1>
      <p className="mt-1 text-sm text-ink-500">
        Connect a Stripe account to receive escrow releases when a deal completes. Test mode
        only — no real funds move.
      </p>

      <Card className="mt-6">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-800">Stripe Connect status</p>
            <Badge tone={user.stripeConnectOnboarded ? "success" : "warning"}>
              {user.stripeConnectOnboarded
                ? "Connected"
                : user.stripeConnectAccountId
                  ? "Onboarding incomplete"
                  : "Not connected"}
            </Badge>
          </div>

          {!stripeEnabled ? (
            <p className="rounded-lg border border-warning-500/30 bg-warning-50 px-3.5 py-2.5 text-sm text-warning-700">
              Stripe isn&apos;t configured in this environment — set{" "}
              <code className="font-mono text-xs">STRIPE_SECRET_KEY</code> to enable payouts.
            </p>
          ) : (
            <form action={createConnectOnboardingLinkAction}>
              <Button type="submit" size="sm">
                {user.stripeConnectAccountId ? "Continue onboarding" : "Connect with Stripe"}
              </Button>
            </form>
          )}

          <p className="text-xs text-ink-400">
            You&apos;ll be redirected to Stripe&apos;s hosted onboarding flow (test mode) and
            brought back here when finished.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
