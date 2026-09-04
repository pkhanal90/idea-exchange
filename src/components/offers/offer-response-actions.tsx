"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  acceptOfferAction,
  counterOfferAction,
  declineOfferAction,
  withdrawOfferAction,
} from "@/app/offers/actions";
import { Button } from "@/components/ui/button";
import { OfferTermsForm } from "@/components/offers/offer-terms-form";
import { Card, CardContent } from "@/components/ui/card";

export function OfferResponseActions({ offerId }: { offerId: string }) {
  const [countering, setCountering] = useState(false);

  if (countering) {
    return (
      <Card className="mt-4">
        <CardContent>
          <p className="mb-3 text-sm font-medium text-ink-800">Propose new terms</p>
          <OfferTermsForm
            action={counterOfferAction.bind(null, offerId)}
            submitLabel="Send counter"
            onCancel={() => setCountering(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <form action={acceptOfferAction.bind(null, offerId)}>
        <AcceptButton />
      </form>
      <Button type="button" variant="outline" size="sm" onClick={() => setCountering(true)}>
        Counter
      </Button>
      <form action={declineOfferAction.bind(null, offerId)}>
        <DeclineButton />
      </form>
    </div>
  );
}

export function WithdrawOfferButton({ offerId }: { offerId: string }) {
  return (
    <form action={withdrawOfferAction.bind(null, offerId)} className="mt-4">
      <Button type="submit" variant="outline" size="sm">
        Withdraw offer
      </Button>
    </form>
  );
}

function AcceptButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Accepting…" : "Accept"}
    </Button>
  );
}

function DeclineButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? "Declining…" : "Decline"}
    </Button>
  );
}
