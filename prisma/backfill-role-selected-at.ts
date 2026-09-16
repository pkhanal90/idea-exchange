import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// One-off: marks every account that predates the Buyer/Seller/Investor
// onboarding screen as already onboarded, so nobody with an existing account
// gets bounced into it. Safe to re-run — only ever touches rows still null.
async function main() {
  const { count } = await prisma.user.updateMany({
    where: { roleSelectedAt: null },
    data: { roleSelectedAt: new Date() },
  });
  console.log(`Backfilled roleSelectedAt on ${count} existing user(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
