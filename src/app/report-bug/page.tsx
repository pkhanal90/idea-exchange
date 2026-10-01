import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldHint } from "@/components/ui/form";
import { submitBugReportAction } from "@/app/report-bug/actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Let us know what happened before submitting.",
  invalid_email: "Enter a valid email address, or leave it blank.",
  message_too_long: "Please keep each field under 5,000 characters.",
  rate_limited: "Too many reports sent recently. Wait a few minutes and try again.",
};

interface ReportBugPageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function ReportBugPage({ searchParams }: ReportBugPageProps) {
  const { error, success } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-xl font-semibold text-ink-900">Report a bug</h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Found something broken? Tell us what happened and we&apos;ll look into it.
      </p>

      <Card className="mt-8">
        <CardContent className="space-y-5">
          {success === "1" && (
            <p className="rounded-lg border border-success-500/30 bg-success-50 px-3.5 py-2.5 text-sm text-success-700">
              Thanks for the report — our team will take a look.
            </p>
          )}
          {error && (
            <p className="rounded-lg border border-danger-500/30 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
              {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
            </p>
          )}

          <form action={submitBugReportAction} className="space-y-4">
            <div>
              <Label htmlFor="whatHappened">What happened?</Label>
              <Textarea
                id="whatHappened"
                name="whatHappened"
                required
                maxLength={5000}
                placeholder="Describe what went wrong..."
              />
            </div>
            <div>
              <Label htmlFor="pageUrl">Page or URL (optional)</Label>
              <Input
                id="pageUrl"
                name="pageUrl"
                placeholder="https://www.ideaexchange.io/listings/..."
              />
            </div>
            <div>
              <Label htmlFor="stepsToReproduce">Steps to reproduce (optional)</Label>
              <Textarea
                id="stepsToReproduce"
                name="stepsToReproduce"
                maxLength={5000}
                placeholder="1. Click... 2. Then..."
              />
            </div>
            <div>
              <Label htmlFor="email">Your email (optional)</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" />
              <FieldHint>So we can follow up if we have questions.</FieldHint>
            </div>
            <Button type="submit" variant="primary" className="w-full">
              Submit report
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
