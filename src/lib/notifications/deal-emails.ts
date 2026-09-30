import { sendMail, emailShell, siteUrl } from "@/lib/mailer";
import { formatCurrency } from "@/lib/utils";

interface PersonRef {
  name: string | null;
  email: string | null;
}

interface ListingRef {
  title: string;
}

function greet(person: PersonRef) {
  return person.name ? `Hi ${person.name.split(" ")[0]},` : "Hi there,";
}

// Sent to both parties when the deal moves to ESCROW_PENDING — i.e. terms
// are agreed and, for a cash deal, the buyer now needs to fund escrow.
export async function sendEscrowPendingEmail(
  recipient: PersonRef,
  listing: ListingRef,
  dealId: string,
  amount: unknown,
) {
  if (!recipient.email) return;

  const dealUrl = siteUrl(`/deals/${dealId}`);
  const formatted = formatCurrency(amount as never);
  const greeting = greet(recipient);
  const text = `${greeting}

Terms are agreed on "${listing.title}" — next, the buyer needs to fund escrow (${formatted}).

Go to the deal room: ${dealUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p>Terms are agreed on <strong>"${listing.title}"</strong> — next, the buyer needs to fund escrow (<strong>${formatted}</strong>).</p>
  <p><a href="${dealUrl}">Go to the deal room →</a></p>`);

  await sendMail({ to: recipient.email, subject: `Escrow needed: ${listing.title}`, text, html });
}

// Sent to both parties when the deal moves to ESCROW_HELD — either the
// buyer's payment was captured into escrow, or (for a pure equity/royalty
// deal with no cash component) terms were simply confirmed.
export async function sendEscrowHeldEmail(
  recipient: PersonRef,
  listing: ListingRef,
  dealId: string,
  hasCash: boolean,
) {
  if (!recipient.email) return;

  const dealUrl = siteUrl(`/deals/${dealId}`);
  const greeting = greet(recipient);
  const statusLine = hasCash
    ? `Escrow is funded on "${listing.title}" — next, the IP assignment document.`
    : `Terms are confirmed on "${listing.title}" (no cash held in escrow) — next, the IP assignment document.`;
  const text = `${greeting}

${statusLine}

Go to the deal room: ${dealUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p>${statusLine}</p>
  <p><a href="${dealUrl}">Go to the deal room →</a></p>`);

  await sendMail({ to: recipient.email, subject: `Escrow funded: ${listing.title}`, text, html });
}

// Sent to both parties when the IP assignment document is generated and
// ready to review/sign.
export async function sendIpAssignmentReadyEmail(recipient: PersonRef, listing: ListingRef, dealId: string) {
  if (!recipient.email) return;

  const dealUrl = siteUrl(`/deals/${dealId}`);
  const greeting = greet(recipient);
  const text = `${greeting}

The IP assignment document for "${listing.title}" is ready to review.

Go to the deal room: ${dealUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p>The IP assignment document for <strong>"${listing.title}"</strong> is ready to review.</p>
  <p><a href="${dealUrl}">Go to the deal room →</a></p>`);

  await sendMail({ to: recipient.email, subject: `IP assignment ready: ${listing.title}`, text, html });
}

// Sent to both parties when the deal is marked complete — ownership has
// transferred and escrow (if any) has been released.
export async function sendDealCompletedEmail(recipient: PersonRef, listing: ListingRef, dealId: string) {
  if (!recipient.email) return;

  const dealUrl = siteUrl(`/deals/${dealId}`);
  const greeting = greet(recipient);
  const text = `${greeting}

"${listing.title}" is complete — ownership has transferred. Take a moment to rate the other party.

Go to the deal room: ${dealUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p><strong>"${listing.title}"</strong> is complete — ownership has transferred. Take a moment to rate the other party.</p>
  <p><a href="${dealUrl}">Go to the deal room →</a></p>`);

  await sendMail({ to: recipient.email, subject: `Deal complete: ${listing.title}`, text, html });
}

// Sent to both parties when the deal is cancelled, with the reason given.
export async function sendDealCancelledEmail(
  recipient: PersonRef,
  listing: ListingRef,
  dealId: string,
  reason: string,
) {
  if (!recipient.email) return;

  const dealUrl = siteUrl(`/deals/${dealId}`);
  const greeting = greet(recipient);
  const text = `${greeting}

The deal on "${listing.title}" was cancelled.

Reason: ${reason}

See the deal room: ${dealUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p>The deal on <strong>"${listing.title}"</strong> was cancelled.</p>
  <p><strong>Reason:</strong> ${reason}</p>
  <p><a href="${dealUrl}">See the deal room →</a></p>`);

  await sendMail({ to: recipient.email, subject: `Deal cancelled: ${listing.title}`, text, html });
}
