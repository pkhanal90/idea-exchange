// Restores the original showcase catalog on Browse Ideas if it ever gets
// archived again — e.g. by a future bulk moderation pass, a pause action,
// or anything else that sweeps listing status.
//
// Scope is deliberately narrow and hardcoded, not "every archived listing
// matching some pattern": the five SEED_SELLER_EMAILS accounts exist only
// to hold this showcase catalog and will never have real content, so it's
// safe to restore everything archived under them. ADDITIONAL_LISTING_TITLES
// covers the one demo listing that lives on the real prawesh@ideaexchange.io
// account instead (which also holds other intentionally-different-stage
// example listings — draft/pending/under-offer/sold — that must NOT be
// touched by this script, hence the explicit title match instead of "all
// archived listings on that account").
//
// Once real submissions are approved and should replace this catalog, that
// is a separate, deliberate decision — not something to automate here.
//
// Defaults to a dry run (prints what would change, touches nothing). Pass
// --force to actually apply it.
//
// Run: node --env-file=.env.production.local republish-demo-catalog.mjs [--force]
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const FORCE = process.argv.includes("--force");

const SEED_SELLER_EMAILS = [
  "founder@ideaexchange.test",
  "builder@ideaexchange.test",
  "elena@ideaexchange.test",
  "david@ideaexchange.test",
  "demo@ideaexchange.test",
];

const ADDITIONAL_LISTING_TITLES = ["Smart irrigation controller for urban farms"];

async function main() {
  const candidates = await prisma.listing.findMany({
    where: {
      status: "ARCHIVED",
      OR: [
        { seller: { email: { in: SEED_SELLER_EMAILS } } },
        { title: { in: ADDITIONAL_LISTING_TITLES } },
      ],
    },
    select: { id: true, title: true, publishedAt: true },
  });

  if (candidates.length === 0) {
    console.log("Nothing archived in scope — catalog is already up.");
    await prisma.$disconnect();
    return;
  }

  // A listing that was never published (publishedAt null) was seeded as a
  // DRAFT-state example on purpose — titles make this obvious ("Draft:
  // ..."). Restoring those to PUBLISHED would put a listing literally
  // titled "Draft: ..." in front of real visitors, so they go back to
  // DRAFT instead.
  const toPublish = candidates.filter((l) => l.publishedAt !== null);
  const toDraft = candidates.filter((l) => l.publishedAt === null);

  console.log(FORCE ? "Mode: APPLY (--force passed)\n" : "Mode: DRY RUN — pass --force to apply\n");

  console.log(`${FORCE ? "Restoring" : "Would restore"} to PUBLISHED (${toPublish.length}):`);
  for (const l of toPublish) console.log(`  - ${l.title}`);

  console.log(`\n${FORCE ? "Restoring" : "Would restore"} to DRAFT (${toDraft.length}):`);
  for (const l of toDraft) console.log(`  - ${l.title}`);

  if (FORCE) {
    await prisma.listing.updateMany({
      where: { id: { in: toPublish.map((l) => l.id) } },
      data: { status: "PUBLISHED" },
    });
    await prisma.listing.updateMany({
      where: { id: { in: toDraft.map((l) => l.id) } },
      data: { status: "DRAFT" },
    });
    console.log("\nDone.");
  } else {
    console.log("\nDry run complete — nothing was changed.");
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
