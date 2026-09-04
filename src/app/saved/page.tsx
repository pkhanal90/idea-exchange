import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/listings/listing-card";
import { ArrowLeft, Bookmark } from "lucide-react";

export default async function SavedListingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/saved");

  const savedListings = await prisma.savedListing.findMany({
    where: { userId: session.user.id },
    include: { listing: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Container className="max-w-5xl py-10">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>

      <div className="mb-6 flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-ink-400" />
        <h1 className="text-2xl font-semibold text-ink-900">Saved listings</h1>
      </div>

      {savedListings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Bookmark className="h-8 w-8 text-ink-300" />
            <p className="mt-3 text-sm font-medium text-ink-700">Nothing saved yet</p>
            <p className="mt-1 max-w-sm text-sm text-ink-400">
              Click the heart on any listing while browsing to save it here for later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {savedListings.map(({ listing }) => (
            <ListingCard key={listing.id} listing={listing} isSaved />
          ))}
        </div>
      )}
    </Container>
  );
}
