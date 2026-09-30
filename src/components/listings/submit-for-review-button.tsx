"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitListingForReviewAction } from "@/app/dashboard/seller/actions";
import { Button } from "@/components/ui/button";
import { NdaDocument } from "@/components/legal/nda-document";
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
              <h4 className="text-sm font-semibold text-ink-900">Review your listing&apos;s NDA</h4>
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
                This is the confidentiality agreement every buyer will be asked to accept before
                seeing this listing&apos;s full details.
              </p>
              <NdaDocument
                listingTitle={listingTitle}
                listingId={listingId}
                disclosingParty="You (the seller)"
                receivingParty="Each buyer who requests full access"
                date={today}
              />
            </div>
            <form
              action={boundAction}
              className="border-t border-border px-5 py-4"
              onSubmit={() => setOpen(false)}
            >
              <label className="flex items-start gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-accent-600 focus:ring-accent-500"
                />
                I&apos;ve reviewed this NDA and want it to protect my listing.
              </label>
              <input type="hidden" name="ndaAcknowledged" value={agreed ? "true" : ""} />
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <ConfirmButton disabled={!agreed} />
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
