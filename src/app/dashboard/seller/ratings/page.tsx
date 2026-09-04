import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Bookmark, CreditCard, Handshake, LayoutGrid, MessageSquare, Star } from "lucide-react";

const navItems = [
  { href: "/dashboard/seller", label: "My Listings", icon: LayoutGrid },
  { href: "/dashboard/seller/offers", label: "Offers", icon: Handshake },
  { href: "/dashboard/seller/payouts", label: "Payouts", icon: CreditCard },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/seller/ratings", label: "Ratings", icon: Star },
];

export default async function SellerRatingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/seller/ratings");

  const ratings = await prisma.rating.findMany({
    where: { rateeId: session.user.id },
    include: { rater: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell navItems={navItems} activeHref="/dashboard/seller/ratings" eyebrow="Seller">
      <h1 className="text-xl font-semibold text-ink-900">Ratings</h1>
      <p className="mt-1 text-sm text-ink-500">Feedback left by buyers after a completed deal.</p>
      <div className="mt-6">
        {ratings.length === 0 ? (
          <ComingSoon
            title="No ratings yet"
            body="Ratings are exchanged once a deal closes — that flow ships with escrow and messaging next."
          />
        ) : (
          <div className="space-y-3">
            {ratings.map((r) => (
              <Card key={r.id}>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink-900">{r.rater.name ?? "A buyer"}</p>
                    <span className="font-mono-nums text-sm font-semibold text-ink-700">
                      {r.score}/5
                    </span>
                  </div>
                  {r.comment && <p className="mt-1.5 text-sm text-ink-500">{r.comment}</p>}
                  <p className="mt-1.5 text-xs text-ink-400">{formatDate(r.createdAt)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
