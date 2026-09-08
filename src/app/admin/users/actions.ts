"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { recordAuditLog } from "@/lib/audit-log";
import type { UserStatus } from "@prisma/client";

const STATUS_TO_ACTION = {
  SUSPENDED: "USER_SUSPENDED",
  BANNED: "USER_BANNED",
  ACTIVE: "USER_REACTIVATED",
} as const;

export async function setUserStatusAction(userId: string, status: UserStatus, formData: FormData) {
  const session = await requireAdmin();

  if (userId === session.user.id) {
    throw new Error("You can't change your own account status.");
  }

  const target = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { role: true, status: true, statusReason: true },
  });
  if (target.role === "ADMIN") {
    throw new Error("Admin accounts can't be suspended or banned from this panel.");
  }

  const reason = String(formData.get("reason") ?? "").trim() || null;

  await prisma.user.update({
    where: { id: userId },
    data: { status, statusReason: status === "ACTIVE" ? null : reason, statusSetAt: new Date() },
  });

  await recordAuditLog({
    actorId: session.user.id,
    action: STATUS_TO_ACTION[status],
    targetType: "User",
    targetId: userId,
    beforeState: { status: target.status, statusReason: target.statusReason },
    afterState: { status, statusReason: reason },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function setAccreditationStatusAction(
  userId: string,
  verified: boolean,
) {
  const session = await requireAdmin();

  const target = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { accreditationStatus: true },
  });

  const nextStatus = verified ? "VERIFIED" : "UNSUBMITTED";
  await prisma.user.update({
    where: { id: userId },
    data: {
      accreditationStatus: nextStatus,
      accreditationAttestedAt: verified ? new Date() : null,
    },
  });

  await recordAuditLog({
    actorId: session.user.id,
    action: "USER_ACCREDITATION_UPDATED",
    targetType: "User",
    targetId: userId,
    beforeState: { accreditationStatus: target.accreditationStatus },
    afterState: { accreditationStatus: nextStatus },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}
