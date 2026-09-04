"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";

function ActionButton({
  label,
  pendingLabel,
  variant = "primary",
}: {
  label: string;
  pendingLabel: string;
  variant?: "primary" | "outline" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function DealActionForm({
  action,
  label,
  pendingLabel,
  variant,
}: {
  action: () => Promise<void>;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "outline" | "danger";
}) {
  return (
    <form action={action}>
      <ActionButton label={label} pendingLabel={pendingLabel} variant={variant} />
    </form>
  );
}

export function CancelDealControl({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Cancel deal
      </Button>
    );
  }

  return (
    <form action={action} className="w-full space-y-2 rounded-lg border border-danger-500/30 bg-danger-50 p-3.5">
      <Textarea name="reason" rows={2} placeholder="Reason for cancelling (optional)" />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Never mind
        </Button>
        <ActionButton label="Confirm cancellation" pendingLabel="Cancelling…" variant="danger" />
      </div>
    </form>
  );
}
