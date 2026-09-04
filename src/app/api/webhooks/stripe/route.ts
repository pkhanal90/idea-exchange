import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe, stripeEnabled } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: Request) {
  if (!stripeEnabled) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();

  let event: Stripe.Event;
  try {
    if (!signature || !webhookSecret) throw new Error("Missing signature or webhook secret");
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const dealId = session.metadata?.dealId;
      if (dealId && session.payment_intent) {
        await prisma.deal.updateMany({
          where: { id: dealId, stage: "ESCROW_PENDING" },
          data: {
            stripePaymentIntentId: String(session.payment_intent),
            escrowFundedAt: new Date(),
            stage: "ESCROW_HELD",
          },
        });
      }
      break;
    }
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      if (account.details_submitted && account.charges_enabled) {
        await prisma.user.updateMany({
          where: { stripeConnectAccountId: account.id },
          data: { stripeConnectOnboarded: true },
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
