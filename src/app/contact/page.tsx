import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import { submitContactAction } from "@/app/contact/actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Please fill in your name, email, and a message.",
  invalid_email: "Enter a valid email address.",
  message_too_long: "That message is too long — please keep it under 5,000 characters.",
  rate_limited: "Too many messages sent recently. Wait a few minutes and try again.",
};

interface ContactPageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { error, success } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-xl font-semibold text-ink-900">Contact us</h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Questions, partnership inquiries, or anything else — we read every message.
      </p>

      <Card className="mt-8">
        <CardContent className="space-y-5">
          {success === "1" && (
            <p className="rounded-lg border border-success-500/30 bg-success-50 px-3.5 py-2.5 text-sm text-success-700">
              Thanks for reaching out — we&apos;ll get back to you soon.
            </p>
          )}
          {error && (
            <p className="rounded-lg border border-danger-500/30 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
              {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
            </p>
          )}

          <form action={submitContactAction} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Jane Doe" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                required
                maxLength={5000}
                placeholder="How can we help?"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full">
              Send message
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
