"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_VISUALS } from "@/lib/role-visuals";
import type { UserRole } from "@prisma/client";

// The only three account types someone can pick for themselves — ADMIN stays
// admin-only, set via the admin panel, never through this screen.
const SELECTABLE_ROLES: readonly UserRole[] = ["BUYER", "SELLER", "INVESTOR"];

export async function chooseRoleAction(role: UserRole) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/onboarding");
  if (!SELECTABLE_ROLES.includes(role)) {
    throw new Error(`${role} is not a self-service account type`);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role, roleSelectedAt: new Date() },
  });

  redirect(ROLE_VISUALS[role].dashboardHref);
}
