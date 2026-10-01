// Checks that admin-related references involving the seed/demo dataset are
// sane: the one seed admin account is who it should be, no demo buyer/seller
// account accidentally got admin access, and the audit log doesn't have
// entries pointing at a seed listing that no longer exists (seed.ts wipes
// and recreates listings on every run, which orphans old AuditLog rows that
// targeted them).
//
// Run: node --env-file=.env.production.local check-seed-admin-refs.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SEED_DOMAIN = "@ideaexchange.test";

async function main() {
  // 1. The seed admin itself.
  const seedAdmin = await prisma.user.findUnique({
    where: { email: "admin@ideaexchange.test" },
    select: { id: true, role: true, adminRole: true, status: true },
  });
  console.log("=== Seed admin account ===");
  if (!seedAdmin) {
    console.log("  MISSING — admin@ideaexchange.test does not exist.");
  } else if (seedAdmin.role !== "ADMIN") {
    console.log(`  WRONG ROLE — role is ${seedAdmin.role}, expected ADMIN.`);
  } else {
    console.log(`  OK — ${seedAdmin.id}  adminRole=${seedAdmin.adminRole ?? "(none)"}  status=${seedAdmin.status}`);
  }

  // 2. Any other @ideaexchange.test account that isn't the seed admin but
  // somehow has admin access. The seed script only ever creates one ADMIN
  // (admin@ideaexchange.test) — a second one means a demo account got
  // escalated by hand and was never cleaned up.
  const strayAdmins = await prisma.user.findMany({
    where: {
      email: { endsWith: SEED_DOMAIN, not: "admin@ideaexchange.test" },
      OR: [{ role: "ADMIN" }, { adminRole: { not: null } }],
    },
    select: { id: true, email: true, role: true, adminRole: true },
  });
  console.log(`\n=== Demo accounts with unexpected admin access (${strayAdmins.length}) ===`);
  for (const u of strayAdmins) console.log(`  ${u.id}  ${u.email}  role=${u.role}  adminRole=${u.adminRole}`);

  // 3. AuditLog rows whose actor isn't actually an admin right now. Every
  // write that creates these entries goes through requireAdmin()/
  // requireVerifiedAdmin() at the time, but a later role change (or the
  // actor being deleted) can leave a stale-looking trail.
  const logs = await prisma.auditLog.findMany({
    select: { id: true, actorId: true, action: true, targetType: true, targetId: true, createdAt: true },
  });
  const actorIds = [...new Set(logs.map((l) => l.actorId))];
  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, role: true, email: true },
  });
  const actorById = new Map(actors.map((a) => [a.id, a]));

  const nonAdminActors = logs.filter((l) => actorById.get(l.actorId)?.role !== "ADMIN");
  console.log(`\n=== AuditLog entries whose actor is not (or no longer) ADMIN (${nonAdminActors.length}) ===`);
  for (const l of nonAdminActors.slice(0, 20)) {
    const actor = actorById.get(l.actorId);
    console.log(
      `  ${l.id}  ${l.action}  actor=${actor ? `${actor.email} (${actor.role})` : `${l.actorId} (deleted)`}`,
    );
  }
  if (nonAdminActors.length > 20) console.log(`  ...and ${nonAdminActors.length - 20} more`);

  // 4. AuditLog rows targeting a Listing that no longer exists — expected
  // after re-running seed.ts (it wipes and recreates listings with new ids
  // each time), but worth surfacing as a count so it's not mistaken for a
  // real data-loss bug.
  const listingLogs = logs.filter((l) => l.targetType === "Listing" && l.targetId);
  const existingListingIds = new Set(
    (
      await prisma.listing.findMany({
        where: { id: { in: listingLogs.map((l) => l.targetId) } },
        select: { id: true },
      })
    ).map((l) => l.id),
  );
  const orphanedListingLogs = listingLogs.filter((l) => !existingListingIds.has(l.targetId));
  console.log(`\n=== AuditLog entries pointing at a deleted Listing (${orphanedListingLogs.length}) ===`);
  console.log("  (expected after re-running prisma/seed.ts — it wipes and recreates all listings)");

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
