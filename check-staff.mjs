// Audits real staff (ADMIN) accounts — the people who can actually get into
// /admin — for the specific ways a staff account silently loses access or
// ends up over/under-privileged.
//
// Run: node --env-file=.env.production.local check-staff.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const VALID_ADMIN_ROLES = ["SUPER_ADMIN", "MODERATOR", "SUPPORT", "FINANCE"];

async function main() {
  const staff = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: {
      id: true,
      email: true,
      name: true,
      adminRole: true,
      status: true,
      twoFactorEnabled: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`=== ${staff.length} staff (ADMIN) accounts ===`);
  const byRole = {};
  for (const s of staff) byRole[s.adminRole ?? "(none)"] = (byRole[s.adminRole ?? "(none)"] ?? 0) + 1;
  for (const [role, count] of Object.entries(byRole)) console.log(`  ${role}: ${count}`);

  // 1. No adminRole set — canAccessSection() silently falls back to SUPPORT
  // for these, so they're not locked out, just quietly under-scoped. Worth
  // knowing about even though nothing is "broken".
  const noRole = staff.filter((s) => !s.adminRole);
  console.log(`\n=== Missing adminRole, falls back to SUPPORT (${noRole.length}) ===`);
  for (const s of noRole) console.log(`  ${s.id}  ${s.email}`);

  // 2. adminRole set to something outside the enum — shouldn't be possible
  // through inviteStaffAction's validation, but direct DB writes bypass it.
  const badRole = staff.filter((s) => s.adminRole && !VALID_ADMIN_ROLES.includes(s.adminRole));
  console.log(`\n=== Invalid adminRole value (${badRole.length}) ===`);
  for (const s of badRole) console.log(`  ${s.id}  ${s.email}  adminRole=${s.adminRole}`);

  // 3. 2FA not enabled — the schema says this is "mandatory for ADMIN", but
  // that's enforced at the session gate (proxy.ts), not the DB. An account
  // that's never completed setup is locked out of every write action
  // (requireVerifiedAdmin) even though it has the role.
  const no2fa = staff.filter((s) => !s.twoFactorEnabled);
  console.log(`\n=== ADMIN without 2FA enabled — effectively locked out of writes (${no2fa.length}) ===`);
  for (const s of no2fa) console.log(`  ${s.id}  ${s.email}  lastLogin=${s.lastLoginAt ?? "never"}`);

  // 4. Not ACTIVE — suspended/banned staff accounts. requireRole() blocks
  // these regardless of role, so flag them as dead weight / a question of
  // whether they should still exist at all.
  const inactive = staff.filter((s) => s.status !== "ACTIVE");
  console.log(`\n=== Staff accounts not ACTIVE (${inactive.length}) ===`);
  for (const s of inactive) console.log(`  ${s.id}  ${s.email}  status=${s.status}`);

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
