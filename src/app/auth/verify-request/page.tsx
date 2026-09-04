import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { MailCheck } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <Container className="flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-sm shadow-accent-600/30">
        <MailCheck className="h-5.5 w-5.5" />
      </span>
      <h1 className="mt-5 text-xl font-semibold text-ink-900">Check your email</h1>
      <Card className="mt-6">
        <CardContent>
          <p className="text-sm text-ink-500">
            We sent you a sign-in link. If SMTP isn&apos;t configured in this environment yet,
            the link is printed to the server console instead — check your terminal.
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
