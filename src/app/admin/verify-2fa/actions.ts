"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { verifyCode } from "@/lib/totp";
import { signStepUpToken, STEP_UP_COOKIE, STEP_UP_COOKIE_MAX_AGE } from "@/lib/totp-session";

export interface VerifyTwoFactorState {
  error?: string;
}

export async function verifyTwoFactorAction(
  _prevState: VerifyTwoFactorState,
  formData: FormData,
): Promise<VerifyTwoFactorState> {
  // Role/status only — see the identical note in setup-2fa/actions.ts.
  const session = await requireAdmin();

  const code = String(formData.get("code") ?? "").trim();
  const callbackUrl = String(formData.get("callbackUrl") ?? "/admin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    redirect("/admin/setup-2fa");
  }
  if (!code || !verifyCode(user.twoFactorSecret, code)) {
    return { error: "That code didn't match. Check the time on your device and try again." };
  }

  const token = await signStepUpToken(session.user.id);
  (await cookies()).set(STEP_UP_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: STEP_UP_COOKIE_MAX_AGE,
  });

  redirect(callbackUrl.startsWith("/") ? callbackUrl : "/admin");
}
