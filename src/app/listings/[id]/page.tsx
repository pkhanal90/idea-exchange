import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListingStatusBadge } from "@/components/listings/badges";
import { NdaGate } from "@/components/listings/nda-gate";
import { AuctionPanel } from "@/components/listings/auction-panel";
import { ButtonLink, Button } from "@/components/ui/button";
import { CATEGORY_LABELS, LISTING_TYPE_LABELS, STAGE_LABELS } from "@/lib/constants";
import { CATEGORY_VISUALS } from "@/lib/category-visuals";
import { cn, formatCurrency, formatDate, initials, isPast } from "@/lib/utils";
import { contactSellerAction } from "@/app/messages/actions";
import {
  AlertTriangle,
  DollarSign,
  FileText,
  Lightbulb,
  MessageSquare,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, company: true, image: true } },
      deals: {
        where: { stage: { not: "CANCELLED" } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!listing) notFound();

  const isOwner = session?.user?.id === listing.sellerId;
  const isAdmin = session?.user?.role === "ADMIN";
  const isPublic = listing.status === "PUBLISHED" || listing.status === "SOLD" || listing.status === "UNDER_OFFER";

  if (!isPublic && !isOwner && !isAdmin) notFound();

  const hasNda =
    Boolean(session?.user) &&
    (isOwner ||
      isAdmin ||
      Boolean(
        await prisma.ndaAcceptance.findUnique({
          where: { listingId_userId: { listingId: id, userId: session!.user.id } },
        }),
      ));

  const activeDeal = listing.deals[0];
  const isDealParty = Boolean(
    session?.user &&
      activeDeal &&
      (session.user.id === activeDeal.buyerId || session.user.id === activeDeal.sellerId),
  );

  const myLatestOffer =
    session?.user && !isOwner && listing.listingType !== "AUCTION"
      ? await prisma.offer.findFirst({
          where: { listingId: id, buyerId: session.user.id },
          orderBy: { createdAt: "desc" },
        })
      : null;
  const myOfferIsActive = myLatestOffer && ["PENDING", "COUNTERED"].includes(myLatestOffer.status);

  let bidStats: { highest: unknown; count: number } | null = null;
  if (listing.listingType === "AUCTION") {
    const [top, count] = await Promise.all([
      prisma.bid.findFirst({ where: { listingId: id }, orderBy: { amount: "desc" } }),
      prisma.bid.count({ where: { listingId: id } }),
    ]);
    bidStats = { highest: top?.amount ?? null, count };
  }

  const priceLabel =
    listing.listingType === "FIXED_PRICE"
      ? formatCurrency(listing.askingPrice as never)
      : listing.listingType === "AUCTION"
        ? `Starting bid ${formatCurrency(listing.startingBid as never)}`
        : "Open to equity / royalty offers";

  const { icon: CategoryIcon, gradient } = CATEGORY_VISUALS[listing.category];

  return (
    <>
      {(isOwner || isAdmin) && listing.status !== "PUBLISHED" && (
        <Container className="max-w-4xl pt-6">
          <div className="flex items-center gap-2 rounded-lg border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm text-warning-700">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Only visible to you — this listing is <ListingStatusBadge status={listing.status} />
            {listing.status === "REJECTED" && listing.rejectionNote && (
              <span>: {listing.rejectionNote}</span>
            )}
          </div>
        </Container>
      )}

      <section className={cn("relative overflow-hidden bg-gradient-to-br", gradient)}>
        <CategoryIcon
          className="pointer-events-none absolute -right-8 -top-10 h-64 w-64 text-white/10"
          strokeWidth={1}
        />
        <Container className="relative max-w-4xl py-10 sm:py-12">
          <div className="flex flex-wrap items-center gap-1.5">
            <HeroPill>{CATEGORY_LABELS[listing.category]}</HeroPill>
            <HeroPill>{STAGE_LABELS[listing.stage]}</HeroPill>
            <HeroPill>{LISTING_TYPE_LABELS[listing.listingType]}</HeroPill>
            {listing.openToEquity && listing.listingType !== "EQUITY_ROYALTY" && (
              <HeroPill accent>Open to equity</HeroPill>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            {listing.title}
          </h1>

          <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold text-white">
              {initials(listing.seller.name)}
            </span>
            Listed by {listing.seller.company ?? listing.seller.name ?? "a verified seller"} ·{" "}
            {formatDate(listing.createdAt)}
          </div>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/90">
            {listing.teaserSummary}
          </p>
        </Container>
      </section>

      <Container className="max-w-4xl py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            {hasNda ? (
              <>
                <DetailSection icon={AlertTriangle} title="Problem statement" body={listing.problemStatement} />
                <DetailSection icon={Lightbulb} title="Proposed solution" body={listing.proposedSolution} />
                <DetailSection icon={Users} title="Target market" body={listing.targetMarket} />
                <DetailSection icon={DollarSign} title="Monetization plan" body={listing.monetizationPlan} />
                {listing.pitchDeckUrl && (
                  <a
                    href={listing.pitchDeckUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink-700 hover:bg-ink-50"
                  >
                    <FileText className="h-4 w-4" />
                    View pitch deck (PDF)
                  </a>
                )}
              </>
            ) : (
              <NdaGate listingId={listing.id} />
            )}
          </div>

          <div className="h-fit space-y-4">
            <Card>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-ink-400">Price</p>
                  <p className="font-mono-nums text-xl font-semibold text-ink-900">{priceLabel}</p>
                </div>
                {listing.tamEstimate && (
                  <div>
                    <p className="text-xs font-medium text-ink-400">Estimated TAM</p>
                    <p className="font-mono-nums text-sm font-medium text-ink-700">
                      {formatCurrency(listing.tamEstimate as never)}
                    </p>
                  </div>
                )}

                {listing.listingType === "AUCTION" && bidStats && listing.status === "PUBLISHED" && (
                  <AuctionPanel
                    listingId={listing.id}
                    startingBid={listing.startingBid}
                    reservePrice={listing.reservePrice}
                    highestBid={bidStats.highest}
                    bidCount={bidStats.count}
                    auctionEndsAt={listing.auctionEndsAt?.toISOString() ?? null}
                    hasEnded={isPast(listing.auctionEndsAt)}
                    isOwner={isOwner}
                    canBid={Boolean(session?.user) && !isOwner}
                  />
                )}

                {listing.status === "SOLD" ? (
                  <Badge tone="ink" className="w-full justify-center py-1.5">
                    Sold
                  </Badge>
                ) : isDealParty ? (
                  <ButtonLink href={`/deals/${activeDeal!.id}`} className="w-full">
                    Go to deal room
                  </ButtonLink>
                ) : isOwner ? (
                  <ButtonLink href="/dashboard/seller" variant="outline" className="w-full">
                    Manage this listing
                  </ButtonLink>
                ) : listing.status === "UNDER_OFFER" ? (
                  <Badge tone="warning" className="w-full justify-center py-1.5">
                    Under offer
                  </Badge>
                ) : (
                  <div className="space-y-2">
                    {listing.listingType !== "AUCTION" &&
                      (myOfferIsActive ? (
                        <ButtonLink href={`/offers/${myLatestOffer!.id}`} variant="outline" className="w-full">
                          View your offer
                        </ButtonLink>
                      ) : session?.user ? (
                        <ButtonLink href={`/listings/${listing.id}/offer`} className="w-full">
                          Make an offer
                        </ButtonLink>
                      ) : (
                        <ButtonLink href={`/auth/signin?callbackUrl=/listings/${listing.id}/offer`} className="w-full">
                          Sign in to make an offer
                        </ButtonLink>
                      ))}

                    {session?.user ? (
                      <form action={contactSellerAction.bind(null, listing.id)}>
                        <Button type="submit" variant="outline" className="w-full">
                          <MessageSquare className="h-4 w-4" />
                          Contact seller
                        </Button>
                      </form>
                    ) : (
                      <ButtonLink
                        href={`/auth/signin?callbackUrl=/listings/${listing.id}`}
                        variant="outline"
                        className="w-full"
                      >
                        Sign in to contact seller
                      </ButtonLink>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}

function HeroPill({ children, accent = false }: { children: string; accent?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm",
        accent ? "bg-white text-ink-900" : "border border-white/25 bg-white/10 text-white",
      )}
    >
      {children}
    </span>
  );
}

function DetailSection({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-600">{body}</p>
      </div>
    </div>
  );
}
