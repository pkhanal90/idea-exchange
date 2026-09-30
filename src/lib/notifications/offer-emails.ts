import { sendMail, emailShell, siteUrl } from "@/lib/mailer";
import { formatCurrency } from "@/lib/utils";

interface PersonRef {
  name: string | null;
  email: string | null;
}

interface ListingRef {
  id: string;
  title: string;
}

interface OfferTermsRef {
  amount: unknown;
  equityPercent: unknown;
  royaltyPercent: unknown;
  royaltyTermMonths: number | null;
}

function greet(person: PersonRef) {
  return person.name ? `Hi ${person.name.split(" ")[0]},` : "Hi there,";
}

// Plain-text equivalent of <OfferTermsSummary />, for email bodies.
function formatOfferTerms(offer: OfferTermsRef): string {
  const parts: string[] = [];
  if (offer.amount) parts.push(formatCurrency(offer.amount as never));
  if (offer.equityPercent) parts.push(`${Number(offer.equityPercent)}% equity`);
  if (offer.royaltyPercent) {
    parts.push(
      `${Number(offer.royaltyPercent)}% royalty${offer.royaltyTermMonths ? ` for ${offer.royaltyTermMonths}mo` : ""}`,
    );
  }
  return parts.length > 0 ? parts.join(" + ") : "Terms only";
}

// Sent to the seller when a buyer makes a brand-new offer (not a counter).
export async function sendNewOfferEmail(seller: PersonRef, listing: ListingRef, offer: OfferTermsRef, offerId: string) {
  if (!seller.email) return;

  const offerUrl = siteUrl(`/offers/${offerId}`);
  const terms = formatOfferTerms(offer);
  const greeting = greet(seller);
  const text = `${greeting}

You've received a new offer on "${listing.title}": ${terms}.

Review and respond: ${offerUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p>You've received a new offer on <strong>"${listing.title}"</strong>: <strong>${terms}</strong>.</p>
  <p><a href="${offerUrl}">Review and respond →</a></p>`);

  await sendMail({ to: seller.email, subject: `New offer on ${listing.title}`, text, html });
}

// Sent to whoever proposed the offer/counter that just got countered back.
export async function sendOfferCounteredEmail(
  proposer: PersonRef,
  listing: ListingRef,
  newOffer: OfferTermsRef,
  newOfferId: string,
) {
  if (!proposer.email) return;

  const offerUrl = siteUrl(`/offers/${newOfferId}`);
  const terms = formatOfferTerms(newOffer);
  const greeting = greet(proposer);
  const text = `${greeting}

Your offer on "${listing.title}" received a counter: ${terms}.

Review and respond: ${offerUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p>Your offer on <strong>"${listing.title}"</strong> received a counter: <strong>${terms}</strong>.</p>
  <p><a href="${offerUrl}">Review and respond →</a></p>`);

  await sendMail({ to: proposer.email, subject: `Countered: your offer on ${listing.title}`, text, html });
}

// Sent to whoever proposed the offer that just got declined.
export async function sendOfferDeclinedEmail(proposer: PersonRef, listing: ListingRef) {
  if (!proposer.email) return;

  const listingUrl = siteUrl(`/listings/${listing.id}`);
  const greeting = greet(proposer);
  const text = `${greeting}

Your offer on "${listing.title}" was declined.

See the listing: ${listingUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p>Your offer on <strong>"${listing.title}"</strong> was declined.</p>
  <p><a href="${listingUrl}">See the listing →</a></p>`);

  await sendMail({ to: proposer.email, subject: `Your offer on ${listing.title} was declined`, text, html });
}

// Sent to the seller when the buyer withdraws their own pending offer.
export async function sendOfferWithdrawnEmail(seller: PersonRef, listing: ListingRef) {
  if (!seller.email) return;

  const listingUrl = siteUrl(`/listings/${listing.id}`);
  const greeting = greet(seller);
  const text = `${greeting}

A buyer withdrew their offer on "${listing.title}".

See the listing: ${listingUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p>A buyer withdrew their offer on <strong>"${listing.title}"</strong>.</p>
  <p><a href="${listingUrl}">See the listing →</a></p>`);

  await sendMail({ to: seller.email, subject: `An offer on ${listing.title} was withdrawn`, text, html });
}

// Sent to the seller when a new highest bid lands on their auction.
export async function sendNewBidEmail(seller: PersonRef, listing: ListingRef, amount: unknown) {
  if (!seller.email) return;

  const listingUrl = siteUrl(`/listings/${listing.id}`);
  const formatted = formatCurrency(amount as never);
  const greeting = greet(seller);
  const text = `${greeting}

A new bid of ${formatted} just came in on your auction "${listing.title}".

See the listing: ${listingUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p>A new bid of <strong>${formatted}</strong> just came in on your auction <strong>"${listing.title}"</strong>.</p>
  <p><a href="${listingUrl}">See the listing →</a></p>`);

  await sendMail({ to: seller.email, subject: `New bid on ${listing.title}: ${formatted}`, text, html });
}

// Sent to both buyer and seller the moment an offer is accepted and a deal
// opens — regardless of which side triggered the acceptance (a negotiated
// accept, or a seller accepting the top auction bid), both parties need to
// know the deal room is now open.
export async function sendDealStartedEmail(person: PersonRef, listing: ListingRef, dealId: string) {
  if (!person.email) return;

  const dealUrl = siteUrl(`/deals/${dealId}`);
  const greeting = greet(person);
  const text = `${greeting}

An offer on "${listing.title}" was accepted — the deal room is now open.

Go to the deal room: ${dealUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p>An offer on <strong>"${listing.title}"</strong> was accepted — the deal room is now open.</p>
  <p><a href="${dealUrl}">Go to the deal room →</a></p>`);

  await sendMail({ to: person.email, subject: `Deal started: ${listing.title}`, text, html });
}
