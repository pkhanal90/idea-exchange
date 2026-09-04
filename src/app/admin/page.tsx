import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { ModerationRow } from "@/components/admin/moderation-row";
import { ShieldCheck } from "lucide-react";

export default async function AdminModerationPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const pending = await prisma.listing.findMany({
    where: { status: "PENDING_REVIEW" },
    include: { seller: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <Container className="py-10">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-ink-400" />
        <h1 className="text-2xl font-semibold text-ink-900">Moderation Queue</h1>
      </div>
      <p className="mt-1.5 text-sm text-ink-500">
        Review structured briefs before they become publicly searchable. Approving
        publishes the listing immediately; rejecting sends the seller a reason.
      </p>

      <div className="mt-8 space-y-3">
        {pending.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-ink-400">
              Nothing pending review.
            </CardContent>
          </Card>
        ) : (
          pending.map((listing) => <ModerationRow key={listing.id} listing={listing} />)
        )}
      </div>
    </Container>
  );
}
