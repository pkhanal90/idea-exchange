"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { acceptNdaAction } from "@/app/listings/[id]/actions";
import { Button } from "@/components/ui/button";
import { NDA_TERMS } from "@/lib/constants";
import { Lock, X } from "lucide-react";

export function NdaGate({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const boundAction = acceptNdaAction.bind(null, listingId);

  return (
    <div className="rounded-xl border border-dashed border-border bg-ink-50 p-8 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 text-white">
        <Lock className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-ink-900">
        Full details are NDA-protected
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-500">
        Accept a mutual NDA to unlock the problem statement, proposed solution, target
        market sizing, monetization plan, and any pitch deck for this listing.
      </p>
      <Button className="mt-5" onClick={() => setOpen(true)}>
        Accept NDA to view full details
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
              <h4 className="text-sm font-semibold text-ink-900">
                Mutual Non-Disclosure Agreement
              </h4>
              <button
                onClick={() => setOpen(false)}
                className="text-ink-400 hover:text-ink-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 text-left text-sm leading-relaxed text-ink-600">
              {NDA_TERMS}
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
                I have read and agree to the terms of this NDA.
              </label>
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <AgreeButton disabled={!agreed} />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AgreeButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={disabled || pending}>
      {pending ? "Unlocking…" : "I Agree & Continue"}
    </Button>
  );
}
