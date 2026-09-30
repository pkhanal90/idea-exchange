import nodemailer from "nodemailer";

const hasEmailServer = Boolean(process.env.EMAIL_SERVER_HOST);
const fromAddress = process.env.EMAIL_FROM ?? "Idea Exchange <no-reply@idea-exchange.test>";

const transport = hasEmailServer
  ? nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })
  : nodemailer.createTransport({ jsonTransport: true });

export function siteUrl(path: string) {
  const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return new URL(path, origin).toString();
}

// Every transactional email funnels through here — one place that knows how
// to reach SMTP, and that falls back to logging instead of throwing when
// none is configured (matching the magic-link dev fallback in lib/auth.ts).
// A failed send never throws: the underlying action (approve/reject/submit)
// already committed its DB change and shouldn't roll back or error out just
// because a notification bounced.
export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (!hasEmailServer) {
    console.log(`\n[dev] Email to ${to}: ${subject}\n${text}\n`);
    return;
  }
  try {
    await transport.sendMail({ from: fromAddress, to, subject, text, html });
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
  }
}

export function emailShell(bodyHtml: string) {
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; color: #1c2333; line-height: 1.6;">
${bodyHtml}
  <p>— The Idea Exchange Team</p>
</div>`;
}
