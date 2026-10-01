// Scoped cleanup of @ideaexchange.test demo content — a safer alternative to
// re-running prisma/seed.ts just to reset the deal-flow data.
//
// prisma/seed.ts's own wipe step (lines 13-20) calls things like
// `prisma.listing.deleteMany()` with NO where filter — it deletes every
// listing/offer/deal/message/thread in the database, seed or real. That's
// fine against a disposable local DB, but running `prisma db seed` (or this
// file's logic, without the scoping below) against production would destroy
// every real user's data. This script only ever touches rows that trace
// back to an @ideaexchange.test account.
//
// Defaults to a dry run (counts only, deletes nothing). Pass --force to
// actually delete.
//
// Run: node --env-file=.env.production.local cleanup-seed-data.mjs [--force]
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SEED_DOMAIN = "@ideaexchange.test";
const FORCE = process.argv.includes("--force");

async function main() {
  const seedUserIds = (
    await prisma.user.findMany({
      where: { email: { endsWith: SEED_DOMAIN } },
      select: { id: true },
    })
  ).map((u) => u.id);

  const listingIds = (
    await prisma.listing.findMany({
      where: { sellerId: { in: seedUserIds } },
      select: { id: true },
    })
  ).map((l) => l.id);

  // Children before parents, same order as prisma/seed.ts's wipe — but
  // scoped to rows under a seed listing (or involving a seed user directly)
  // instead of the whole table.
  const plan = [
    ["Rating", () => prisma.rating.deleteMany({ where: { deal: { listingId: { in: listingIds } } } })],
    ["Deal", () => prisma.deal.deleteMany({ where: { listingId: { in: listingIds } } })],
    ["Offer", () => prisma.offer.deleteMany({ where: { listingId: { in: listingIds } } })],
    ["Bid", () => prisma.bid.deleteMany({ where: { listingId: { in: listingIds } } })],
    ["Message", () => prisma.message.deleteMany({ where: { thread: { listingId: { in: listingIds } } } })],
    ["MessageThread", () => prisma.messageThread.deleteMany({ where: { listingId: { in: listingIds } } })],
    ["SavedListing", () => prisma.savedListing.deleteMany({ where: { listingId: { in: listingIds } } })],
    ["NdaAcceptance", () => prisma.ndaAcceptance.deleteMany({ where: { listingId: { in: listingIds } } })],
    ["ListingView", () => prisma.listingView.deleteMany({ where: { listingId: { in: listingIds } } })],
    ["Listing", () => prisma.listing.deleteMany({ where: { id: { in: listingIds } } })],
  ];

  console.log(`Scope: ${seedUserIds.length} @ideaexchange.test users, ${listingIds.length} of their listings.`);
  console.log(FORCE ? "Mode: DELETE (--force passed)\n" : "Mode: DRY RUN — pass --force to actually delete\n");

  if (FORCE) {
    for (const [label, run] of plan) {
      const result = await run();
      console.log(`  ${label}: deleted ${result.count}`);
    }
  } else {
    const [ratings, deals, offers, bids, messages, threads, saved, ndas, views] = await Promise.all([
      prisma.rating.count({ where: { deal: { listingId: { in: listingIds } } } }),
      prisma.deal.count({ where: { listingId: { in: listingIds } } }),
      prisma.offer.count({ where: { listingId: { in: listingIds } } }),
      prisma.bid.count({ where: { listingId: { in: listingIds } } }),
      prisma.message.count({ where: { thread: { listingId: { in: listingIds } } } }),
      prisma.messageThread.count({ where: { listingId: { in: listingIds } } }),
      prisma.savedListing.count({ where: { listingId: { in: listingIds } } }),
      prisma.ndaAcceptance.count({ where: { listingId: { in: listingIds } } }),
      prisma.listingView.count({ where: { listingId: { in: listingIds } } }),
    ]);
    console.log(`  Rating: would delete ${ratings}`);
    console.log(`  Deal: would delete ${deals}`);
    console.log(`  Offer: would delete ${offers}`);
    console.log(`  Bid: would delete ${bids}`);
    console.log(`  Message: would delete ${messages}`);
    console.log(`  MessageThread: would delete ${threads}`);
    console.log(`  SavedListing: would delete ${saved}`);
    console.log(`  NdaAcceptance: would delete ${ndas}`);
    console.log(`  ListingView: would delete ${views}`);
    console.log(`  Listing: would delete ${listingIds.length}`);
  }

  console.log(
    "\nNote: seed USER accounts (@ideaexchange.test) are left alone either way — only their listings and deal-flow content are in scope.",
  );
  console.log(FORCE ? "\nDone." : "\nDry run complete — nothing was deleted.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
