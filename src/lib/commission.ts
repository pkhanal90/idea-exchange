import { prisma } from "@/lib/prisma";
import type { IndustryCategory } from "@prisma/client";

// Fallback when no PlatformSettings row exists yet; matches the schema default.
export const DEFAULT_COMMISSION_PERCENT = 10;

// One source of truth for the platform's cut: the admin-configurable
// PlatformSettings rate, with a per-category override taking precedence.
// Escrow checkout and the Financials reporting both resolve it the same way.
export async function getCommissionPercent(category: IndustryCategory): Promise<number> {
  const settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
    include: { categoryOverrides: { where: { category } } },
  });
  const override = settings?.categoryOverrides[0];
  return Number(override?.commissionPercent ?? settings?.commissionPercent ?? DEFAULT_COMMISSION_PERCENT);
}

export function commissionFeeCents(amountCents: number, percent: number) {
  return Math.round((amountCents * percent) / 100);
}
