"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Label, Input, Textarea, FieldError, FieldHint } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import type { OfferActionState } from "@/app/offers/actions";

const initialOfferActionState: OfferActionState = {};

export function OfferTermsForm({
  action,
  submitLabel,
  cashLabel = "Cash offer (USD, optional)",
  onCancel,
  compact = false,
}: {
  action: (state: OfferActionState, formData: FormData) => Promise<OfferActionState>;
  submitLabel: string;
  cashLabel?: string;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const [state, formAction] = useActionState(action, initialOfferActionState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <p className="rounded-lg border border-danger-500/30 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
          {state.message}
        </p>
      )}

      <div>
        <Label htmlFor="amount">{cashLabel}</Label>
        <Input id="amount" name="amount" type="number" min={0} step={1} placeholder="45000" />
        <FieldError>{errors.amount}</FieldError>
      </div>

      <div className={compact ? "grid grid-cols-3 gap-3" : "grid gap-4 sm:grid-cols-3"}>
        <div>
          <Label htmlFor="equityPercent">Equity %</Label>
          <Input id="equityPercent" name="equityPercent" type="number" min={0} max={100} step={0.5} />
          <FieldError>{errors.equityPercent}</FieldError>
        </div>
        <div>
          <Label htmlFor="royaltyPercent">Royalty %</Label>
          <Input id="royaltyPercent" name="royaltyPercent" type="number" min={0} max={100} step={0.5} />
          <FieldError>{errors.royaltyPercent}</FieldError>
        </div>
        <div>
          <Label htmlFor="royaltyTermMonths">Term (months)</Label>
          <Input id="royaltyTermMonths" name="royaltyTermMonths" type="number" min={1} step={1} />
          <FieldError>{errors.royaltyTermMonths}</FieldError>
        </div>
      </div>
      <FieldHint>Include a cash amount, equity, and/or a royalty — mix and match.</FieldHint>

      <div>
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea id="message" name="message" rows={3} placeholder="Any context for this offer…" />
        <FieldError>{errors.message}</FieldError>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Submitting…" : label}
    </Button>
  );
}
