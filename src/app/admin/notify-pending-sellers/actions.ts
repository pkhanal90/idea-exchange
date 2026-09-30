"use server";

import nodemailer from "nodemailer";
import { requireVerifiedAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export interface SendNotificationResult {
  fromAddress: string;
  sentTo: string[];
  failed: { email: string; error: string }[];
}

const SUBJECT = "An update on your Idea Exchange submission";

const TEXT_BODY = `Hi there,

Thank you for submitting your idea on Idea Exchange — it genuinely means a lot to us that you took the time to do it. You're one of the first people to actually try what we're building, and that's not lost on us.

We wanted to reach out directly: Idea Exchange is still in an early building phase, and we're taking some time to get the platform properly ready before any deal moves forward on it. Because of that, we're pausing the site for now.

Your submission hasn't gone anywhere — it's saved exactly as you left it. Once we're back, our team will review it the same way we would have originally, and it'll go live on the marketplace from there.

We'll let you know when we're back online. Thanks again for believing in this early, and for being part of it from the start.

— The Idea Exchange Team`;

const HTML_BODY = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; color: #1c2333; line-height: 1.6;">
  <p>Hi there,</p>
  <p>Thank you for submitting your idea on Idea Exchange — it genuinely means a lot to us that you took the time to do it. You're one of the first people to actually try what we're building, and that's not lost on us.</p>
  <p>We wanted to reach out directly: Idea Exchange is still in an early building phase, and we're taking some time to get the platform properly ready before any deal moves forward on it. Because of that, we're pausing the site for now.</p>
  <p>Your submission hasn't gone anywhere — it's saved exactly as you left it. Once we're back, our team will review it the same way we would have originally, and it'll go live on the marketplace from there.</p>
  <p>We'll let you know when we're back online. Thanks again for believing in this early, and for being part of it from the start.</p>
  <p>— The Idea Exchange Team</p>
</div>
`;

// One-off outreach to real (non-seed, non-admin) accounts with a listing
// still sitting in PENDING_REVIEW — see the admin conversation this was
// built for. Meant to run once; the page/action can be deleted afterward.
export async function sendPendingSellerNotificationAction(): Promise<SendNotificationResult> {
  await requireVerifiedAdmin();

  const sellers = await prisma.listing.findMany({
    where: {
      status: "PENDING_REVIEW",
      seller: { role: { not: "ADMIN" } },
    },
    distinct: ["sellerId"],
    select: { seller: { select: { email: true, name: true } } },
  });

  const recipients = [...new Set(sellers.map((s) => s.seller.email).filter((e): e is string => Boolean(e)))];

  const fromAddress = process.env.EMAIL_FROM ?? "Idea Exchange <no-reply@idea-exchange.test>";
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  const sentTo: string[] = [];
  const failed: { email: string; error: string }[] = [];

  for (const email of recipients) {
    try {
      await transport.sendMail({
        from: fromAddress,
        to: email,
        subject: SUBJECT,
        text: TEXT_BODY,
        html: HTML_BODY,
      });
      sentTo.push(email);
    } catch (err) {
      failed.push({ email, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return { fromAddress, sentTo, failed };
}

// Sends the exact same email to the admin's own address so it can be
// eyeballed before the real batch goes out.
export async function sendTestNotificationAction(): Promise<SendNotificationResult> {
  const session = await requireVerifiedAdmin();
  if (!session.user.email) throw new Error("Your account has no email on file.");

  const fromAddress = process.env.EMAIL_FROM ?? "Idea Exchange <no-reply@idea-exchange.test>";
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  try {
    await transport.sendMail({
      from: fromAddress,
      to: session.user.email,
      subject: `[TEST] ${SUBJECT}`,
      text: TEXT_BODY,
      html: HTML_BODY,
    });
    return { fromAddress, sentTo: [session.user.email], failed: [] };
  } catch (err) {
    return {
      fromAddress,
      sentTo: [],
      failed: [{ email: session.user.email, error: err instanceof Error ? err.message : "Unknown error" }],
    };
  }
}

export async function previewPendingSellerRecipientsAction() {
  await requireVerifiedAdmin();

  const sellers = await prisma.listing.findMany({
    where: {
      status: "PENDING_REVIEW",
      seller: { role: { not: "ADMIN" } },
    },
    distinct: ["sellerId"],
    select: { seller: { select: { email: true, name: true } } },
  });

  return [...new Set(sellers.map((s) => s.seller.email).filter((e): e is string => Boolean(e)))];
}
