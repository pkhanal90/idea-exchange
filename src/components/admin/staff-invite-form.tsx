"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { inviteStaffAction, type InviteStaffState } from "@/app/admin/staff/actions";
import { Label, Input, Select, FieldError } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ADMIN_ROLE_LABELS, ADMIN_ROLE_DESCRIPTIONS } from "@/lib/constants";
import { UserPlus } from "lucide-react";

const initialState: InviteStaffState = {};

export function StaffInviteForm() {
  const [state, formAction] = useActionState(inviteStaffAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="new-hire@company.com" />
        <FieldError>{state.error}</FieldError>
      </div>
      <div className="sm:w-56">
        <Label htmlFor="adminRole">Role</Label>
        <Select id="adminRole" name="adminRole" defaultValue="MODERATOR">
          {Object.entries(ADMIN_ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value} title={ADMIN_ROLE_DESCRIPTIONS[value as keyof typeof ADMIN_ROLE_DESCRIPTIONS]}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <InviteButton />
    </form>
  );
}

function InviteButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} className="sm:mb-0.5">
      <UserPlus className="h-3.5 w-3.5" />
      {pending ? "Adding…" : "Add staff member"}
    </Button>
  );
}
