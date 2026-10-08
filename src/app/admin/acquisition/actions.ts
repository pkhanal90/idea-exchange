"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/rbac";
import { recordAuditLog } from "@/lib/audit-log";
import { LINK_BUILDER_SOURCES, slugCampaign } from "@/lib/acquisition";

export interface SpendFormState {
  error?: string;
  saved?: boolean;
}

const MAX_SPEND_DOLLARS = 1_000_000;

export async function addSpendAction(_prev: SpendFormState, formData: FormData): Promise<SpendFormState> {
  const session = await requireAdminSection("acquisition");

  const source = String(formData.get("source") ?? "");
  const campaign = slugCampaign(String(formData.get("campaign") ?? "")) || null;
  const dollars = Number(String(formData.get("amount") ?? "").replace(/[$,\s]/g, ""));
  const spentOn = new Date(`${String(formData.get("spentOn") ?? "")}T12:00:00Z`);
  const note = String(formData.get("note") ?? "").trim().slice(0, 200) || null;

  if (!LINK_BUILDER_SOURCES.some((s) => s.source === source)) return { error: "Pick where the money was spent." };
  if (!Number.isFinite(dollars) || dollars <= 0 || dollars > MAX_SPEND_DOLLARS) {
    return { error: "Enter an amount greater than $0." };
  }
  if (Number.isNaN(spentOn.getTime()) || spentOn.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    return { error: "Enter a valid date that isn't in the future." };
  }

  const amountCents = Math.round(dollars * 100);
  const entry = await prisma.campaignSpend.create({
    data: { source, campaign, amountCents, spentOn, note, createdById: session.user.id },
  });

  await recordAuditLog({
    actorId: session.user.id,
    action: "CAMPAIGN_SPEND_ADDED",
    targetType: "CampaignSpend",
    targetId: entry.id,
    afterState: { source, campaign, amountCents, spentOn: spentOn.toISOString().slice(0, 10) },
  });

  revalidatePath("/admin/acquisition");
  return { saved: true };
}

export async function deleteSpendAction(id: string) {
  const session = await requireAdminSection("acquisition");
  const before = await prisma.campaignSpend.findUnique({ where: { id } });
  if (!before) return;

  await prisma.campaignSpend.delete({ where: { id } });
  await recordAuditLog({
    actorId: session.user.id,
    action: "CAMPAIGN_SPEND_REMOVED",
    targetType: "CampaignSpend",
    targetId: id,
    beforeState: {
      source: before.source,
      campaign: before.campaign,
      amountCents: before.amountCents,
      spentOn: before.spentOn.toISOString().slice(0, 10),
    },
  });
  revalidatePath("/admin/acquisition");
}
