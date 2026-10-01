// Broad integrity pass over the @ideaexchange.test seed dataset: required
// fields, enum/type combinations that the create forms enforce but a direct
// Prisma seed write can skip, and basic shape checks on every related
// record type. This is the "is the seed data well-formed" check — see
// audit-seed-crosslinks.mjs for "do seed records correctly reference each
// other".
//
// Run: node --env-file=.env.production.local audit-seed-data.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SEED_DOMAIN = "@ideaexchange.test";

let problems = 0;
function flag(msg) {
  problems += 1;
  console.log(`  ✗ ${msg}`);
}

async function main() {
  const seedUsers = await prisma.user.findMany({
    where: { email: { endsWith: SEED_DOMAIN } },
    select: { id: true, email: true, role: true },
  });
  const seedUserIds = new Set(seedUsers.map((u) => u.id));
  console.log(`=== Seed users: ${seedUsers.length} ===`);
  for (const role of ["SELLER", "BUYER", "INVESTOR", "ADMIN"]) {
    console.log(`  ${role}: ${seedUsers.filter((u) => u.role === role).length}`);
  }

  const listings = await prisma.listing.findMany({
    where: { sellerId: { in: [...seedUserIds] } },
    select: {
      id: true,
      title: true,
      status: true,
      listingType: true,
      askingPrice: true,
      reservePrice: true,
      startingBid: true,
      auctionEndsAt: true,
      teaserSummary: true,
      problemStatement: true,
      proposedSolution: true,
      targetMarket: true,
      monetizationPlan: true,
      sellerConsentAcceptedAt: true,
    },
  });
  console.log(`\n=== Seed listings: ${listings.length} ===`);

  for (const l of listings) {
    const tag = `${l.id} "${l.title}"`;

    for (const [field, value] of [
      ["teaserSummary", l.teaserSummary],
      ["problemStatement", l.problemStatement],
      ["proposedSolution", l.proposedSolution],
      ["targetMarket", l.targetMarket],
      ["monetizationPlan", l.monetizationPlan],
    ]) {
      if (!value || !value.trim()) flag(`${tag} — blank ${field}`);
    }

    if (l.listingType === "FIXED_PRICE" && l.askingPrice == null) {
      flag(`${tag} — FIXED_PRICE with no askingPrice`);
    }
    if (l.listingType === "AUCTION") {
      if (l.reservePrice == null) flag(`${tag} — AUCTION with no reservePrice`);
      if (l.startingBid == null) flag(`${tag} — AUCTION with no startingBid`);
      if (!l.auctionEndsAt) flag(`${tag} — AUCTION with no auctionEndsAt`);
    }

    // createListingAction requires this before a listing can leave DRAFT —
    // see src/app/listings/create/actions.ts.
    if (l.status !== "DRAFT" && !l.sellerConsentAcceptedAt) {
      flag(`${tag} — status ${l.status} but sellerConsentAcceptedAt is unset`);
    }
  }

  const relatedCounts = await Promise.all([
    prisma.offer.count({ where: { listingId: { in: listings.map((l) => l.id) } } }),
    prisma.bid.count({ where: { listingId: { in: listings.map((l) => l.id) } } }),
    prisma.deal.count({ where: { listingId: { in: listings.map((l) => l.id) } } }),
    prisma.messageThread.count({ where: { listingId: { in: listings.map((l) => l.id) } } }),
    prisma.ndaAcceptance.count({ where: { listingId: { in: listings.map((l) => l.id) } } }),
  ]);
  const [offers, bids, deals, threads, ndas] = relatedCounts;
  console.log(`\n=== Related records on seed listings ===`);
  console.log(`  Offers: ${offers}  Bids: ${bids}  Deals: ${deals}  Threads: ${threads}  NDAs: ${ndas}`);

  // Deals should only exist for ACCEPTED offers.
  const dealsWithBadOffer = await prisma.deal.findMany({
    where: { listingId: { in: listings.map((l) => l.id) } },
    select: { id: true, offer: { select: { status: true } } },
  });
  const badStatusDeals = dealsWithBadOffer.filter((d) => d.offer.status !== "ACCEPTED");
  console.log(`\n=== Deals whose underlying Offer isn't ACCEPTED (${badStatusDeals.length}) ===`);
  for (const d of badStatusDeals) flag(`Deal ${d.id} — offer status is ${d.offer.status}`);

  console.log(`\n${problems === 0 ? "No problems found." : `${problems} problem(s) found.`}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
