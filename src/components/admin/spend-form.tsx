"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addSpendAction, type SpendFormState } from "@/app/admin/acquisition/actions";
import { FieldError, Input, Label, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { LINK_BUILDER_SOURCES } from "@/lib/acquisition";
import { Plus } from "lucide-react";

const initialState: SpendFormState = {};

export function SpendForm({ today }: { today: string }) {
  const [state, formAction] = useActionState(addSpendAction, initialState);

  return (
    <form action={formAction} className="rounded-lg border border-border bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label htmlFor="spend-source">Channel</Label>
          <Select id="spend-source" name="source" defaultValue="tiktok">
            {LINK_BUILDER_SOURCES.map((s) => (
              <option key={s.source} value={s.source}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="spend-campaign">Campaign (optional)</Label>
          <Input id="spend-campaign" name="campaign" placeholder="e.g. launch-day-1" />
        </div>
        <div>
          <Label htmlFor="spend-amount">Amount ($)</Label>
          <Input id="spend-amount" name="amount" inputMode="decimal" placeholder="25.00" />
        </div>
        <div>
          <Label htmlFor="spend-date">Date</Label>
          <Input id="spend-date" name="spentOn" type="date" defaultValue={today} max={today} />
        </div>
        <div>
          <Label htmlFor="spend-note">Note (optional)</Label>
          <Input id="spend-note" name="note" maxLength={200} placeholder="e.g. boosted reel" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <SaveButton />
        <FieldError>{state.error}</FieldError>
        {state.saved && <p className="text-sm text-success-700">Saved.</p>}
      </div>
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Plus className="h-3.5 w-3.5" />
      {pending ? "Saving…" : "Add spend"}
    </Button>
  );
}
