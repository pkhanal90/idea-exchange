"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

export async function signInWithGoogleAction(formData: FormData) {
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");
  await signIn("google", { redirectTo: callbackUrl });
}

export async function signInWithEmailAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");

  // Two independent limits: per-email stops one inbox being flooded with
  // links, per-IP stops one sender spamming many different addresses.
  const [byEmail, byIp] = await Promise.all([
    checkRateLimit({
      identifier: `email:${email}`,
      action: "SIGN_IN",
      limit: 3,
      windowSeconds: 600,
    }),
    checkRateLimit({
      identifier: `ip:${(await getClientIp()) ?? "unknown"}`,
      action: "SIGN_IN",
      limit: 8,
      windowSeconds: 600,
    }),
  ]);

  if (!byEmail.allowed || !byIp.allowed) {
    const url = new URL("/auth/signin", "http://localhost");
    url.searchParams.set("error", "rate_limited");
    url.searchParams.set("callbackUrl", callbackUrl);
    redirect(`${url.pathname}${url.search}`);
  }

  await signIn("nodemailer", { email, redirectTo: callbackUrl });
}
