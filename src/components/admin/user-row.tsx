"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { setUserStatusAction, setAccreditationStatusAction } from "@/app/admin/users/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/form";
import { initials, formatDate } from "@/lib/utils";
import { avatarGradient } from "@/lib/avatar-gradient";
import { cn } from "@/lib/utils";
import { BadgeCheck, ShieldOff, ShieldX, Undo2 } from "lucide-react";
import type { User, UserRole, UserStatus } from "@prisma/client";

const ROLE_TONE: Record<UserRole, "ink" | "accent" | "success"> = {
  SELLER: "ink",
  INVESTOR: "accent",
  ADMIN: "success",
};

const STATUS_TONE: Record<UserStatus, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  BANNED: "danger",
};

export function UserRow({
  user,
}: {
  user: Pick<
    User,
    "id" | "name" | "email" | "role" | "status" | "statusReason" | "accreditationStatus" | "createdAt"
  >;
}) {
  const [actioning, setActioning] = useState<"suspend" | "ban" | null>(null);
  const isAdmin = user.role === "ADMIN";

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white",
                avatarGradient(user.id),
              )}
            >
              {initials(user.name ?? user.email)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="truncate text-sm font-semibold text-ink-900 hover:text-accent-700"
                >
                  {user.name ?? "Unnamed"}
                </Link>
                <Badge tone={ROLE_TONE[user.role]}>{user.role}</Badge>
                <Badge tone={STATUS_TONE[user.status]}>{user.status}</Badge>
                {user.accreditationStatus === "VERIFIED" && (
                  <Badge tone="success">
                    <BadgeCheck className="h-3 w-3" />
                    Verified investor
                  </Badge>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-ink-400">
                {user.email} · Joined {formatDate(user.createdAt)}
              </p>
              {user.statusReason && user.status !== "ACTIVE" && (
                <p className="mt-1 text-xs text-danger-500">Reason: {user.statusReason}</p>
              )}
            </div>
          </div>

          {!isAdmin && !actioning && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {user.role === "INVESTOR" && (
                <AccreditationToggle
                  userId={user.id}
                  verified={user.accreditationStatus === "VERIFIED"}
                />
              )}
              {user.status === "ACTIVE" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActioning("suspend")}
                  >
                    <ShieldOff className="h-3.5 w-3.5" />
                    Suspend
                  </Button>
                  <Button type="button" variant="danger" size="sm" onClick={() => setActioning("ban")}>
                    <ShieldX className="h-3.5 w-3.5" />
                    Ban
                  </Button>
                </>
              ) : (
                <form action={setUserStatusAction.bind(null, user.id, "ACTIVE")}>
                  <ReactivateButton />
                </form>
              )}
            </div>
          )}
        </div>

        {actioning && user.status === "ACTIVE" && (
          <form
            action={setUserStatusAction.bind(null, user.id, actioning === "ban" ? "BANNED" : "SUSPENDED")}
            className="mt-4 space-y-2 border-t border-border pt-4"
          >
            <Textarea name="reason" placeholder="Reason (visible to the user)" rows={2} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setActioning(null)}>
                Cancel
              </Button>
              <ConfirmButton isBan={actioning === "ban"} />
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function AccreditationToggle({ userId, verified }: { userId: string; verified: boolean }) {
  const { pending } = useFormStatus();
  return (
    <form action={setAccreditationStatusAction.bind(null, userId, !verified)}>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <BadgeCheck className="h-3.5 w-3.5" />
        {verified ? "Unverify accreditation" : "Verify accreditation"}
      </Button>
    </form>
  );
}

function ReactivateButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      <Undo2 className="h-3.5 w-3.5" />
      {pending ? "Reactivating…" : "Reactivate"}
    </Button>
  );
}

function ConfirmButton({ isBan }: { isBan: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" disabled={pending}>
      {pending ? "Saving…" : isBan ? "Confirm ban" : "Confirm suspension"}
    </Button>
  );
}
