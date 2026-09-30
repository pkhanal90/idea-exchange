import { sendMail, emailShell, siteUrl } from "@/lib/mailer";

interface PersonRef {
  name: string | null;
  email: string | null;
}

interface ListingRef {
  title: string;
}

const PREVIEW_MAX_LENGTH = 300;

function truncate(body: string) {
  if (body.length <= PREVIEW_MAX_LENGTH) return body;
  return `${body.slice(0, PREVIEW_MAX_LENGTH)}…`;
}

// Sent to the other party in a thread whenever a message is sent — a seller
// or buyer otherwise has no way to know a conversation moved forward unless
// they happen to revisit the site.
export async function sendNewMessageEmail(
  recipient: PersonRef,
  sender: PersonRef,
  listing: ListingRef,
  threadId: string,
  body: string,
) {
  if (!recipient.email) return;

  const threadUrl = siteUrl(`/messages/${threadId}`);
  const senderName = sender.name ?? sender.email ?? "Someone";
  const greeting = recipient.name ? `Hi ${recipient.name.split(" ")[0]},` : "Hi there,";
  const preview = truncate(body);
  const text = `${greeting}

${senderName} sent you a message about "${listing.title}":

"${preview}"

Reply: ${threadUrl}

— The Idea Exchange Team`;
  const html = emailShell(`
  <p>${greeting}</p>
  <p>${senderName} sent you a message about <strong>"${listing.title}"</strong>:</p>
  <p style="border-left: 3px solid #e2e5eb; padding-left: 12px; color: #414a68;">${preview}</p>
  <p><a href="${threadUrl}">Reply →</a></p>`);

  await sendMail({ to: recipient.email, subject: `New message from ${senderName}: ${listing.title}`, text, html });
}
