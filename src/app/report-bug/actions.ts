"use server";

import { redirect } from "next/navigation";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { sendMail, emailShell } from "@/lib/mailer";

const BUG_REPORT_RECIPIENT = "support@ideaexchange.io";

function redirectWithError(error: string) {
  redirect(`/report-bug?error=${encodeURIComponent(error)}`);
}

export async function submitBugReportAction(formData: FormData) {
  const whatHappened = String(formData.get("whatHappened") ?? "").trim();
  const pageUrl = String(formData.get("pageUrl") ?? "").trim();
  const stepsToReproduce = String(formData.get("stepsToReproduce") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!whatHappened) {
    redirectWithError("missing_fields");
  }
  if (whatHappened.length > 5000 || stepsToReproduce.length > 5000) {
    redirectWithError("message_too_long");
  }
  if (email && !email.includes("@")) {
    redirectWithError("invalid_email");
  }

  const ip = (await getClientIp()) ?? "unknown";
  const { allowed } = await checkRateLimit({
    identifier: `ip:${ip}`,
    action: "BUG_REPORT",
    limit: 5,
    windowSeconds: 600,
  });
  if (!allowed) {
    redirectWithError("rate_limited");
  }

  const text = `New bug report.

What happened:
${whatHappened}

Page/URL: ${pageUrl || "(not provided)"}

Steps to reproduce:
${stepsToReproduce || "(not provided)"}

Reporter email: ${email || "(not provided)"}`;
  const html = emailShell(`
  <p>New bug report.</p>
  <p><strong>What happened:</strong><br/>${whatHappened.replace(/\n/g, "<br/>")}</p>
  <p><strong>Page/URL:</strong> ${pageUrl || "(not provided)"}</p>
  <p><strong>Steps to reproduce:</strong><br/>${(stepsToReproduce || "(not provided)").replace(/\n/g, "<br/>")}</p>
  <p><strong>Reporter email:</strong> ${email || "(not provided)"}</p>`);

  await sendMail({
    to: BUG_REPORT_RECIPIENT,
    subject: `Bug report: ${whatHappened.slice(0, 80)}`,
    text,
    html,
  });

  redirect("/report-bug?success=1");
}
