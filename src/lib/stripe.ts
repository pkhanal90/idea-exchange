import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripeEnabled = Boolean(secretKey);

// Lazily constructed so the app can boot (and every other page can render)
// before Stripe test-mode keys are configured — only escrow/payout actions
// need this, and they check `stripeEnabled` first.
export const stripe = secretKey
  ? new Stripe(secretKey)
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(
            "Stripe is not configured — set STRIPE_SECRET_KEY in .env to enable escrow and payouts.",
          );
        },
      },
    ) as Stripe);

// Prototype platform fee taken out of the escrow release, illustrative only.
export const PLATFORM_FEE_BPS = 500; // 5%

export function platformFeeCents(amountCents: number) {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10_000);
}
