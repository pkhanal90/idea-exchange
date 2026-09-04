"use server";

import { signIn } from "@/lib/auth";

export async function signInWithGoogleAction(formData: FormData) {
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");
  await signIn("google", { redirectTo: callbackUrl });
}

export async function signInWithEmailAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");
  await signIn("nodemailer", { email, redirectTo: callbackUrl });
}
