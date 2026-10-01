"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitListingForReviewAction } from "@/app/dashboard/seller/actions";
import { Button } from "@/components/ui/button";
import { ConsentDocument } from "@/components/legal/consent-document";
import { X } from "lucide-react";

export function SubmitForReviewButton({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signedName, setSignedName] = useState("");
  const boundAction = submitListingForReviewAction.bind(null, listingId);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Submit for review
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h4 className="text-sm font-semibold text-ink-900">Review your submission consent</h4>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ink-400 hover:text-ink-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="mb-4 rounded-lg bg-ink-50 px-3.5 py-2.5 text-xs text-ink-500">
                This confirms you own this idea and consent to listing it publicly — it&apos;s
                separate from the NDA buyers will sign before seeing your full details.
              </p>
              <ConsentDocument
                listingTitle={listingTitle}
                listingId={listingId}
                submitterName={signedName || "You"}
                date={today}
              />
            </div>
            <form
              action={boundAction}
              className="space-y-3 border-t border-border px-5 py-4"
              onSubmit={() => setOpen(false)}
            >
              <label className="flex items-start gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-accent-600 focus:ring-accent-500"
                />
                I confirm I own this idea and consent to it being listed publicly on Idea
                Exchange.
              </label>
              <div>
                <label htmlFor="submit-review-signed-name" className="text-xs font-medium text-ink-500">
                  Type your full legal name to sign
                </label>
                <input
                  id="submit-review-signed-name"
                  name="signedName"
                  value={signedName}
                  onChange={(e) => setSignedName(e.target.value)}
                  placeholder="Full legal name"
                  className="mt-1 w-full rounded-lg border border-border px-3 py-1.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
              </div>
              <input type="hidden" name="consentAccepted" value={agreed ? "true" : ""} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <ConfirmButton disabled={!agreed || signedName.trim().length === 0} />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ConfirmButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={disabled || pending}>
      {pending ? "Submitting…" : "I Agree & Submit for Review"}
    </Button>
  );
}
