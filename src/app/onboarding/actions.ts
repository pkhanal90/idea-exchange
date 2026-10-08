"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_VISUALS } from "@/lib/role-visuals";
import { ATTRIBUTION_COOKIE, decodeAttribution, isHeardAboutKey } from "@/lib/acquisition";
import type { UserRole } from "@prisma/client";

// The only three account types someone can pick for themselves — ADMIN stays
// admin-only, set via the admin panel, never through this screen.
const SELECTABLE_ROLES: readonly UserRole[] = ["BUYER", "SELLER", "INVESTOR"];

export async function chooseRoleAction(role: UserRole, formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/onboarding");
  if (!SELECTABLE_ROLES.includes(role)) {
    throw new Error(`${role} is not a self-service account type`);
  }

  // Optional "How did you hear about us?" answer plus the first-touch
  // attribution the visit beacon left in a cookie. Both are best-effort: a
  // missing answer or cookie never blocks onboarding.
  const heardRaw = String(formData.get("heardAbout") ?? "");
  const heardAbout = isHeardAboutKey(heardRaw) ? heardRaw : null;
  const heardAboutDetail =
    heardAbout === "other" || heardAbout === "friend" || heardAbout === "newsletter"
      ? String(formData.get("heardAboutDetail") ?? "").trim().slice(0, 200) || null
      : null;
  const touch = decodeAttribution((await cookies()).get(ATTRIBUTION_COOKIE)?.value);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role,
      roleSelectedAt: new Date(),
      heardAbout,
      heardAboutDetail,
      ...(touch && {
        acqSource: touch.source,
        acqMedium: touch.medium,
        acqCampaign: touch.campaign,
        acqReferrer: touch.referrer,
        acqLanding: touch.landing,
      }),
    },
  });

  // The navbar (role badge, avatar ring) lives in the root layout, which
  // Next.js's router cache would otherwise keep serving from before this
  // account had a role at all — bust it so the new role shows up everywhere,
  // not just on the page this action redirects to.
  revalidatePath("/", "layout");
  redirect(ROLE_VISUALS[role].dashboardHref);
}
