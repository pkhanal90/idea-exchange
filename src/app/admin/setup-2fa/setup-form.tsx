"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/form";
import { confirmTwoFactorSetupAction, type SetupTwoFactorState } from "@/app/admin/setup-2fa/actions";

const initialState: SetupTwoFactorState = {};

export function SetupTwoFactorForm({ secret }: { secret: string }) {
  const [state, formAction] = useActionState(confirmTwoFactorSetupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="secret" value={secret} />
      <div>
        <Label htmlFor="code">6-digit code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          required
          className="font-mono-nums text-center text-lg tracking-[0.4em]"
        />
        <FieldError>{state.error}</FieldError>
      </div>
      <ConfirmButton />
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Verifying…" : "Confirm and enable"}
    </Button>
  );
}
