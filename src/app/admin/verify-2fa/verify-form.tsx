"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/form";
import { verifyTwoFactorAction, type VerifyTwoFactorState } from "@/app/admin/verify-2fa/actions";

const initialState: VerifyTwoFactorState = {};

export function VerifyTwoFactorForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction] = useActionState(verifyTwoFactorAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
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
          autoFocus
          className="font-mono-nums text-center text-lg tracking-[0.4em]"
        />
        <FieldError>{state.error}</FieldError>
      </div>
      <VerifyButton />
    </form>
  );
}

function VerifyButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Verifying…" : "Verify"}
    </Button>
  );
}
