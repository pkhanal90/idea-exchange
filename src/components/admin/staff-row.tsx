"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  changeStaffRoleAction,
  revokeStaffAccessAction,
  restoreStaffAccessAction,
} from "@/app/admin/staff/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { initials, formatDate, cn } from "@/lib/utils";
import { avatarGradient } from "@/lib/avatar-gradient";
import { ADMIN_ROLE_LABELS } from "@/lib/constants";
import { ShieldOff, Undo2 } from "lucide-react";
import type { AdminRole, UserStatus } from "@prisma/client";

export function StaffRow({
  staff,
  isSelf,
}: {
  staff: {
    id: string;
    name: string | null;
    email: string | null;
    adminRole: AdminRole | null;
    status: UserStatus;
    createdAt: Date;
  };
  isSelf: boolean;
}) {
  const [revoking, setRevoking] = useState(false);

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white",
                avatarGradient(staff.id),
              )}
            >
              {initials(staff.name ?? staff.email)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {staff.name ?? "Unnamed"}
                  {isSelf && <span className="ml-1 text-xs font-normal text-ink-400">(you)</span>}
                </p>
                <Badge tone={staff.status === "ACTIVE" ? "success" : "warning"}>
                  {staff.status}
                </Badge>
              </div>
              <p className="mt-1 truncate text-xs text-ink-400">
                {staff.email} · Added {formatDate(staff.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {isSelf ? (
              <Badge tone="neutral">{ADMIN_ROLE_LABELS[staff.adminRole ?? "SUPER_ADMIN"]}</Badge>
            ) : (
              <form
                action={changeStaffRoleAction.bind(null, staff.id)}
                onChange={(e) => e.currentTarget.requestSubmit()}
              >
                <Select name="adminRole" defaultValue={staff.adminRole ?? "SUPER_ADMIN"} className="text-xs">
                  {Object.entries(ADMIN_ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </form>
            )}

            {!isSelf && !revoking && (
              <>
                {staff.status === "ACTIVE" ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setRevoking(true)}>
                    <ShieldOff className="h-3.5 w-3.5" />
                    Revoke access
                  </Button>
                ) : (
                  <form action={restoreStaffAccessAction.bind(null, staff.id)}>
                    <RestoreButton />
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        {revoking && (
          <form
            action={revokeStaffAccessAction.bind(null, staff.id)}
            className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4"
          >
            <p className="text-xs text-ink-500">
              This immediately blocks {staff.name ?? staff.email} from signing in to the admin
              dashboard.
            </p>
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setRevoking(false)}>
                Cancel
              </Button>
              <RevokeButton />
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function RevokeButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" disabled={pending}>
      {pending ? "Revoking…" : "Confirm revoke"}
    </Button>
  );
}

function RestoreButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      <Undo2 className="h-3.5 w-3.5" />
      {pending ? "Restoring…" : "Restore access"}
    </Button>
  );
}
