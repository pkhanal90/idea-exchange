// Cross-reference audit over the @ideaexchange.test seed dataset: for every
// Offer/Deal/MessageThread/NdaAcceptance/Rating, do the buyer/seller ids it
// carries actually agree with each other and with the Listing they're
// attached to?
//
// This matters specifically because of 95199f3 ("let Seller/Buyer accounts
// both buy and sell") — once a single account can be both roles, a listing
// and an offer can silently end up with the same user as buyer and seller,
// which the app's own action layer blocks (see the sellerId === session
// user.id guards in offers/actions.ts, listings/[id]/actions.ts and
// messages/actions.ts) but prisma/seed.ts writes directly to the DB and
// skips all of that.
//
// This is the summary pass (counts only) — see audit-crosslink-detail.mjs
// for the same checks with full record detail.
//
// Run: node --env-file=.env.production.local audit-seed-crosslinks.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SEED_DOMAIN = "@ideaexchange.test";

async function main() {
  const seedUserIds = new Set(
    (
      await prisma.user.findMany({
        where: { email: { endsWith: SEED_DOMAIN } },
        select: { id: true },
      })
    ).map((u) => u.id),
  );

  const listings = await prisma.listing.findMany({
    where: { sellerId: { in: [...seedUserIds] } },
    select: { id: true, sellerId: true },
  });
  const sellerByListing = new Map(listings.map((l) => [l.id, l.sellerId]));
  const listingIds = listings.map((l) => l.id);

  let violations = 0;
  const report = (label, count) => {
    violations += count;
    console.log(`  ${count === 0 ? "✓" : "✗"} ${label}: ${count}`);
  };

  // Offers where the buyer is the listing's own seller.
  const offers = await prisma.offer.findMany({
    where: { listingId: { in: listingIds } },
    select: { id: true, listingId: true, buyerId: true },
  });
  report(
    "Offers where buyerId === listing's sellerId (self-offer)",
    offers.filter((o) => o.buyerId === sellerByListing.get(o.listingId)).length,
  );

  // Deals whose seller/buyer don't match their own Offer or Listing.
  const deals = await prisma.deal.findMany({
    where: { listingId: { in: listingIds } },
    select: {
      id: true,
      listingId: true,
      sellerId: true,
      buyerId: true,
      offer: { select: { listingId: true, buyerId: true } },
    },
  });
  report(
    "Deals where sellerId !== listing's sellerId",
    deals.filter((d) => d.sellerId !== sellerByListing.get(d.listingId)).length,
  );
  report(
    "Deals where buyerId !== their own Offer.buyerId",
    deals.filter((d) => d.buyerId !== d.offer.buyerId).length,
  );
  report(
    "Deals where listingId !== their own Offer.listingId",
    deals.filter((d) => d.listingId !== d.offer.listingId).length,
  );

  // MessageThreads: self-threads, and sellerId not matching the listing.
  const threads = await prisma.messageThread.findMany({
    where: { listingId: { in: listingIds } },
    select: { id: true, listingId: true, sellerId: true, buyerId: true },
  });
  report(
    "Threads where sellerId !== listing's sellerId",
    threads.filter((t) => t.sellerId !== sellerByListing.get(t.listingId)).length,
  );
  report(
    "Threads where buyerId === sellerId (self-thread)",
    threads.filter((t) => t.buyerId === t.sellerId).length,
  );

  // NdaAcceptance: the listing's own seller "accepting" their own NDA.
  const ndas = await prisma.ndaAcceptance.findMany({
    where: { listingId: { in: listingIds } },
    select: { id: true, listingId: true, userId: true },
  });
  report(
    "NDA acceptances where userId === listing's sellerId",
    ndas.filter((n) => n.userId === sellerByListing.get(n.listingId)).length,
  );

  // Ratings: rater/ratee must be the deal's own buyer/seller, not each other.
  const ratings = await prisma.rating.findMany({
    where: { deal: { listingId: { in: listingIds } } },
    select: {
      id: true,
      raterId: true,
      rateeId: true,
      deal: { select: { sellerId: true, buyerId: true } },
    },
  });
  report(
    "Ratings where raterId === rateeId",
    ratings.filter((r) => r.raterId === r.rateeId).length,
  );
  report(
    "Ratings where rater/ratee aren't the deal's own buyer+seller pair",
    ratings.filter((r) => {
      const pair = new Set([r.deal.sellerId, r.deal.buyerId]);
      return !pair.has(r.raterId) || !pair.has(r.rateeId);
    }).length,
  );

  console.log(`\n${violations === 0 ? "No crosslink violations found." : `${violations} violation(s) found — see audit-crosslink-detail.mjs for specifics.`}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
