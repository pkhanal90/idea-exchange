import { Container } from "@/components/ui/container";
import { SearchFilters } from "@/components/listings/search-filters";
import { ListingCard } from "@/components/listings/listing-card";
import { PRICE_RANGES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getSavedListingIdSet } from "@/lib/saved-listings";
import type { IndustryCategory, ListingStage, Prisma } from "@prisma/client";
import { Inbox } from "lucide-react";

interface ListingsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    stage?: string;
    price?: string;
  }>;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const { q, category, stage, price } = await searchParams;

  const range = PRICE_RANGES.find((r) => r.label === price);

  const where: Prisma.ListingWhereInput = {
    status: "PUBLISHED",
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { problemStatement: { contains: q, mode: "insensitive" } },
        { teaserSummary: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(category && { category: category as IndustryCategory }),
    ...(stage && { stage: stage as ListingStage }),
    ...(range?.min !== undefined || range?.max !== undefined
      ? {
          askingPrice: {
            ...(range?.min !== undefined && { gte: range.min }),
            ...(range?.max !== undefined && { lte: range.max }),
          },
        }
      : {}),
  };

  let listings: Awaited<ReturnType<typeof prisma.listing.findMany>> = [];
  let dbError = false;
  let savedIds = new Set<string>();
  try {
    const session = await auth();
    listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 60,
    });
    savedIds = await getSavedListingIdSet(
      session?.user?.id,
      listings.map((l) => l.id),
    );
  } catch {
    dbError = true;
  }

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900 sm:text-3xl">Browse Ideas</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Public teasers only — accept a listing&apos;s NDA to unlock full diligence
          materials.
        </p>
      </div>

      <SearchFilters q={q} category={category} stage={stage} price={price} />

      <div className="mt-8">
        {dbError ? (
          <EmptyState
            title="Database not connected"
            body="Run `npm run db:push` (or `db:migrate`) and `npm run db:seed` to populate sample listings."
          />
        ) : listings.length === 0 ? (
          <EmptyState
            title="No listings match your filters"
            body="Try widening your search, or check back soon — new ideas are reviewed and published regularly."
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-ink-400">{listings.length} listing(s)</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} isSaved={savedIds.has(listing.id)} />
              ))}
            </div>
          </>
        )}
      </div>
    </Container>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-20 text-center">
      <Inbox className="h-8 w-8 text-ink-300" />
      <h3 className="mt-3 text-sm font-semibold text-ink-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-400">{body}</p>
    </div>
  );
}
