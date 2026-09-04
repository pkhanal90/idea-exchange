import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListingCard } from "@/components/listings/listing-card";
import { CategoryBadge } from "@/components/listings/badges";
import { CategoryNav } from "@/components/listings/category-nav";
import { CATEGORY_VISUALS } from "@/lib/category-visuals";
import { HeroShowcase } from "@/components/marketing/hero-showcase";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getSavedListingIdSet } from "@/lib/saved-listings";
import { cn, formatCurrency, initials } from "@/lib/utils";
import {
  ArrowRight,
  BadgeCheck,
  FileCheck2,
  Handshake,
  Lock,
  Quote,
  Search,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

const INVESTOR_GRADIENTS = [
  "from-indigo-500 to-indigo-700",
  "from-emerald-500 to-emerald-700",
  "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-700",
  "from-blue-500 to-blue-700",
  "from-fuchsia-500 to-fuchsia-700",
];

async function getFeaturedListings() {
  try {
    return await prisma.listing.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 6,
    });
  } catch {
    // Database not migrated/seeded yet — degrade gracefully on first run.
    return [];
  }
}

async function getFeaturedInvestors() {
  try {
    return await prisma.user.findMany({
      where: { role: "INVESTOR" },
      orderBy: { createdAt: "asc" },
      take: 4,
      select: {
        id: true,
        name: true,
        company: true,
        title: true,
        bio: true,
        accreditationStatus: true,
      },
    });
  } catch {
    return [];
  }
}

