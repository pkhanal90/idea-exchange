import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { previewPendingSellerRecipientsAction } from "@/app/admin/notify-pending-sellers/actions";
import { SendButton } from "@/app/admin/notify-pending-sellers/send-button";

// One-off internal tool — not linked from ADMIN_NAV_ITEMS. Delete this
// directory once the batch below has been sent.
export default async function NotifyPendingSellersPage() {
  const recipients = await previewPendingSellerRecipientsAction();

  return (
    <Container className="max-w-2xl py-10">
      <h1 className="text-xl font-semibold text-ink-900">Notify pending submitters</h1>
      <p className="mt-1 text-sm text-ink-500">
        Sends the "we're pausing while we get things ready" email to everyone with a listing
        still sitting in Pending Review (excluding admin/seed accounts). One email per person.
      </p>

      <Card className="mt-6">
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-ink-800">Recipients ({recipients.length})</p>
            <ul className="mt-2 space-y-1 text-sm text-ink-600">
              {recipients.map((email) => (
                <li key={email}>{email}</li>
              ))}
            </ul>
          </div>
          <SendButton recipientCount={recipients.length} />
        </CardContent>
      </Card>
    </Container>
  );
}
