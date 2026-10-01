// Same checks as audit-seed-crosslinks.mjs, but prints every violation in
// full — record id, listing title, and the emails on each side — instead of
// just a count. Run the summary first; run this when it reports something
// nonzero and you need to go find and fix the actual rows.
//
// Run: node --env-file=.env.production.local audit-crosslink-detail.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SEED_DOMAIN = "@ideaexchange.test";

async function main() {
  const seedUsers = await prisma.user.findMany({
    where: { email: { endsWith: SEED_DOMAIN } },
    select: { id: true, email: true },
  });
  const seedUserIds = new Set(seedUsers.map((u) => u.id));
  const emailById = new Map(seedUsers.map((u) => [u.id, u.email]));
  const who = (id) => emailById.get(id) ?? id;

  const listings = await prisma.listing.findMany({
    where: { sellerId: { in: [...seedUserIds] } },
    select: { id: true, title: true, sellerId: true },
  });
  const listingById = new Map(listings.map((l) => [l.id, l]));
  const listingIds = listings.map((l) => l.id);

  let total = 0;
  function section(title) {
    console.log(`\n=== ${title} ===`);
  }
  function hit(line) {
    total += 1;
    console.log(`  ✗ ${line}`);
  }

  section("Self-offers (buyerId === listing's sellerId)");
  const offers = await prisma.offer.findMany({
    where: { listingId: { in: listingIds } },
    select: { id: true, listingId: true, buyerId: true, status: true },
  });
  for (const o of offers) {
    const l = listingById.get(o.listingId);
    if (o.buyerId === l.sellerId) {
      hit(`Offer ${o.id} [${o.status}] on "${l.title}" — buyer ${who(o.buyerId)} is the seller`);
    }
  }

  section("Deal buyer/seller/offer mismatches");
  const deals = await prisma.deal.findMany({
    where: { listingId: { in: listingIds } },
    select: {
      id: true,
      listingId: true,
      sellerId: true,
      buyerId: true,
      offer: { select: { id: true, listingId: true, buyerId: true } },
    },
  });
  for (const d of deals) {
    const l = listingById.get(d.listingId);
    if (d.sellerId !== l.sellerId) {
      hit(`Deal ${d.id} on "${l.title}" — deal.sellerId ${who(d.sellerId)} !== listing seller ${who(l.sellerId)}`);
    }
    if (d.buyerId !== d.offer.buyerId) {
      hit(`Deal ${d.id} on "${l.title}" — deal.buyerId ${who(d.buyerId)} !== its Offer ${d.offer.id}'s buyerId ${who(d.offer.buyerId)}`);
    }
    if (d.listingId !== d.offer.listingId) {
      hit(`Deal ${d.id} — listingId ${d.listingId} !== its Offer ${d.offer.id}'s listingId ${d.offer.listingId}`);
    }
  }

  section("Message thread problems");
  const threads = await prisma.messageThread.findMany({
    where: { listingId: { in: listingIds } },
    select: { id: true, listingId: true, sellerId: true, buyerId: true },
  });
  for (const t of threads) {
    const l = listingById.get(t.listingId);
    if (t.sellerId !== l.sellerId) {
      hit(`Thread ${t.id} on "${l.title}" — thread.sellerId ${who(t.sellerId)} !== listing seller ${who(l.sellerId)}`);
    }
    if (t.buyerId === t.sellerId) {
      hit(`Thread ${t.id} on "${l.title}" — buyer and seller are the same account (${who(t.buyerId)})`);
    }
  }

  section("NDA acceptances by the listing's own seller");
  const ndas = await prisma.ndaAcceptance.findMany({
    where: { listingId: { in: listingIds } },
    select: { id: true, listingId: true, userId: true },
  });
  for (const n of ndas) {
    const l = listingById.get(n.listingId);
    if (n.userId === l.sellerId) {
      hit(`NDA ${n.id} on "${l.title}" — accepted by the seller themselves (${who(n.userId)})`);
    }
  }

  section("Rating problems");
  const ratings = await prisma.rating.findMany({
    where: { deal: { listingId: { in: listingIds } } },
    select: {
      id: true,
      raterId: true,
      rateeId: true,
      deal: { select: { id: true, sellerId: true, buyerId: true, listingId: true } },
    },
  });
  for (const r of ratings) {
    const l = listingById.get(r.deal.listingId);
    if (r.raterId === r.rateeId) {
      hit(`Rating ${r.id} on deal ${r.deal.id} ("${l?.title}") — rater === ratee (${who(r.raterId)})`);
    }
    const pair = new Set([r.deal.sellerId, r.deal.buyerId]);
    if (!pair.has(r.raterId) || !pair.has(r.rateeId)) {
      hit(
        `Rating ${r.id} on deal ${r.deal.id} — rater/ratee (${who(r.raterId)} / ${who(r.rateeId)}) aren't the deal's buyer+seller pair`,
      );
    }
  }

  console.log(`\n${total === 0 ? "No crosslink violations found." : `${total} violation(s) listed above.`}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
