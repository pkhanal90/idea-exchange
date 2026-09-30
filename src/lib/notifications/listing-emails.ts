import { prisma } from "@/lib/prisma";
import { sendMail, emailShell, siteUrl } from "@/lib/mailer";

interface PersonRef {
  name: string | null;
  email: string | null;
}

interface ListingRef {
  id: string;
  title: string;
}

function greet(person: PersonRef) {
  return person.name ? `Hi ${person.name.split(" ")[0]},` : "Hi there,";
}

// Sent to the seller the moment a listing enters PENDING_REVIEW — whether
// that's straight from the create form or via "submit for review" on a
// saved draft — so they aren't left wondering whether it went through.
export async function sendListingSubmittedEmail(seller: PersonRef, listing: ListingRef) {
  if (!seller.email) return;

  const dashboardUrl = siteUrl("/dashboard/seller");
  const greeting = greet(seller);
  const text = `${greeting}

Thanks for submitting "${listing.title}" to Idea Exchange. Our team reviews every submission before it goes live — we'll email you as soon as it's approved, or if we need any changes first.

Check its status any time: ${dashboardUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p>Thanks for submitting <strong>"${listing.title}"</strong> to Idea Exchange. Our team reviews every submission before it goes live — we'll email you as soon as it's approved, or if we need any changes first.</p>
  <p><a href="${dashboardUrl}">View its status on your seller dashboard →</a></p>`);

  await sendMail({ to: seller.email, subject: `We've got your submission: ${listing.title}`, text, html });
}

// Sent to every admin account the moment a listing enters PENDING_REVIEW —
// the moderation queue had no push signal at all before this, which is the
// most likely reason 23 real submissions sat unreviewed for weeks.
export async function sendNewSubmissionAdminAlert(listing: ListingRef, seller: PersonRef) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });
  const recipients = admins.map((a) => a.email).filter((e): e is string => Boolean(e));
  if (recipients.length === 0) return;

  const reviewUrl = siteUrl("/admin");
  const submittedBy = seller.name ?? seller.email ?? "unknown";
  const text = `A new listing is waiting for review.

Title: ${listing.title}
Submitted by: ${submittedBy}

Review it: ${reviewUrl}`;
  const html = emailShell(`
  <p>A new listing is waiting for review.</p>
  <p><strong>${listing.title}</strong><br/>Submitted by ${submittedBy}</p>
  <p><a href="${reviewUrl}">Review it in the moderation queue →</a></p>`);

  await Promise.all(
    recipients.map((to) =>
      sendMail({ to, subject: `New submission awaiting review: ${listing.title}`, text, html }),
    ),
  );
}

// Sent to the seller when an admin approves their listing.
export async function sendListingApprovedEmail(seller: PersonRef, listing: ListingRef) {
  if (!seller.email) return;

  const listingUrl = siteUrl(`/listings/${listing.id}`);
  const greeting = greet(seller);
  const text = `${greeting}

Good news — "${listing.title}" has been approved and is now live on Idea Exchange.

See it live: ${listingUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p>Good news — <strong>"${listing.title}"</strong> has been approved and is now live on Idea Exchange.</p>
  <p><a href="${listingUrl}">See it live →</a></p>`);

  await sendMail({ to: seller.email, subject: `Your listing is live: ${listing.title}`, text, html });
}

// Sent to the seller when an admin rejects their listing, including the
// reason so they know what to fix.
export async function sendListingRejectedEmail(
  seller: PersonRef,
  listing: ListingRef,
  rejectionNote: string,
) {
  if (!seller.email) return;

  const dashboardUrl = siteUrl("/dashboard/seller");
  const greeting = greet(seller);
  const text = `${greeting}

We've reviewed "${listing.title}" and it wasn't approved this time.

Reason: ${rejectionNote}

You can see the full note and make changes from your seller dashboard: ${dashboardUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p>We've reviewed <strong>"${listing.title}"</strong> and it wasn't approved this time.</p>
  <p><strong>Reason:</strong> ${rejectionNote}</p>
  <p><a href="${dashboardUrl}">View it on your seller dashboard →</a></p>`);

  await sendMail({ to: seller.email, subject: `An update on your submission: ${listing.title}`, text, html });
}
