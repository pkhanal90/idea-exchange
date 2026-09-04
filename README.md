# Idea Exchange

A marketplace for buying and selling early-stage startup ideas — full ownership, or
equity/royalty stakes — between founders and VCs/angels. Prototype/MVP build.

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **PostgreSQL + Prisma** (`prisma/schema.prisma`)
- **Auth.js / NextAuth v5** — Google OAuth + passwordless email magic links
- **Tailwind CSS v4**
- **Stripe** (test mode) — Connect for seller payouts, Checkout with manual capture for
  escrow-style holds

## Current scope

- Landing page, browse/search listings, listing detail with a **NDA click-through gate**
- Structured create-listing flow (draft → submit for review), with PDF pitch deck upload
- **Offers & negotiation**: cash / equity / royalty offers, counter-offers back and forth,
  accept/decline, for fixed-price and equity/royalty listings
- **Auctions**: bidding with a live high bid, seller accepts the top bid to open a deal
- **Deal room**: agreement → escrow → IP assignment → complete, with a cancel-anytime escape
  hatch; completing a deal marks the listing **Sold** and pulls it from public search
- **Escrow (simulated)**: Stripe Connect Express onboarding for sellers, Stripe Checkout with
  `capture_method: manual` for buyers (funds authorized/held, not captured, until both sides
  confirm the IP assignment) — see `src/lib/stripe.ts` and `src/app/api/webhooks/stripe/route.ts`
- **IP assignment document**: mocked, rendered/printable at `/deals/[id]/ip-assignment` — not
  produced by a real legal vendor
- **In-app messaging**: per-listing threads between a seller and an interested buyer (`/messages`)
- **Ratings**: buyer and seller rate each other once a deal completes
- Seller and Investor dashboards, admin moderation queue (approve/reject)
- Auth (Google + email magic link), role-based route protection (`src/proxy.ts`)
- Self-attested investor accreditation checkbox

## Getting started

1. **Install dependencies** (already done if you just scaffolded this):
   ```bash
   npm install
   ```
2. **Start PostgreSQL.** Any local or hosted instance works. Easiest local option with Docker:
   ```bash
   docker run --name idea-exchange-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=idea_exchange -p 5432:5432 -d postgres:16
   ```
   Without Docker, install PostgreSQL directly and create a database named `idea_exchange`.
3. **Configure environment variables.** `.env` was created from `.env.example` — at minimum
   `DATABASE_URL` must point at a real database. Google OAuth, SMTP, and Stripe are optional
   for browsing/listing but required for their respective features (see below).
4. **Push the schema and seed sample data:**
   ```bash
   npm run db:push
   npm run db:seed
   ```
5. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

### Signing in during local dev

- If `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` aren't set, the "Continue with Google" button
  is hidden automatically.
- If SMTP (`EMAIL_SERVER_HOST`, etc.) isn't set, magic-link sign-in still works — the link is
  printed to the **server terminal** instead of being emailed. Copy it from the terminal into
  your browser.
- The seed script creates an admin (`admin@ideaexchange.test`), two sellers, and two investors
  by email. Sign in with any of those addresses to land in that seeded account (role and
  history included).

### Setting up Stripe (test mode)

1. Grab test-mode keys from the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys)
   and set `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` in `.env`.
2. Forward webhooks to your local server with the [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the `whsec_...` value it prints into `STRIPE_WEBHOOK_SECRET`.
3. Without the CLI running, escrow still works: the deal room and payouts pages re-check
   Stripe directly on page load whenever they're waiting on a webhook, so local dev doesn't
   strictly require `stripe listen` — it's only needed for instant updates without a refresh.
4. A seller connects payouts from **Dashboard → Payouts** (Stripe Express onboarding, test
   mode — use [Stripe's test values](https://stripe.com/docs/connect/testing) to complete it).
5. Use [Stripe's test cards](https://stripe.com/docs/testing) (e.g. `4242 4242 4242 4242`) to
   fund escrow at checkout.

If `STRIPE_SECRET_KEY` isn't set, the app still runs — escrow-funding UI shows a "Stripe isn't
configured" notice instead of erroring, and deals with no cash component (pure equity/royalty)
skip escrow entirely regardless.

### Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run db:push` | Sync the Prisma schema to your database (no migration history — good for prototyping) |
| `npm run db:migrate` | Create a tracked migration (switch to this once the schema stabilizes) |
| `npm run db:seed` | Re-run `prisma/seed.ts` |
| `npm run db:studio` | Open Prisma Studio to browse/edit data |

## Project structure

```
prisma/schema.prisma       Data model: users, listings, offers, deals, messages, ratings…
prisma/seed.ts             Sample sellers, investors, and listings across every status

src/lib/auth.ts            NextAuth v5 config (Google + email providers, role on session)
src/lib/prisma.ts          Prisma client singleton
src/lib/stripe.ts          Stripe client + platform fee helper
src/lib/offers.ts          Shared offer-chain queries + accept→deal transaction
src/proxy.ts               Route protection for /dashboard, /admin, /listings/create,
                            /listings/[id]/offer, /messages, /offers, /deals

src/app/page.tsx                       Landing page
src/app/listings/page.tsx              Browse + filter published listings
src/app/listings/[id]/page.tsx         Listing detail — teaser vs. NDA-gated full view,
                                        offer/bid/contact CTAs
src/app/listings/[id]/offer/           Make-an-offer form (fixed-price / equity listings)
src/app/listings/create/               Structured create-listing form + server action
src/app/offers/[offerId]/              Negotiation thread — accept, decline, counter
src/app/deals/[dealId]/                Deal room — agreement → escrow → IP assignment → complete
src/app/deals/[dealId]/ip-assignment/  Printable mock IP assignment document
src/app/messages/                      Inbox + per-listing message threads
src/app/api/webhooks/stripe/           Stripe webhook (checkout completion, Connect onboarding)
src/app/dashboard/seller/              Seller dashboard (listings, offers, payouts, messages, ratings)
src/app/dashboard/investor/            Investor dashboard (deal room, accreditation)
src/app/admin/                         Moderation queue (approve/reject pending listings)

src/components/ui/          Design-system primitives (Button, Card, Badge, form fields)
src/components/listings/    Listing-specific UI (cards, badges, NDA gate, auction bidding)
src/components/offers/      Offer terms form, negotiation actions, chain summaries
src/components/deals/       Deal-stage actions, rating form, print button
src/components/messages/    Message thread view
```

## Notes on the prototype simulations

- **Escrow**: a Stripe Checkout Session with `capture_method: manual` — the charge is
  authorized and held, not captured, until both parties confirm the IP assignment. Completing
  the deal captures the PaymentIntent (a destination charge to the seller's Connect account,
  minus a platform fee); cancelling a funded, uncompleted deal releases the hold instead.
- **IP assignment documents**: generated on-demand as a server-rendered, printable page —
  not produced by a real legal vendor, and the "signature" is a single mocked confirmation
  click rather than a real e-signature flow.
- **Investor accreditation**: a self-attested checkbox only (`User.accreditationStatus`), not
  real KYC.

None of the above should be presented to end users as legally binding in this build.
