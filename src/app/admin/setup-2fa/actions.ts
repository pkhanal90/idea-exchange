"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { verifyCode } from "@/lib/totp";
import { signStepUpToken, STEP_UP_COOKIE, STEP_UP_COOKIE_MAX_AGE } from "@/lib/totp-session";
import { checkRateLimit } from "@/lib/rate-limit";

export interface SetupTwoFactorState {
  error?: string;
}

export async function confirmTwoFactorSetupAction(
  _prevState: SetupTwoFactorState,
  formData: FormData,
): Promise<SetupTwoFactorState> {
  // Role/status only — satisfying this challenge is what grants the step-up,
  // so requireVerifiedAdmin() (which demands the step-up already exist)
  // would be circular here.
  const session = await requireAdmin();

  const base32Secret = String(formData.get("secret") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  if (!base32Secret || !code) {
    return { error: "Enter the 6-digit code from your authenticator app." };
  }

  const { allowed, retryAfterSeconds } = await checkRateLimit({
    identifier: `user:${session.user.id}`,
    action: "TWO_FACTOR_VERIFY",
    limit: 5,
    windowSeconds: 300,
  });
  if (!allowed) {
    return {
      error: `Too many attempts. Wait ${Math.ceil(retryAfterSeconds / 60)} minutes and try again.`,
    };
  }

  if (!verifyCode(base32Secret, code)) {
    return { error: "That code didn't match. Check the time on your device and try again." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorSecret: base32Secret,
      twoFactorEnabled: true,
      twoFactorEnabledAt: new Date(),
    },
  });

  const token = await signStepUpToken(session.user.id);
  (await cookies()).set(STEP_UP_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: STEP_UP_COOKIE_MAX_AGE,
  });

  redirect("/admin");
}
