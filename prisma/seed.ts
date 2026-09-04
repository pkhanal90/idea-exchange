import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY);
const fromNow = (days: number) => new Date(Date.now() + days * DAY);

async function main() {
  // Wipe deal-flow content so this script can be re-run freely without
  // duplicating listings. Users are upserted below, so they (and their
  // logins) are left alone. Order matters — children before parents.
  await prisma.rating.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.savedListing.deleteMany();
  await prisma.ndaAcceptance.deleteMany();
  await prisma.listing.deleteMany();

  const admin = await prisma.user.upsert({
    where: { email: "admin@ideaexchange.test" },
    update: {},
    create: { email: "admin@ideaexchange.test", name: "Ada Moderator", role: "ADMIN" },
  });

  // ── Sellers ──────────────────────────────────────────────────────────
  const priya = await prisma.user.upsert({
    where: { email: "founder@ideaexchange.test" },
    update: {},
    create: {
      email: "founder@ideaexchange.test",
      name: "Priya Shah",
      role: "SELLER",
      company: "Shelved Ventures",
      title: "Founder",
      bio: "Former Uber Freight PM turned serial idea-generator. I prototype fast and sell what I won't build.",
    },
  });

  const marcus = await prisma.user.upsert({
    where: { email: "builder@ideaexchange.test" },
    update: {},
    create: {
      email: "builder@ideaexchange.test",
      name: "Marcus Lee",
      role: "SELLER",
      company: "Weekend Prototypes",
      title: "Indie Hacker",
      bio: "I ship an MVP every few months and sell off the ones that don't become my next full-time thing.",
    },
  });

  const elena = await prisma.user.upsert({
    where: { email: "elena@ideaexchange.test" },
    update: {},
    create: {
      email: "elena@ideaexchange.test",
      name: "Elena Torres",
      role: "SELLER",
      title: "Product Designer",
      bio: "I sketch out 2-3 concepts a year on nights and weekends; this is where the ones I won't pursue go.",
    },
  });

  const david = await prisma.user.upsert({
    where: { email: "david@ideaexchange.test" },
    update: {},
    create: {
      email: "david@ideaexchange.test",
      name: "David Osei",
      role: "SELLER",
      company: "Helix Labs Concepts",
      title: "Research Scientist",
      bio: "PhD in computational biology. I spin out applied-science and B2B ideas faster than I can fund them.",
    },
  });

  // ── Investors — a mix of VC firms and individual angels ────────────────
  const jordan = await prisma.user.upsert({
    where: { email: "investor@ideaexchange.test" },
    update: {},
    create: {
      email: "investor@ideaexchange.test",
      name: "Jordan Reyes",
      role: "INVESTOR",
      company: "Northbeam Capital",
      title: "Partner",
      bio: "Seed-stage checks into vertical SaaS and workflow automation, $25k-$250k.",
      accreditationStatus: "SELF_ATTESTED",
      accreditationAttestedAt: ago(120),
    },
  });

  const sam = await prisma.user.upsert({
    where: { email: "angel@ideaexchange.test" },
    update: {},
    create: {
      email: "angel@ideaexchange.test",
      name: "Sam Okafor",
      role: "INVESTOR",
      company: "Independent Angel",
      title: "Angel Investor",
      bio: "Ex-Stripe PM writing angel checks into fintech and developer tools.",
      accreditationStatus: "SELF_ATTESTED",
      accreditationAttestedAt: ago(200),
    },
  });

  const lena = await prisma.user.upsert({
    where: { email: "lena@ideaexchange.test" },
    update: {},
    create: {
      email: "lena@ideaexchange.test",
      name: "Lena Whitfield",
      role: "INVESTOR",
      company: "Meridian Ventures",
      title: "General Partner",
      bio: "Meridian backs pre-seed B2B SaaS and healthtech founders across the US.",
      accreditationStatus: "SELF_ATTESTED",
      accreditationAttestedAt: ago(90),
    },
  });

  const aiko = await prisma.user.upsert({
    where: { email: "aiko@ideaexchange.test" },
    update: {},
    create: {
      email: "aiko@ideaexchange.test",
      name: "Aiko Tanaka",
      role: "INVESTOR",
      company: "Catalyst Climate Partners",
      title: "Principal",
      bio: "Climate and energy infrastructure investing, from raw concept through Series A.",
      accreditationStatus: "SELF_ATTESTED",
      accreditationAttestedAt: ago(60),
    },
  });

  const raj = await prisma.user.upsert({
    where: { email: "raj@ideaexchange.test" },
    update: {},
    create: {
      email: "raj@ideaexchange.test",
      name: "Raj Patel",
      role: "INVESTOR",
      company: "Independent Angel",
      title: "Angel Investor",
      bio: "Operator-angel — I acquire (and sometimes personally build out) overlooked B2B ideas.",
      accreditationStatus: "UNSUBMITTED",
    },
  });

  // ── Listings ─────────────────────────────────────────────────────────
  const freightCopilot = await prisma.listing.create({
    data: {
      sellerId: priya.id,
      title: "AI co-pilot for freight brokers",
      teaserSummary:
        "An AI assistant that drafts freight quotes and carrier emails in seconds, built by a former logistics ops lead.",
      problemStatement:
        "Freight brokers spend hours per day manually pricing loads and writing near-identical carrier outreach emails, pulling from spreadsheets, past quotes, and gut instinct scattered across tools.",
      proposedSolution:
        "A browser extension that sits on top of existing TMS software, using historical lane data and current market rates to draft quotes and carrier emails a broker can approve in one click.",
      targetMarket:
        "18,000+ licensed freight brokerages in the US, concentrated in mid-market brokerages of 5-50 seats that lack in-house pricing tools.",
      tamEstimate: 480_000_000,
      monetizationPlan:
        "Seat-based SaaS at $89/broker/month, with a usage-based add-on for AI-drafted carrier outreach volume.",
      stage: "PROTOTYPE",
      category: "AI_ML",
      listingType: "FIXED_PRICE",
      askingPrice: 45_000,
      openToEquity: true,
      status: "PUBLISHED",
      publishedAt: ago(6),
      viewCount: 412,
    },
  });

  const payrollCompliance = await prisma.listing.create({
    data: {
      sellerId: priya.id,
      title: "Compliance-first payroll for home health agencies",
      teaserSummary:
        "Payroll and EVV-compliant scheduling built specifically for home health agencies operating across state lines.",
      problemStatement:
        "Home health agencies operating in multiple states struggle to keep payroll compliant with Electronic Visit Verification (EVV) mandates, leading to clawbacks and audit risk.",
      proposedSolution:
        "A payroll product that ingests EVV data directly from state-mandated aggregators and reconciles it against caregiver timesheets automatically before payroll runs.",
      targetMarket:
        "33,000 home health and home care agencies in the US, with the highest urgency in the 15 states with strict EVV enforcement.",
      tamEstimate: 210_000_000,
      monetizationPlan: "Per-caregiver monthly fee, tiered by agency size, plus an implementation fee.",
      stage: "CONCEPT",
      category: "HEALTHTECH",
      listingType: "AUCTION",
      startingBid: 15_000,
      reservePrice: 30_000,
      auctionEndsAt: fromNow(9),
      openToEquity: false,
      status: "PUBLISHED",
      publishedAt: ago(4),
      viewCount: 268,
    },
  });

  const climateLpMarketplace = await prisma.listing.create({
    data: {
      sellerId: marcus.id,
      title: "Micro-LP marketplace for climate infrastructure",
      teaserSummary:
        "A regulated marketplace letting accredited individuals co-invest alongside institutional LPs in climate infrastructure funds.",
      problemStatement:
        "Climate infrastructure funds want to diversify their LP base beyond a handful of institutions, but the operational overhead of onboarding many small checks is prohibitive.",
      proposedSolution:
        "A syndication layer that pools accredited individual checks into a single SPV per fund commitment, handling KYC, subscription docs, and capital calls.",
      targetMarket:
        "Climate infrastructure funds raising $50M-$500M vehicles, and the growing pool of accredited individuals seeking climate exposure.",
      tamEstimate: 1_200_000_000,
      monetizationPlan: "2% carry override on syndicated capital plus a flat SPV administration fee.",
      stage: "CONCEPT",
      category: "CLIMATE_ENERGY",
      listingType: "EQUITY_ROYALTY",
      openToEquity: true,
      status: "PUBLISHED",
      publishedAt: ago(11),
      viewCount: 191,
    },
  });

  const legalInbox = await prisma.listing.create({
    data: {
      sellerId: marcus.id,
      title: "Shared inbox for independent contract lawyers",
      teaserSummary:
        "A lightweight shared-inbox and matter tracker built for two-to-five person contract law shops.",
      problemStatement:
        "Small contract law practices juggle client intake across email, text, and paper without a system built for legal matter confidentiality and billing.",
      proposedSolution:
        "A shared inbox with matter-based threading, conflict checks on new intake, and time tracking built directly into every email reply.",
      targetMarket: "An estimated 60,000 small and solo contract law practices in the US.",
      monetizationPlan: "Flat monthly fee per practice, capped seats included.",
      stage: "TRACTION",
      category: "SAAS_B2B",
      listingType: "FIXED_PRICE",
      askingPrice: 120_000,
      openToEquity: true,
      status: "PUBLISHED",
      publishedAt: ago(2),
      viewCount: 87,
    },
  });

  await prisma.listing.create({
    data: {
      sellerId: priya.id,
      title: "Draft: campus meal-swap marketplace",
      teaserSummary: "Peer-to-peer meal swipe marketplace for university students.",
      problemStatement: "Unused meal swipes expire weekly on most campus dining plans.",
      proposedSolution: "A marketplace to swap or sell unused meal swipes between students.",
      targetMarket: "US university students on mandatory meal plans.",
      monetizationPlan: "Small transaction fee per swap.",
      stage: "CONCEPT",
      category: "MARKETPLACE",
      listingType: "FIXED_PRICE",
      askingPrice: 5_000,
      status: "DRAFT",
    },
  });

  await prisma.listing.create({
    data: {
      sellerId: elena.id,
      title: "Campus-to-career alumni mentorship marketplace",
      teaserSummary:
        "A marketplace connecting graduating seniors with alumni mentors in their target industry for paid, structured mentorship sprints.",
      problemStatement:
        "University career centers can't scale 1:1 mentorship, and alumni want to give back but have no structured, low-commitment way to do it.",
      proposedSolution:
        "A marketplace where alumni list paid 4-week mentorship sprints; career centers white-label it for their students.",
      targetMarket: "4,000+ US colleges and universities with active alumni relations budgets.",
      monetizationPlan: "20% marketplace take rate on mentorship sprint bookings.",
      stage: "CONCEPT",
      category: "EDTECH",
      listingType: "FIXED_PRICE",
      askingPrice: 8_000,
      openToEquity: true,
      status: "PENDING_REVIEW",
    },
  });

  const featureFlags = await prisma.listing.create({
    data: {
      sellerId: david.id,
      title: "Developer-first feature flag & experiment platform",
      teaserSummary:
        "A self-hosted-friendly feature flagging and experimentation platform built for teams that don't want to hand their data to a big vendor.",
      problemStatement:
        "Feature-flag platforms are priced for enterprise budgets and require sending product usage data to a third party — a non-starter for security-conscious teams.",
      proposedSolution:
        "An open-core feature flag and A/B testing SDK with a self-hosted control plane and a hosted tier for teams that want it managed.",
      targetMarket: "Series A-C engineering teams (50-500 engineers) currently paying for LaunchDarkly-class tools.",
      tamEstimate: 320_000_000,
      monetizationPlan: "Open-core: free self-hosted, paid hosted tier priced per monthly tracked user.",
      stage: "PROTOTYPE",
      category: "DEVTOOLS",
      listingType: "EQUITY_ROYALTY",
      openToEquity: true,
      status: "PUBLISHED",
      publishedAt: ago(8),
      viewCount: 156,
    },
  });

  const supplementEngine = await prisma.listing.create({
    data: {
      sellerId: elena.id,
      title: "Personalized supplement subscription engine",
      teaserSummary:
        "A quiz-driven personalization engine that any supplement DTC brand can white-label instead of building in-house.",
      problemStatement:
        "Supplement DTC brands all want a \"personalized quiz\" funnel like the category leaders, but building and maintaining one is a distraction from their actual product.",
      proposedSolution:
        "An embeddable quiz + recommendation engine with a brand-configurable rules dashboard, sold as a subscription to DTC brands.",
      targetMarket: "an estimated 3,000+ DTC supplement and vitamin brands doing $1M-$50M in revenue.",
      monetizationPlan: "Monthly SaaS fee tiered by brand revenue, plus a small per-quiz-completion fee.",
      stage: "CONCEPT",
      category: "ECOMMERCE",
      listingType: "FIXED_PRICE",
      askingPrice: 12_000,
      status: "PUBLISHED",
      publishedAt: ago(15),
      viewCount: 203,
    },
  });

  const asyncInterviews = await prisma.listing.create({
    data: {
      sellerId: elena.id,
      title: "Async video interviews for hourly hiring",
      teaserSummary:
        "A one-way video interview tool purpose-built for high-volume hourly hiring — retail, restaurants, warehouses.",
      problemStatement:
        "Hourly employers get hundreds of applicants per role and can't phone-screen them all; most existing async video tools are priced and built for white-collar hiring.",
      proposedSolution:
        "A dead-simple SMS-first async interview flow: applicants record answers from their phone, hiring managers review a swipeable queue.",
      targetMarket: "Regional and national multi-location retail, restaurant, and warehouse employers.",
      monetizationPlan: "Per-location monthly fee, volume-discounted for multi-location chains.",
      stage: "TRACTION",
      category: "CONSUMER_SOCIAL",
      listingType: "AUCTION",
      startingBid: 20_000,
      reservePrice: 40_000,
      auctionEndsAt: fromNow(5),
      openToEquity: false,
      status: "PUBLISHED",
      publishedAt: ago(3),
      viewCount: 334,
    },
  });

  const lenderCopilot = await prisma.listing.create({
    data: {
      sellerId: david.id,
      title: "Underwriting copilot for small-business lenders",
      teaserSummary:
        "An AI copilot that pre-fills small-business loan underwriting memos from bank statements and tax transcripts.",
      problemStatement:
        "Community banks and small-business lenders still build underwriting memos by hand from PDFs, adding days to every loan decision.",
      proposedSolution:
        "A copilot that ingests bank statements and tax transcripts, extracts the standard underwriting ratios, and drafts a memo a human underwriter edits and signs off on.",
      targetMarket: "5,000+ community banks and CDFIs originating small-business loans under $500k.",
      tamEstimate: 640_000_000,
      monetizationPlan: "Per-memo usage fee, with an annual platform license for higher-volume lenders.",
      stage: "PROTOTYPE",
      category: "FINTECH",
      listingType: "FIXED_PRICE",
      askingPrice: 65_000,
      openToEquity: true,
      status: "PUBLISHED",
      publishedAt: ago(9),
      viewCount: 298,
    },
  });

  const offlinePos = await prisma.listing.create({
    data: {
      sellerId: david.id,
      title: "Offline-first POS for market vendors",
      teaserSummary:
        "A point-of-sale app that works fully offline and syncs sales the moment a connection returns — built for open-air market vendors in emerging markets.",
      problemStatement:
        "Market vendors in areas with unreliable connectivity can't use most modern POS software, and fall back to cash-only, losing the ability to build a credit history.",
      proposedSolution:
        "A POS app that runs entirely offline on low-cost Android devices, queues transactions locally, and syncs to a ledger (and a credit-scoring pipeline) whenever connectivity returns.",
      targetMarket: "Open-air and semi-formal market vendors across Sub-Saharan Africa and Southeast Asia.",
      tamEstimate: 380_000_000,
      monetizationPlan: "Small per-transaction fee once synced, plus a lending referral fee.",
      stage: "PROTOTYPE",
      category: "FINTECH",
      listingType: "FIXED_PRICE",
      askingPrice: 58_000,
      openToEquity: true,
      status: "PUBLISHED", // flipped to UNDER_OFFER below once the deal is created
      publishedAt: ago(20),
      viewCount: 445,
    },
  });

  const warehouseSlotting = await prisma.listing.create({
    data: {
      sellerId: marcus.id,
      title: "Warehouse slotting optimizer",
      teaserSummary:
        "A computer-vision tool that reorders warehouse slotting based on pick-frequency heatmaps.",
      problemStatement: "Warehouses re-slot manually, quarterly at best, leaving pick paths inefficient.",
      proposedSolution: "Ceiling-mounted cameras feed a slotting optimizer that outputs a weekly re-slot plan.",
      targetMarket: "Third-party logistics warehouses over 50,000 sq ft.",
      tamEstimate: 90_000_000,
      monetizationPlan: "Hardware + SaaS bundle, annual contract.",
      stage: "TRACTION",
      category: "DEVTOOLS",
      listingType: "FIXED_PRICE",
      askingPrice: 250_000,
      status: "PUBLISHED", // flipped to SOLD below once the deal completes
      publishedAt: ago(45),
      viewCount: 891,
    },
  });

  // ── Auction bids ─────────────────────────────────────────────────────
  await prisma.bid.createMany({
    data: [
      { listingId: payrollCompliance.id, bidderId: lena.id, amount: 18_000, createdAt: ago(3) },
      { listingId: payrollCompliance.id, bidderId: raj.id, amount: 22_000, createdAt: ago(2) },
      { listingId: payrollCompliance.id, bidderId: aiko.id, amount: 25_500, createdAt: ago(1) },
      { listingId: asyncInterviews.id, bidderId: sam.id, amount: 22_000, createdAt: ago(2) },
      { listingId: asyncInterviews.id, bidderId: jordan.id, amount: 28_000, createdAt: ago(1) },
    ],
  });

  // ── Open negotiation (no deal yet) — buyer offer, seller counter, still pending ──
  const lenderOfferOne = await prisma.offer.create({
    data: {
      listingId: lenderCopilot.id,
      buyerId: sam.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "BUYER",
      status: "COUNTERED",
      amount: 50_000,
      message: "Love the wedge into community banks. Would want to keep you on for a 90-day transition.",
      createdAt: ago(4),
      respondedAt: ago(2),
    },
  });
  await prisma.offer.create({
    data: {
      listingId: lenderCopilot.id,
      buyerId: sam.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "SELLER",
      status: "PENDING",
      parentOfferId: lenderOfferOne.id,
      amount: 62_000,
      message: "Appreciate it — I'd want closer to the asking price given the underwriting logic already validated with two banks.",
      createdAt: ago(2),
    },
  });

  // ── Completed deal — the home page "success story" ──────────────────
  const warehouseOffer = await prisma.offer.create({
    data: {
      listingId: warehouseSlotting.id,
      buyerId: jordan.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "BUYER",
      status: "ACCEPTED",
      amount: 250_000,
      message: "Northbeam would like to acquire this outright and fold it into a portfolio company's ops tooling.",
      createdAt: ago(40),
      respondedAt: ago(38),
    },
  });
  const warehouseDeal = await prisma.deal.create({
    data: {
      listingId: warehouseSlotting.id,
      offerId: warehouseOffer.id,
      sellerId: marcus.id,
      buyerId: jordan.id,
      stage: "COMPLETE",
      finalAmount: 250_000,
      escrowFundedAt: ago(35),
      escrowReleasedAt: ago(30),
      ipAssignmentDocUrl: null,
      ipAssignmentGeneratedAt: ago(31),
      ipAssignmentSignedAt: ago(30),
      completedAt: ago(30),
      createdAt: ago(38),
    },
  });
  await prisma.listing.update({
    where: { id: warehouseSlotting.id },
    data: { status: "SOLD", soldAt: ago(30) },
  });
  await prisma.rating.createMany({
    data: [
      {
        dealId: warehouseDeal.id,
        raterId: marcus.id,
        rateeId: jordan.id,
        score: 5,
        comment: "Clean process end to end — funds moved fast once we agreed on price.",
        createdAt: ago(29),
      },
      {
        dealId: warehouseDeal.id,
        raterId: jordan.id,
        rateeId: marcus.id,
        score: 5,
        comment: "Exactly as described in diligence. Would work with Marcus again.",
        createdAt: ago(29),
      },
    ],
  });

  // ── Active deal in progress — home page / deal-room demo ────────────
  const posOfferOne = await prisma.offer.create({
    data: {
      listingId: offlinePos.id,
      buyerId: lena.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "BUYER",
      status: "COUNTERED",
      amount: 45_000,
      message: "Meridian would like to move fast on this — offline-first is a real gap in our portfolio's fintech thesis.",
      createdAt: ago(12),
      respondedAt: ago(10),
    },
  });
  const posOfferTwo = await prisma.offer.create({
    data: {
      listingId: offlinePos.id,
      buyerId: lena.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "SELLER",
      status: "ACCEPTED",
      parentOfferId: posOfferOne.id,
      amount: 52_000,
      message: "Can do $52k given the field validation already done — happy to also stay on as an advisor.",
      createdAt: ago(10),
      respondedAt: ago(9),
    },
  });
  const posDeal = await prisma.deal.create({
    data: {
      listingId: offlinePos.id,
      offerId: posOfferTwo.id,
      sellerId: david.id,
      buyerId: lena.id,
      stage: "IP_ASSIGNMENT_PENDING",
      finalAmount: 52_000,
      escrowFundedAt: ago(8),
      ipAssignmentGeneratedAt: ago(6),
      createdAt: ago(9),
    },
  });
  await prisma.deal.update({
    where: { id: posDeal.id },
    data: { ipAssignmentDocUrl: `/deals/${posDeal.id}/ip-assignment` },
  });
  await prisma.listing.update({
    where: { id: offlinePos.id },
    data: { status: "UNDER_OFFER" },
  });

  // ── Messaging demo ───────────────────────────────────────────────────
  const freightThread = await prisma.messageThread.create({
    data: { listingId: freightCopilot.id, sellerId: priya.id, buyerId: raj.id },
  });
  await prisma.message.createMany({
    data: [
      {
        threadId: freightThread.id,
        senderId: raj.id,
        body: "Hi Priya — really like the wedge here. Do you have any usage data from the brokers who piloted it?",
        createdAt: ago(5),
        readAt: ago(4),
      },
      {
        threadId: freightThread.id,
        senderId: priya.id,
        body: "Yes — 6 brokers piloted it for 3 weeks, avg. 40% reduction in time-to-quote. Happy to share the breakdown once you're through the NDA.",
        createdAt: ago(4),
        readAt: ago(4),
      },
      {
        threadId: freightThread.id,
        senderId: raj.id,
        body: "Just accepted the NDA. Also curious whether the TMS integration is a hard dependency or a nice-to-have.",
        createdAt: ago(3),
      },
    ],
  });

  // ── NDA acceptances + saved listings, for realistic dashboards ──────
  await prisma.ndaAcceptance.createMany({
    data: [
      { listingId: freightCopilot.id, userId: raj.id, acceptedAt: ago(3) },
      { listingId: freightCopilot.id, userId: jordan.id, acceptedAt: ago(6) },
      { listingId: featureFlags.id, userId: jordan.id, acceptedAt: ago(2) },
      { listingId: climateLpMarketplace.id, userId: aiko.id, acceptedAt: ago(9) },
      { listingId: lenderCopilot.id, userId: sam.id, acceptedAt: ago(4) },
      { listingId: legalInbox.id, userId: raj.id, acceptedAt: ago(1) },
    ],
  });
  await prisma.savedListing.createMany({
    data: [
      { userId: jordan.id, listingId: freightCopilot.id, createdAt: ago(6) },
      { userId: jordan.id, listingId: featureFlags.id, createdAt: ago(2) },
      { userId: aiko.id, listingId: climateLpMarketplace.id, createdAt: ago(9) },
      { userId: sam.id, listingId: lenderCopilot.id, createdAt: ago(4) },
      { userId: raj.id, listingId: legalInbox.id, createdAt: ago(1) },
    ],
  });

  // ── Demo account — one login with everything active, for walkthroughs ──
  // Real listings in every status as a seller, plus NDAs, saved listings,
  // and offers/deals as a buyer — all in one account so it can be demoed
  // end-to-end (e.g. to a VC) without switching logins.
  const demo = await prisma.user.upsert({
    where: { email: "demo@ideaexchange.test" },
    update: {},
    create: {
      email: "demo@ideaexchange.test",
      name: "Sasha Kim",
      role: "SELLER",
      company: "Kim Labs",
      title: "Founder",
      bio: "Demo account — every feature is pre-populated across both the seller and buyer dashboards.",
      accreditationStatus: "SELF_ATTESTED",
      accreditationAttestedAt: ago(10),
    },
  });

  await prisma.listing.create({
    data: {
      sellerId: demo.id,
      title: "Draft: expense-splitting app for touring bands",
      teaserSummary:
        "Splitwise, but built for tour accounting — per diems, merch cuts, and settlement in one place.",
      problemStatement:
        "Touring bands and crews track shared expenses in spreadsheets and group chats, leading to disputes at settlement time.",
      proposedSolution:
        "A mobile-first expense splitter with per-diem templates and one-tap settlement via ACH or crypto.",
      targetMarket: "An estimated 50,000 touring acts and their crews in the US annually.",
      monetizationPlan: "Small percentage fee on settled payouts.",
      stage: "CONCEPT",
      category: "CONSUMER_SOCIAL",
      listingType: "FIXED_PRICE",
      askingPrice: 6_000,
      status: "DRAFT",
    },
  });

  await prisma.listing.create({
    data: {
      sellerId: demo.id,
      title: "Peer benchmarking dashboard for startup finance teams",
      teaserSummary:
        "Lets startup finance teams anonymously benchmark burn, headcount, and margins against peers at the same stage.",
      problemStatement:
        "Startup finance teams have no reliable way to know if their burn or headcount ratio is normal for their stage and sector.",
      proposedSolution:
        "An opt-in, anonymized benchmarking pool startups contribute metrics to and query against peers.",
      targetMarket: "Series A-C startup finance and ops teams, and the VCs who advise them.",
      monetizationPlan: "Per-seat subscription for finance teams, free tier for VCs who refer portfolio companies.",
      stage: "CONCEPT",
      category: "FINTECH",
      listingType: "FIXED_PRICE",
      askingPrice: 20_000,
      openToEquity: true,
      status: "PENDING_REVIEW",
    },
  });

  const demoPublished = await prisma.listing.create({
    data: {
      sellerId: demo.id,
      title: "Field service scheduling assistant",
      teaserSummary:
        "An AI scheduler that reshuffles field-service technician routes in real time as jobs run long or get cancelled.",
      problemStatement:
        "Field-service dispatchers manually rejuggle technician schedules by phone every time a job runs over, wasting hours daily.",
      proposedSolution:
        "A scheduling assistant that ingests live job status and automatically reroutes and notifies technicians and customers.",
      targetMarket: "Regional HVAC, plumbing, and electrical service companies with 10-200 technicians.",
      tamEstimate: 275_000_000,
      monetizationPlan: "Per-technician monthly SaaS fee.",
      stage: "PROTOTYPE",
      category: "SAAS_B2B",
      listingType: "FIXED_PRICE",
      askingPrice: 38_000,
      openToEquity: true,
      status: "PUBLISHED",
      publishedAt: ago(7),
      viewCount: 122,
    },
  });

  const demoUnderOffer = await prisma.listing.create({
    data: {
      sellerId: demo.id,
      title: "Retail returns fraud detector",
      teaserSummary:
        "A model that flags likely-fraudulent return requests for online retailers before the refund is issued.",
      problemStatement:
        "Retailers lose billions annually to return fraud (wardrobing, empty-boxing) and can't screen returns fast enough to catch it.",
      proposedSolution:
        "A plug-in fraud-scoring model for return requests, trained on transaction and behavioral signals, that flags high-risk returns for manual review.",
      targetMarket: "Mid-market and enterprise e-commerce retailers processing 10,000+ returns a month.",
      tamEstimate: 190_000_000,
      monetizationPlan: "Per-return-request usage fee.",
      stage: "PROTOTYPE",
      category: "AI_ML",
      listingType: "FIXED_PRICE",
      askingPrice: 70_000,
      status: "UNDER_OFFER",
      publishedAt: ago(14),
      viewCount: 201,
    },
  });

  const demoSold = await prisma.listing.create({
    data: {
      sellerId: demo.id,
      title: "Carbon accounting API for logistics fleets",
      teaserSummary:
        "A drop-in API that turns fuel and telematics data into audit-ready Scope 1 emissions reports for logistics fleets.",
      problemStatement:
        "Mid-size logistics fleets need Scope 1 emissions reporting for customers and regulators but have no easy way to convert telematics data into an audit-ready report.",
      proposedSolution:
        "An API that ingests telematics and fuel-card data and outputs standardized, audit-ready emissions reports.",
      targetMarket: "Logistics and trucking fleets with 50-2,000 vehicles.",
      tamEstimate: 150_000_000,
      monetizationPlan: "Per-vehicle monthly API fee.",
      stage: "TRACTION",
      category: "CLIMATE_ENERGY",
      listingType: "FIXED_PRICE",
      askingPrice: 95_000,
      status: "PUBLISHED", // flipped to SOLD below once the deal completes
      publishedAt: ago(60),
      viewCount: 267,
    },
  });

  // Live negotiation on the demo seller's own published listing — Sam has
  // proposed and it's sitting PENDING, ready to accept/counter/decline live.
  await prisma.offer.create({
    data: {
      listingId: demoPublished.id,
      buyerId: sam.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "BUYER",
      status: "PENDING",
      amount: 32_000,
      message: "Would want to fold this into our fleet ops portfolio company. Open to a quick call this week.",
      createdAt: ago(1),
    },
  });

  // A deal already sitting at ESCROW_HELD, with no real Stripe payment
  // intent attached — the demo account can generate the IP assignment doc
  // and complete it live in two clicks, no real Stripe interaction needed.
  const demoUnderOfferOffer = await prisma.offer.create({
    data: {
      listingId: demoUnderOffer.id,
      buyerId: lena.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "BUYER",
      status: "ACCEPTED",
      amount: 70_000,
      message: "Meridian would like to move on this quickly — fraud tooling is a gap across a few portfolio companies.",
      createdAt: ago(6),
      respondedAt: ago(5),
    },
  });
  await prisma.deal.create({
    data: {
      listingId: demoUnderOffer.id,
      offerId: demoUnderOfferOffer.id,
      sellerId: demo.id,
      buyerId: lena.id,
      stage: "ESCROW_HELD",
      finalAmount: 70_000,
      escrowFundedAt: ago(4),
      createdAt: ago(5),
    },
  });

  // A fully completed deal on the demo account's own listing, with ratings
  // already exchanged — dated well before the Warehouse Slotting deal so it
  // doesn't take over that listing's spot as the home page's featured story.
  const demoSoldOffer = await prisma.offer.create({
    data: {
      listingId: demoSold.id,
      buyerId: aiko.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "BUYER",
      status: "ACCEPTED",
      amount: 95_000,
      message: "Catalyst would like to acquire this outright and staff it inside an existing portfolio company.",
      createdAt: ago(55),
      respondedAt: ago(53),
    },
  });
  const demoSoldDeal = await prisma.deal.create({
    data: {
      listingId: demoSold.id,
      offerId: demoSoldOffer.id,
      sellerId: demo.id,
      buyerId: aiko.id,
      stage: "COMPLETE",
      finalAmount: 95_000,
      escrowFundedAt: ago(50),
      escrowReleasedAt: ago(46),
      ipAssignmentGeneratedAt: ago(47),
      ipAssignmentSignedAt: ago(46),
      completedAt: ago(46),
      createdAt: ago(53),
    },
  });
  await prisma.listing.update({
    where: { id: demoSold.id },
    data: { status: "SOLD", soldAt: ago(46) },
  });
  await prisma.rating.createMany({
    data: [
      {
        dealId: demoSoldDeal.id,
        raterId: demo.id,
        rateeId: aiko.id,
        score: 5,
        comment: "Fast close, clear diligence questions, funds moved right on schedule.",
        createdAt: ago(45),
      },
      {
        dealId: demoSoldDeal.id,
        raterId: aiko.id,
        rateeId: demo.id,
        score: 5,
        comment: "Well-documented from the start — one of the smoothest acquisitions we've done on the platform.",
        createdAt: ago(45),
      },
    ],
  });

  // ── Demo account as a buyer ──────────────────────────────────────────
  await prisma.ndaAcceptance.createMany({
    data: [
      { listingId: freightCopilot.id, userId: demo.id, acceptedAt: ago(6) },
      { listingId: featureFlags.id, userId: demo.id, acceptedAt: ago(3) },
    ],
  });
  await prisma.savedListing.createMany({
    data: [
      { userId: demo.id, listingId: freightCopilot.id, createdAt: ago(6) },
      { userId: demo.id, listingId: asyncInterviews.id, createdAt: ago(2) },
    ],
  });

  // An open negotiation where the demo account is the buyer and the seller
  // has just countered — another live accept/decline/counter moment.
  const demoBuyerOfferOne = await prisma.offer.create({
    data: {
      listingId: legalInbox.id,
      buyerId: demo.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "BUYER",
      status: "COUNTERED",
      amount: 95_000,
      message: "Would want Marcus to stay on for a 60-day handoff.",
      createdAt: ago(3),
      respondedAt: ago(2),
    },
  });
  await prisma.offer.create({
    data: {
      listingId: legalInbox.id,
      buyerId: demo.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "SELLER",
      status: "PENDING",
      parentOfferId: demoBuyerOfferOne.id,
      amount: 112_000,
      message: "$95k is a bit light given the existing traction — could do $112k with a 60-day handoff included.",
      createdAt: ago(2),
    },
  });

  // A pure equity/royalty deal where the demo account is the buyer, parked
  // at the very first stage — walk the full agreement → escrow (skipped,
  // since it's equity-only) → IP assignment → complete pipeline live.
  const demoEquityOffer = await prisma.offer.create({
    data: {
      listingId: climateLpMarketplace.id,
      buyerId: demo.id,
      offerType: "EQUITY_ROYALTY",
      proposedBy: "BUYER",
      status: "ACCEPTED",
      equityPercent: 15,
      message: "Would take this on for 15% equity and run point on the SPV build-out myself.",
      createdAt: ago(2),
      respondedAt: ago(1),
    },
  });
  await prisma.deal.create({
    data: {
      listingId: climateLpMarketplace.id,
      offerId: demoEquityOffer.id,
      sellerId: marcus.id,
      buyerId: demo.id,
      stage: "AGREEMENT_PENDING",
      finalEquityPercent: 15,
      createdAt: ago(1),
    },
  });
  await prisma.listing.update({
    where: { id: climateLpMarketplace.id },
    data: { status: "UNDER_OFFER" },
  });

  // Messages both as seller (buyer reaching out on the demo's own listing)
  // and as buyer (messaging another seller).
  const demoSellerThread = await prisma.messageThread.create({
    data: { listingId: demoPublished.id, sellerId: demo.id, buyerId: sam.id },
  });
  await prisma.message.createMany({
    data: [
      {
        threadId: demoSellerThread.id,
        senderId: sam.id,
        body: "Sent an offer too — before that, how field-tested is the rerouting logic? Any live pilots?",
        createdAt: ago(2),
        readAt: ago(1),
      },
      {
        threadId: demoSellerThread.id,
        senderId: demo.id,
        body: "Two regional HVAC companies have been running it for about 6 weeks each — happy to share the reroute-accuracy numbers.",
        createdAt: ago(1),
      },
    ],
  });

  const demoBuyerThread = await prisma.messageThread.create({
    data: { listingId: legalInbox.id, sellerId: marcus.id, buyerId: demo.id },
  });
  await prisma.message.createMany({
    data: [
      {
        threadId: demoBuyerThread.id,
        senderId: demo.id,
        body: "Just sent an offer — also curious how sticky the existing law-firm customers are.",
        createdAt: ago(3),
        readAt: ago(3),
      },
      {
        threadId: demoBuyerThread.id,
        senderId: marcus.id,
        body: "Very — average tenure is just under 2 years, and it's the system of record for their billing so switching cost is high.",
        createdAt: ago(2),
      },
    ],
  });

  // ── Your real account — same "everything active" treatment as the demo
  // account above, so you can present from your own login instead of a
  // synthetic persona. Update, not create: this is the real user row
  // NextAuth already created when you first signed in.
  const you = await prisma.user.upsert({
    where: { email: "prawesh.khanal@gmail.com" },
    update: {
      name: "Prawesh Khanal",
      title: "Founder",
      accreditationStatus: "SELF_ATTESTED",
      accreditationAttestedAt: ago(10),
    },
    create: {
      email: "prawesh.khanal@gmail.com",
      name: "Prawesh Khanal",
      role: "SELLER",
      title: "Founder",
      accreditationStatus: "SELF_ATTESTED",
      accreditationAttestedAt: ago(10),
    },
  });

  await prisma.listing.create({
    data: {
      sellerId: you.id,
      title: "Draft: shared workspace booking tool for remote teams",
      teaserSummary:
        "Lets distributed teams book desks and meeting rooms at partner coworking spaces on the days they're in town.",
      problemStatement:
        "Remote-first companies fly people in for on-sites but have no easy way to book desks or rooms at coworking spaces near where their team already lives.",
      proposedSolution:
        "A booking layer across a network of partner coworking spaces, billed centrally to the employer instead of per-visit to each space.",
      targetMarket: "Remote-first companies with 50-2,000 employees spread across multiple cities.",
      monetizationPlan: "Markup on the wholesale day-pass rate, plus a small platform fee per booking.",
      stage: "CONCEPT",
      category: "SAAS_B2B",
      listingType: "FIXED_PRICE",
      askingPrice: 9_000,
      status: "DRAFT",
    },
  });

  await prisma.listing.create({
    data: {
      sellerId: you.id,
      title: "Contractor invoice factoring marketplace",
      teaserSummary:
        "Lets independent contractors sell unpaid invoices to individual accredited buyers for a fee, instead of waiting 30-90 days to get paid.",
      problemStatement:
        "Independent contractors and small agencies often wait 30-90 days on invoices, creating cash flow gaps that traditional factoring companies don't bother serving at small scale.",
      proposedSolution:
        "A marketplace where contractors list verified unpaid invoices at a discount, and individual buyers fund them for a return once the invoice is paid.",
      targetMarket: "An estimated 15 million US independent contractors and small agencies.",
      monetizationPlan: "Percentage fee on each funded invoice, charged to the contractor.",
      stage: "CONCEPT",
      category: "FINTECH",
      listingType: "FIXED_PRICE",
      askingPrice: 18_000,
      openToEquity: true,
      status: "PENDING_REVIEW",
    },
  });

  const yourPublished = await prisma.listing.create({
    data: {
      sellerId: you.id,
      title: "Smart irrigation controller for urban farms",
      teaserSummary:
        "A soil-sensor-driven irrigation controller purpose-built for small urban and vertical farms, not suburban lawns.",
      problemStatement:
        "Urban and vertical farm operators either over-water manually or retrofit consumer lawn-irrigation controllers that aren't built for dense planting or soil variation.",
      proposedSolution:
        "A compact controller with multi-zone soil sensors and an app that recommends (and can auto-run) watering schedules tuned for high-density urban growing.",
      targetMarket: "An estimated 3,000+ commercial urban and vertical farms in North America.",
      tamEstimate: 60_000_000,
      monetizationPlan: "Hardware unit sale plus an optional monitoring subscription.",
      stage: "PROTOTYPE",
      category: "HARDWARE_IOT",
      listingType: "FIXED_PRICE",
      askingPrice: 42_000,
      openToEquity: true,
      status: "PUBLISHED",
      publishedAt: ago(9),
      viewCount: 168,
    },
  });

  const yourUnderOffer = await prisma.listing.create({
    data: {
      sellerId: you.id,
      title: "Voice-based QA assistant for call centers",
      teaserSummary:
        "Scores 100% of support calls against a QA rubric automatically, instead of the 2% call centers manually review today.",
      problemStatement:
        "Call center QA teams manually review a tiny fraction of calls, so most agent coaching happens without real evidence of what's actually going wrong on calls.",
      proposedSolution:
        "A voice AI pipeline that transcribes and scores every call against a configurable QA rubric, flagging the ones that most need a human review.",
      targetMarket: "Outsourced call centers and in-house support teams with 50+ agents.",
      tamEstimate: 210_000_000,
      monetizationPlan: "Per-agent monthly SaaS fee.",
      stage: "PROTOTYPE",
      category: "AI_ML",
      listingType: "FIXED_PRICE",
      askingPrice: 60_000,
      status: "UNDER_OFFER",
      publishedAt: ago(16),
      viewCount: 224,
    },
  });

  const yourSold = await prisma.listing.create({
    data: {
      sellerId: you.id,
      title: "Subscription box logistics optimizer",
      teaserSummary:
        "Cuts subscription-box shipping costs by batching and re-sequencing fulfillment center pick lists around carrier rate breaks.",
      problemStatement:
        "Subscription box companies fulfill on a fixed monthly schedule, missing carrier rate breaks and zone-skipping opportunities that could cut shipping costs significantly.",
      proposedSolution:
        "A fulfillment-scheduling layer that re-sequences pick-and-pack timing and carrier selection around rate breaks, without changing the customer-facing ship date.",
      targetMarket: "Subscription box and recurring-ship e-commerce brands shipping 10,000+ units a month.",
      tamEstimate: 80_000_000,
      monetizationPlan: "Percentage of verified shipping cost savings.",
      stage: "TRACTION",
      category: "ECOMMERCE",
      listingType: "FIXED_PRICE",
      askingPrice: 85_000,
      status: "PUBLISHED", // flipped to SOLD below once the deal completes
      publishedAt: ago(65),
      viewCount: 301,
    },
  });

  // Live negotiation on your own published listing — Raj has proposed and
  // it's sitting PENDING, ready to accept/counter/decline live.
  await prisma.offer.create({
    data: {
      listingId: yourPublished.id,
      buyerId: raj.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "BUYER",
      status: "PENDING",
      amount: 30_000,
      message: "Would want to run this myself as an operator-angel bet. Can move fast on diligence.",
      createdAt: ago(1),
    },
  });

  // A deal already sitting at ESCROW_HELD, with no real Stripe payment
  // intent attached — generate the IP assignment doc and complete it live
  // in two clicks, no real Stripe interaction needed.
  const yourUnderOfferOffer = await prisma.offer.create({
    data: {
      listingId: yourUnderOffer.id,
      buyerId: jordan.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "BUYER",
      status: "ACCEPTED",
      amount: 60_000,
      message: "Northbeam would like to bring this in-house for a portfolio company's support org.",
      createdAt: ago(7),
      respondedAt: ago(6),
    },
  });
  await prisma.deal.create({
    data: {
      listingId: yourUnderOffer.id,
      offerId: yourUnderOfferOffer.id,
      sellerId: you.id,
      buyerId: jordan.id,
      stage: "ESCROW_HELD",
      finalAmount: 60_000,
      escrowFundedAt: ago(5),
      createdAt: ago(6),
    },
  });

  // A fully completed deal on your own listing, with ratings already
  // exchanged, dated well before the Warehouse Slotting deal so it doesn't
  // take over that listing's spot as the home page's featured story.
  const yourSoldOffer = await prisma.offer.create({
    data: {
      listingId: yourSold.id,
      buyerId: sam.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "BUYER",
      status: "ACCEPTED",
      amount: 85_000,
      message: "Would like to bring this in for a couple of DTC portfolio companies right away.",
      createdAt: ago(60),
      respondedAt: ago(58),
    },
  });
  const yourSoldDeal = await prisma.deal.create({
    data: {
      listingId: yourSold.id,
      offerId: yourSoldOffer.id,
      sellerId: you.id,
      buyerId: sam.id,
      stage: "COMPLETE",
      finalAmount: 85_000,
      escrowFundedAt: ago(56),
      escrowReleasedAt: ago(52),
      ipAssignmentGeneratedAt: ago(53),
      ipAssignmentSignedAt: ago(52),
      completedAt: ago(52),
      createdAt: ago(58),
    },
  });
  await prisma.listing.update({
    where: { id: yourSold.id },
    data: { status: "SOLD", soldAt: ago(52) },
  });
  await prisma.rating.createMany({
    data: [
      {
        dealId: yourSoldDeal.id,
        raterId: you.id,
        rateeId: sam.id,
        score: 5,
        comment: "Straightforward buyer, funds moved right on schedule.",
        createdAt: ago(51),
      },
      {
        dealId: yourSoldDeal.id,
        raterId: sam.id,
        rateeId: you.id,
        score: 5,
        comment: "Clear documentation and a fast close — no surprises during diligence.",
        createdAt: ago(51),
      },
    ],
  });

  // ── Your account as a buyer ──────────────────────────────────────────
  await prisma.ndaAcceptance.createMany({
    data: [
      { listingId: lenderCopilot.id, userId: you.id, acceptedAt: ago(5) },
      { listingId: legalInbox.id, userId: you.id, acceptedAt: ago(2) },
    ],
  });
  await prisma.savedListing.createMany({
    data: [
      { userId: you.id, listingId: payrollCompliance.id, createdAt: ago(5) },
      { userId: you.id, listingId: supplementEngine.id, createdAt: ago(2) },
    ],
  });

  // An open negotiation where you're the buyer and the seller (Elena) has
  // just countered — another live accept/decline/counter moment.
  const yourBuyerOfferOne = await prisma.offer.create({
    data: {
      listingId: supplementEngine.id,
      buyerId: you.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "BUYER",
      status: "COUNTERED",
      amount: 10_000,
      message: "Like the wedge — would want the quiz-scoring logic documented as part of the handoff.",
      createdAt: ago(3),
      respondedAt: ago(2),
    },
  });
  await prisma.offer.create({
    data: {
      listingId: supplementEngine.id,
      buyerId: you.id,
      offerType: "BUY_IT_NOW",
      proposedBy: "SELLER",
      status: "PENDING",
      parentOfferId: yourBuyerOfferOne.id,
      amount: 13_000,
      message: "Can do $13k — happy to document the scoring logic as part of the handoff.",
      createdAt: ago(2),
    },
  });

  // A pure equity/royalty deal where you're the buyer, parked at the very
  // first stage — walk the full agreement → escrow (skipped, since it's
  // equity-only) → IP assignment → complete pipeline live.
  const yourEquityOffer = await prisma.offer.create({
    data: {
      listingId: featureFlags.id,
      buyerId: you.id,
      offerType: "EQUITY_ROYALTY",
      proposedBy: "BUYER",
      status: "ACCEPTED",
      equityPercent: 12,
      message: "Would take this on for 12% equity and run the open-core rollout myself.",
      createdAt: ago(2),
      respondedAt: ago(1),
    },
  });
  await prisma.deal.create({
    data: {
      listingId: featureFlags.id,
      offerId: yourEquityOffer.id,
      sellerId: david.id,
      buyerId: you.id,
      stage: "AGREEMENT_PENDING",
      finalEquityPercent: 12,
      createdAt: ago(1),
    },
  });
  await prisma.listing.update({
    where: { id: featureFlags.id },
    data: { status: "UNDER_OFFER" },
  });

  // Messages both as seller (buyer reaching out on your own listing) and as
  // buyer (messaging another seller).
  const yourSellerThread = await prisma.messageThread.create({
    data: { listingId: yourPublished.id, sellerId: you.id, buyerId: raj.id },
  });
  await prisma.message.createMany({
    data: [
      {
        threadId: yourSellerThread.id,
        senderId: raj.id,
        body: "Sent an offer too — before that, how many sensor zones does one controller unit support?",
        createdAt: ago(2),
        readAt: ago(1),
      },
      {
        threadId: yourSellerThread.id,
        senderId: you.id,
        body: "Four zones per controller, and they daisy-chain if a farm needs more coverage.",
        createdAt: ago(1),
      },
    ],
  });

  const yourBuyerThread = await prisma.messageThread.create({
    data: { listingId: supplementEngine.id, sellerId: elena.id, buyerId: you.id },
  });
  await prisma.message.createMany({
    data: [
      {
        threadId: yourBuyerThread.id,
        senderId: you.id,
        body: "Just sent an offer — how many brands have run the quiz funnel so far?",
        createdAt: ago(3),
        readAt: ago(3),
      },
      {
        threadId: yourBuyerThread.id,
        senderId: elena.id,
        body: "Three pilot brands, about 40,000 quiz completions total across them.",
        createdAt: ago(2),
      },
    ],
  });

  console.log("Seeded users:", {
    admin: admin.email,
    sellers: [priya.email, marcus.email, elena.email, david.email],
    investors: [jordan.email, sam.email, lena.email, aiko.email, raj.email],
    demo: demo.email,
    you: you.email,
  });
  console.log("Seeded 22 listings — 3 completed deals, 5 active deals, 5 open negotiations, 2 auctions.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
