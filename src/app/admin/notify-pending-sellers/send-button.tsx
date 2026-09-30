"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  sendPendingSellerNotificationAction,
  sendTestNotificationAction,
  type SendNotificationResult,
} from "@/app/admin/notify-pending-sellers/actions";

export function SendButton({ recipientCount }: { recipientCount: number }) {
  const [result, setResult] = useState<SendNotificationResult | null>(null);
  const [testResult, setTestResult] = useState<SendNotificationResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [testPending, startTestTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div>
        <Button
          variant="outline"
          onClick={() => startTestTransition(async () => setTestResult(await sendTestNotificationAction()))}
          disabled={testPending}
        >
          {testPending ? "Sending test…" : "Send test to my email"}
        </Button>
        {testResult && (
          <p className="mt-2 text-sm text-ink-500">
            {testResult.sentTo.length > 0
              ? `Test sent to ${testResult.sentTo[0]} — check your inbox.`
              : `Failed: ${testResult.failed[0]?.error}`}
          </p>
        )}
      </div>

      <Button
        onClick={() => startTransition(async () => setResult(await sendPendingSellerNotificationAction()))}
        disabled={pending || result !== null || recipientCount === 0}
      >
        {pending ? "Sending…" : result ? "Sent" : `Send to ${recipientCount} people`}
      </Button>

      {result && (
        <div className="mt-4 space-y-2 rounded-lg border border-border p-4 text-sm">
          <p>
            Sent from: <span className="font-mono text-xs">{result.fromAddress}</span>
          </p>
          <p className="text-success-700">Delivered to {result.sentTo.length}: {result.sentTo.join(", ")}</p>
          {result.failed.length > 0 && (
            <p className="text-danger-500">
              Failed for {result.failed.length}:{" "}
              {result.failed.map((f) => `${f.email} (${f.error})`).join("; ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
