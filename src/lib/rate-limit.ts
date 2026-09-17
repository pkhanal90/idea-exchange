import { prisma } from "@/lib/prisma";
import type { RateLimitAction } from "@prisma/client";

// Sliding-window check against RateLimitAttempt (see schema — scaffolded
// earlier, never wired up until now). Every call records this attempt, then
// counts how many the same identifier has made for this action within the
// trailing window: recording unconditionally (not just on allowed attempts)
// means an attacker can't reset their own count by making the check "pass"
// repeatedly.
export async function checkRateLimit({
  identifier,
  action,
  limit,
  windowSeconds,
}: {
  identifier: string;
  action: RateLimitAction;
  limit: number;
  windowSeconds: number;
}): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const now = Date.now();
  const windowStart = new Date(now - windowSeconds * 1000);

  await prisma.rateLimitAttempt.create({ data: { identifier, action } });

  const count = await prisma.rateLimitAttempt.count({
    where: { identifier, action, createdAt: { gte: windowStart } },
  });

  // Opportunistic cleanup (~1% of calls) so the table self-prunes without a
  // cron job — old rows are only ever read within their own window anyway.
  if (Math.random() < 0.01) {
    await prisma.rateLimitAttempt.deleteMany({
      where: { createdAt: { lt: new Date(now - 60 * 60 * 1000) } },
    });
  }

  return { allowed: count <= limit, retryAfterSeconds: windowSeconds };
}
