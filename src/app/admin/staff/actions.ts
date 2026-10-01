"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/rbac";
import { recordAuditLog } from "@/lib/audit-log";
import type { AdminRole } from "@prisma/client";

const VALID_ADMIN_ROLES: AdminRole[] = ["SUPER_ADMIN", "MODERATOR", "SUPPORT", "FINANCE"];

export interface InviteStaffState {
  error?: string;
}

// There's no password to set and no invite-acceptance step — this app is
// passwordless (magic link), so creating the User row with that email is
// enough; the new hire just signs in with it like anyone else.
export async function inviteStaffAction(
  _prevState: InviteStaffState,
  formData: FormData,
): Promise<InviteStaffState> {
  const session = await requireAdminSection("staff");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const adminRole = formData.get("adminRole") as AdminRole;

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (!VALID_ADMIN_ROLES.includes(adminRole)) {
    return { error: "Pick a valid role." };
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  if (existing) {
    return {
      error:
        existing.role === "ADMIN"
          ? "This person already has admin access."
          : "This email is already registered as a marketplace account.",
    };
  }

  const staff = await prisma.user.create({
    data: {
      email,
      role: "ADMIN",
      adminRole,
      // Skips the Buyer/Seller/Investor onboarding picker — not relevant to
      // a staff account.
      roleSelectedAt: new Date(),
      status: "ACTIVE",
    },
  });

  await recordAuditLog({
    actorId: session.user.id,
    action: "STAFF_INVITED",
    targetType: "User",
    targetId: staff.id,
    afterState: { email, adminRole },
  });

  revalidatePath("/admin/staff");
  return {};
}

export async function changeStaffRoleAction(userId: string, formData: FormData) {
  const session = await requireAdminSection("staff");
  if (userId === session.user.id) {
    throw new Error("You can't change your own role.");
  }

  const adminRole = formData.get("adminRole") as AdminRole;
  if (!VALID_ADMIN_ROLES.includes(adminRole)) {
    throw new Error("Pick a valid role.");
  }

  const before = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { role: true, adminRole: true },
  });
  if (before.role !== "ADMIN") {
    throw new Error("That account isn't a staff account.");
  }

  await prisma.user.update({ where: { id: userId }, data: { adminRole } });

  await recordAuditLog({
    actorId: session.user.id,
    action: "STAFF_ROLE_CHANGED",
    targetType: "User",
    targetId: userId,
    beforeState: { adminRole: before.adminRole },
    afterState: { adminRole },
  });

  revalidatePath("/admin/staff");
}

// Reuses the same status mechanism as a marketplace suspension (a suspended
// account is blocked at proxy.ts regardless of role) — kept as its own
// action, gated on "staff" rather than "users", so a Support/Moderator/
// Finance hire with Users-section access still can't cut off a fellow
// staff member's access, only a Super Admin can.
export async function revokeStaffAccessAction(userId: string) {
  const session = await requireAdminSection("staff");
  if (userId === session.user.id) {
    throw new Error("You can't revoke your own access.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "SUSPENDED", statusReason: "Admin access revoked", statusSetAt: new Date() },
  });

  await recordAuditLog({
    actorId: session.user.id,
    action: "USER_SUSPENDED",
    targetType: "User",
    targetId: userId,
    afterState: { status: "SUSPENDED", statusReason: "Admin access revoked" },
  });

  revalidatePath("/admin/staff");
}

export async function restoreStaffAccessAction(userId: string) {
  const session = await requireAdminSection("staff");

  await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE", statusReason: null, statusSetAt: new Date() },
  });

  await recordAuditLog({
    actorId: session.user.id,
    action: "USER_REACTIVATED",
    targetType: "User",
    targetId: userId,
    afterState: { status: "ACTIVE" },
  });

  revalidatePath("/admin/staff");
}
