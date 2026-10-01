"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  adminCancelDealAction,
  adminMarkDisputedAction,
  adminRefundDealAction,
} from "@/app/admin/deals/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/form";
import { DealStageBadge } from "@/components/listings/badges";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AlertTriangle, Ban, DollarSign } from "lucide-react";
import type { Deal, DealStage } from "@prisma/client";

type DealWithParties = Deal & {
  listing: { id: string; title: string };
  seller: { name: string | null; email: string | null };
  buyer: { name: string | null; email: string | null };
};

const TERMINAL_STAGES: DealStage[] = ["COMPLETE", "CANCELLED"];

export function DealRow({ deal }: { deal: DealWithParties }) {
  const [actioning, setActioning] = useState<"cancel" | "dispute" | "refund" | null>(null);
  const isTerminal = TERMINAL_STAGES.includes(deal.stage);
  const canRefund = deal.stage === "COMPLETE" && deal.stripePaymentIntentId && !deal.refundedAt;

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/deals/${deal.id}`}
                target="_blank"
                className="text-sm font-semibold text-ink-900 hover:text-accent-700"
              >
                {deal.listing.title}
              </Link>
              <DealStageBadge stage={deal.stage} />
              {deal.refundedAt && <Badge tone="danger">Refunded</Badge>}
            </div>
            <p className="mt-1.5 text-xs text-ink-400">
              Seller: {deal.seller.name ?? deal.seller.email} · Buyer:{" "}
              {deal.buyer.name ?? deal.buyer.email}
            </p>
            <p className="mt-1 text-xs text-ink-400">
              {deal.finalAmount ? formatCurrency(deal.finalAmount as never) : "Equity / royalty"} ·
              Opened {formatDate(deal.createdAt)}
            </p>
            {deal.stage === "DISPUTED" && deal.disputeReason && (
              <p className="mt-1.5 text-xs text-danger-500">Dispute: {deal.disputeReason}</p>
            )}
            {deal.stage === "CANCELLED" && deal.cancelReason && (
              <p className="mt-1.5 text-xs text-ink-400">Cancelled: {deal.cancelReason}</p>
            )}
          </div>

          {!isTerminal && !actioning && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {deal.stage !== "DISPUTED" && (
                <Button type="button" variant="outline" size="sm" onClick={() => setActioning("dispute")}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Mark disputed
                </Button>
              )}
              <Button type="button" variant="danger" size="sm" onClick={() => setActioning("cancel")}>
                <Ban className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          )}
          {isTerminal && canRefund && !actioning && (
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setActioning("refund")}>
                <DollarSign className="h-3.5 w-3.5" />
                Refund
              </Button>
            </div>
          )}
        </div>

        {actioning === "cancel" && (
          <form
            action={adminCancelDealAction.bind(null, deal.id)}
            className="mt-4 space-y-2 border-t border-border pt-4"
          >
            <Textarea name="reason" placeholder="Reason for cancelling (sent to both parties)" rows={2} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setActioning(null)}>
                Back
              </Button>
              <ConfirmButton label="Confirm cancellation" pendingLabel="Cancelling…" />
            </div>
          </form>
        )}

        {actioning === "dispute" && (
          <form
            action={adminMarkDisputedAction.bind(null, deal.id)}
            className="mt-4 space-y-2 border-t border-border pt-4"
          >
            <Textarea name="reason" placeholder="Reason for flagging this deal (internal)" rows={2} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setActioning(null)}>
                Back
              </Button>
              <ConfirmButton label="Confirm dispute flag" pendingLabel="Saving…" />
            </div>
          </form>
        )}

        {actioning === "refund" && (
          <form
            action={adminRefundDealAction.bind(null, deal.id)}
            className="mt-4 space-y-2 border-t border-border pt-4"
          >
            <p className="text-xs text-ink-500">
              This issues a real Stripe refund for the captured payment on this deal.
            </p>
            <Textarea name="reason" placeholder="Reason for the refund (internal)" rows={2} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setActioning(null)}>
                Back
              </Button>
              <ConfirmButton label="Confirm refund" pendingLabel="Refunding…" />
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function ConfirmButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
