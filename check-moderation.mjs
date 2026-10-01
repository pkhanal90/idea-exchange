// Audits the listing moderation pipeline for stuck or inconsistent records.
//
// Run: node --env-file=.env.production.local check-moderation.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;
const STUCK_AFTER_HOURS = 72;

function hoursAgo(date) {
  return (Date.now() - date.getTime()) / (60 * 60 * 1000);
}

async function main() {
  const listings = await prisma.listing.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      publishedAt: true,
      rejectionNote: true,
      createdAt: true,
      updatedAt: true,
      seller: { select: { email: true } },
    },
  });

  const byStatus = {};
  for (const l of listings) byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;

  console.log("=== Listings by status ===");
  for (const [status, count] of Object.entries(byStatus)) console.log(`  ${status}: ${count}`);

  // 1. Stuck in review — the exact failure mode this whole audit trail started from.
  const stuck = listings.filter(
    (l) => l.status === "PENDING_REVIEW" && hoursAgo(l.createdAt) > STUCK_AFTER_HOURS,
  );
  console.log(`\n=== Stuck in PENDING_REVIEW over ${STUCK_AFTER_HOURS}h (${stuck.length}) ===`);
  for (const l of stuck) {
    console.log(`  ${l.id}  "${l.title}"  by ${l.seller.email}  (${Math.round(hoursAgo(l.createdAt))}h)`);
  }

  // 2. PUBLISHED without publishedAt — approveListingAction always sets this; a
  // listing with the status but not the timestamp means it bypassed that action.
  const publishedNoTimestamp = listings.filter((l) => l.status === "PUBLISHED" && !l.publishedAt);
  console.log(`\n=== PUBLISHED but missing publishedAt (${publishedNoTimestamp.length}) ===`);
  for (const l of publishedNoTimestamp) console.log(`  ${l.id}  "${l.title}"`);

  // 3. REJECTED without a rejectionNote — rejectListingAction always sets one
  // (falls back to a default string), so a blank note means a direct DB write.
  const rejectedNoNote = listings.filter((l) => l.status === "REJECTED" && !l.rejectionNote);
  console.log(`\n=== REJECTED but missing rejectionNote (${rejectedNoNote.length}) ===`);
  for (const l of rejectedNoNote) console.log(`  ${l.id}  "${l.title}"`);

  // 4. PUBLISHED/REJECTED listings with no matching AuditLog entry — every real
  // approve/reject through the admin UI writes one; a missing entry means the
  // status was set some other way (seed script, direct DB edit, etc).
  const decided = listings.filter((l) => l.status === "PUBLISHED" || l.status === "REJECTED");
  const auditedIds = new Set(
    (
      await prisma.auditLog.findMany({
        where: {
          action: { in: ["LISTING_APPROVED", "LISTING_REJECTED"] },
          targetType: "Listing",
          targetId: { in: decided.map((l) => l.id) },
        },
        select: { targetId: true },
      })
    ).map((a) => a.targetId),
  );
  const undocumented = decided.filter((l) => !auditedIds.has(l.id));
  console.log(`\n=== Decided listings with no audit trail (${undocumented.length}) ===`);
  for (const l of undocumented) console.log(`  ${l.id}  "${l.title}"  [${l.status}]`);

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
