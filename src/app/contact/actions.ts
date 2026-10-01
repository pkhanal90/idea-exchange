"use server";

import { redirect } from "next/navigation";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { sendMail, emailShell } from "@/lib/mailer";

const CONTACT_RECIPIENT = "hello@ideaexchange.io";

function redirectWithError(error: string) {
  redirect(`/contact?error=${encodeURIComponent(error)}`);
}

export async function submitContactAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    redirectWithError("missing_fields");
  }
  if (!email.includes("@")) {
    redirectWithError("invalid_email");
  }
  if (message.length > 5000) {
    redirectWithError("message_too_long");
  }

  const ip = (await getClientIp()) ?? "unknown";
  const [byIp, byEmail] = await Promise.all([
    checkRateLimit({ identifier: `ip:${ip}`, action: "CONTACT_FORM", limit: 5, windowSeconds: 600 }),
    checkRateLimit({
      identifier: `email:${email}`,
      action: "CONTACT_FORM",
      limit: 3,
      windowSeconds: 600,
    }),
  ]);
  if (!byIp.allowed || !byEmail.allowed) {
    redirectWithError("rate_limited");
  }

  const text = `New contact form submission.

Name: ${name}
Email: ${email}

${message}`;
  const html = emailShell(`
  <p>New contact form submission.</p>
  <p><strong>Name:</strong> ${name}<br/><strong>Email:</strong> ${email}</p>
  <p>${message.replace(/\n/g, "<br/>")}</p>`);

  await sendMail({
    to: CONTACT_RECIPIENT,
    subject: `New contact form message from ${name}`,
    text,
    html,
  });

  redirect("/contact?success=1");
}
