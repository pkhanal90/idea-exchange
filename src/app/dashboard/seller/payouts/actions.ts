"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, stripeEnabled } from "@/lib/stripe";

export async function createConnectOnboardingLinkAction() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/seller/payouts");
  if (!stripeEnabled) return;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  let accountId = user.stripeConnectAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email ?? undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeConnectAccountId: accountId },
    });
  }

  const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/dashboard/seller/payouts`,
    return_url: `${origin}/dashboard/seller/payouts?onboarded=1`,
    type: "account_onboarding",
  });

  redirect(accountLink.url);
}