async function getRecentDeal() {
  try {
    return await prisma.deal.findFirst({
      where: { stage: "COMPLETE" },
      orderBy: { completedAt: "desc" },
      include: {
        listing: { select: { title: true, category: true } },
        seller: { select: { name: true, company: true } },
        buyer: { select: { name: true, company: true } },
        ratings: { orderBy: { createdAt: "asc" } },
      },
    });
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [featured, investors, recentDeal, session] = await Promise.all([
    getFeaturedListings(),
    getFeaturedInvestors(),
    getRecentDeal(),
    auth(),
  ]);
  const savedIds = await getSavedListingIdSet(
    session?.user?.id,
    featured.map((l) => l.id),
  );

  return (
    <>
      {/* Hero */}
      <section className="bg-grid relative overflow-hidden border-b border-border bg-ink-950">
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-950/95 to-ink-900" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-success-500/10 blur-3xl" />
        <Container className="relative py-20 sm:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
            <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-ink-200">
                <ShieldCheck className="h-3.5 w-3.5 text-success-500" />
                NDA-gated diligence · Escrow-backed deals
              </span>
              <h1 className="font-heading mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Where unused startup ideas find capital
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-ink-300">
                Idea Exchange is the marketplace for early-stage IP — founders sell full
                ownership or equity/royalty stakes in ideas they won&apos;t build, and buyers of
                every kind — from first-time builders to VC firms and angel investors — vet,
                negotiate, and acquire them under a structured deal process.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <ButtonLink
                  href="/listings"
                  size="lg"
                  className="border-0 bg-gradient-to-r from-accent-500 to-accent-700 text-white shadow-lg shadow-accent-900/40 transition-transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent-900/50"
                >
                  Browse Ideas
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink
                  href="/listings/create"
                  size="lg"
                  className="border border-white/15 bg-white/5 text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
                >
                  List Your Idea
                </ButtonLink>
              </div>
            </div>

            <HeroShowcase />
          </div>

          <div className="mx-auto mt-16 max-w-3xl border-t border-white/10 pt-10">
            <p className="mb-4 text-center text-xs font-medium uppercase tracking-wide text-ink-400">
              Browse by category
            </p>
            <CategoryNav />
          </div>
        </Container>
      </section>

      {/* Two-sided value prop */}
      <section className="border-b border-border bg-white py-20">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-accent-500 to-accent-700">
                <TrendingUp className="h-12 w-12 text-white/90" strokeWidth={1.5} />
              </div>
              <div className="p-8">
                <h2 className="font-heading text-xl font-semibold text-ink-900">For Sellers</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  Turn a shelved idea into capital. List a structured brief, keep the full
                  thesis under NDA, and negotiate a fixed-price sale, an auction, or an
                  equity/royalty deal — without giving away the details for free.
                </p>
                <Link
                  href="/listings/create"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent-700 hover:text-accent-800"
                >
                  List an idea <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-success-500 to-success-700">
                <Search className="h-12 w-12 text-white/90" strokeWidth={1.5} />
              </div>
              <div className="p-8">
                <h2 className="font-heading text-xl font-semibold text-ink-900">For Buyers</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  No accreditation required to browse or buy — anyone can source proprietary
                  ideas before they become companies. Filter by category, stage, and price,
                  accept an NDA to see full diligence materials, and move from offer to signed
                  IP assignment in one flow.
                </p>
                <Link
                  href="/listings"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent-700 hover:text-accent-800"
                >
                  Browse listings <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* Investors on the platform */}
      {investors.length > 0 && (
        <section className="border-b border-border bg-ink-50 py-20">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-2xl font-semibold text-ink-900 sm:text-3xl">
                Your idea could catch a VC&apos;s eye
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">
                Buyers here range from individual builders to VC firms and angel investors
                like the ones below — anyone can make an offer, but list once and your idea is
                visible to all of them.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {investors.map((investor, i) => {
                const gradient = INVESTOR_GRADIENTS[i % INVESTOR_GRADIENTS.length];
                return (
                  <div
                    key={investor.id}
                    className="overflow-hidden rounded-xl border border-border bg-white"
                  >
                    <div className={cn("h-1.5 bg-gradient-to-r", gradient)} />
                    <div className="p-5">
                      <span
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white",
                          gradient,
                        )}
                      >
                        {initials(investor.name)}
                      </span>
                      <p className="mt-3 text-sm font-semibold text-ink-900">{investor.name}</p>
                      <p className="text-xs text-ink-400">
                        {investor.title ? `${investor.title} · ` : ""}
                        {investor.company}
                      </p>
                      {investor.bio && (
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-500">
                          {investor.bio}
                        </p>
                      )}
                      {investor.accreditationStatus === "SELF_ATTESTED" && (
                        <Badge tone="success" className="mt-3">
                          <BadgeCheck className="h-3 w-3" />
                          Accredited
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      {/* How it works */}
      <section id="how-it-works" className="border-b border-border bg-ink-50 py-20">
        <Container>
          <h2 className="font-heading text-center text-2xl font-semibold text-ink-900 sm:text-3xl">
            A structured path from idea to deal
          </h2>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileCheck2,
                title: "1. List & review",
                body: "Sellers submit a structured brief. Listings clear a moderation queue before going public.",
                gradient: "from-indigo-500 to-indigo-700",
              },
              {
                icon: Lock,
                title: "2. NDA-gated diligence",
                body: "Buyers see a public teaser, then click-through an NDA to unlock the full listing.",
                gradient: "from-violet-500 to-violet-700",
              },
              {
                icon: Handshake,
                title: "3. Offer & negotiate",
                body: "Buy It Now, bid in an auction, or propose an equity/royalty deal — negotiate in-app.",
                gradient: "from-emerald-500 to-emerald-700",
              },
              {
                icon: ShieldCheck,
                title: "4. Escrow & transfer",
                body: "Funds are held in simulated escrow, an IP assignment doc is generated, and ownership transfers.",
                gradient: "from-blue-500 to-blue-700",
              },
            ].map(({ icon: Icon, title, body, gradient }) => (
              <div key={title}>
                <span
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                    gradient,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* A real completed deal, so the mechanism isn't just theoretical */}
      {recentDeal && (
        <section className="border-b border-border bg-white py-20">
          <Container className="max-w-4xl">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-accent-700">
              See it in action
            </p>
            <h2 className="font-heading mt-2 text-center text-2xl font-semibold text-ink-900 sm:text-3xl">
              A completed deal, start to finish
            </h2>
            <Card className="mt-10 overflow-hidden">
              {(() => {
                const { icon: DealIcon, gradient } = CATEGORY_VISUALS[recentDeal.listing.category];
                return (
                  <div
                    className={cn(
                      "relative flex h-28 items-center justify-center bg-gradient-to-br",
                      gradient,
                    )}
                  >
                    <DealIcon className="h-9 w-9 text-white/90" strokeWidth={1.5} />
                    <span className="absolute left-5 top-5">
                      <CategoryBadge category={recentDeal.listing.category} />
                    </span>
                  </div>
                );
              })()}
              <div className="grid gap-0 sm:grid-cols-2">
                <div className="p-8">
                  <h3 className="font-heading text-lg font-semibold text-ink-900">
                    {recentDeal.listing.title}
                  </h3>
                  <p className="mt-3 text-sm text-ink-500">
                    Sold by{" "}
                    <span className="font-medium text-ink-800">
                      {recentDeal.seller.company ?? recentDeal.seller.name}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium text-ink-800">
                      {recentDeal.buyer.company ?? recentDeal.buyer.name}
                    </span>
                  </p>
                  <p className="font-mono-nums mt-4 text-3xl font-semibold text-ink-900">
                    {formatCurrency(recentDeal.finalAmount as never)}
                  </p>
                  <p className="mt-1 text-xs text-ink-400">
                    Full ownership transferred · IP assignment signed · escrow released
                  </p>
                </div>
                <div className="flex flex-col justify-center gap-5 bg-ink-50 p-8">
                  {recentDeal.ratings.map((rating) => (
                    <div key={rating.id}>
                      <Quote className="h-4 w-4 text-ink-300" />
                      <p className="mt-1.5 text-sm italic leading-relaxed text-ink-700">
                        &ldquo;{rating.comment}&rdquo;
                      </p>
                      <p className="mt-1.5 text-xs font-medium text-ink-400">
                        {rating.raterId === recentDeal.sellerId
                          ? recentDeal.seller.name
                          : recentDeal.buyer.name}{" "}
                        · {rating.score}/5
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Container>
        </section>
      )}

      {/* Featured listings */}
      {featured.length > 0 && (
        <section className="border-b border-border bg-white py-20">
          <Container>
            <div className="flex items-end justify-between">
              <h2 className="font-heading text-2xl font-semibold text-ink-900">Recently listed</h2>
              <Link
                href="/listings"
                className="flex items-center gap-1 text-sm font-medium text-accent-700 hover:text-accent-800"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((listing) => (
                <ListingCard key={listing.id} listing={listing} isSaved={savedIds.has(listing.id)} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Trust */}
      <section id="trust" className="bg-white py-20">
        <Container className="grid gap-8 sm:grid-cols-3">
          {[
            {
              title: "Self-attested accreditation",
              body: "Buyers who qualify as accredited investors can flag that status — a signal for sellers, not a requirement to make an offer.",
            },
            {
              title: "Escrow-style holds",
              body: "Deal funds move through Stripe Connect in test mode, structured as a hold-and-release rather than instant capture.",
            },
            {
              title: "Two-sided ratings",
              body: "Sellers and buyers rate each other after every completed deal, building a track record over time.",
            },
          ].map(({ title, body }) => (
            <div key={title} className="rounded-xl border border-border p-6">
              <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{body}</p>
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}
