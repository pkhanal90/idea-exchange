"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createListingAction, type CreateListingState } from "@/app/listings/create/actions";
import { Label, Input, Textarea, Select, FieldError, FieldHint } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CategoryIcon } from "@/components/listings/category-icon";
import { ConsentDocument } from "@/components/legal/consent-document";
import { CATEGORY_LABELS, STAGE_DESCRIPTIONS, STAGE_LABELS } from "@/lib/constants";
import { DollarSign, Lightbulb, ShieldCheck, UploadCloud, X, type LucideIcon } from "lucide-react";
import type { IndustryCategory } from "@prisma/client";

const initialState: CreateListingState = {};

export function CreateListingForm() {
  const [state, formAction] = useActionState(createListingAction, initialState);
  const [listingType, setListingType] = useState<"FIXED_PRICE" | "AUCTION" | "EQUITY_ROYALTY">(
    "FIXED_PRICE",
  );
  const [openToEquity, setOpenToEquity] = useState(false);
  const [category, setCategory] = useState<IndustryCategory | "">("");
  const [title, setTitle] = useState("");
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [signedName, setSignedName] = useState("");
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6" onSubmit={() => setConsentModalOpen(false)}>
      {state.message && (
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {state.message}
        </div>
      )}

      <Card>
        <SectionHeader
          step={1}
          icon={Lightbulb}
          tone="accent"
          title="The idea"
          body="This structured brief is what buyers see. Keep the teaser short — the rest is only visible once a buyer accepts your NDA."
        />
        <CardContent className="space-y-5">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI-powered co-pilot for freight brokers"
            />
            <FieldError>{errors.title}</FieldError>
          </div>

          <div>
            <Label htmlFor="teaserSummary">Public teaser</Label>
            <Textarea
              id="teaserSummary"
              name="teaserSummary"
              rows={3}
              placeholder="A one or two sentence hook that's safe to show publicly, without giving away your solution."
            />
            <FieldHint>Shown in search results and before the NDA is accepted.</FieldHint>
            <FieldError>{errors.teaserSummary}</FieldError>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Industry category</Label>
              <div className="flex items-center gap-2.5">
                {category && <CategoryIcon category={category} size="sm" />}
                <Select
                  id="category"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IndustryCategory)}
                  className="flex-1"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <FieldError>{errors.category}</FieldError>
            </div>
            <div>
              <Label htmlFor="stage">Stage</Label>
              <Select id="stage" name="stage" defaultValue="">
                <option value="" disabled>
                  Select a stage
                </option>
                {Object.entries(STAGE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label} — {STAGE_DESCRIPTIONS[value as keyof typeof STAGE_DESCRIPTIONS]}
                  </option>
                ))}
              </Select>
              <FieldError>{errors.stage}</FieldError>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <SectionHeader
          step={2}
          icon={ShieldCheck}
          tone="ink"
          title="Diligence details"
          body="Locked behind the NDA click-through on the listing page."
        />
        <CardContent className="space-y-5">
          <div>
            <Label htmlFor="problemStatement">Problem statement</Label>
            <Textarea id="problemStatement" name="problemStatement" rows={4} />
            <FieldError>{errors.problemStatement}</FieldError>
          </div>
          <div>
            <Label htmlFor="proposedSolution">Proposed solution</Label>
            <Textarea id="proposedSolution" name="proposedSolution" rows={4} />
            <FieldError>{errors.proposedSolution}</FieldError>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="targetMarket">Target market</Label>
              <Textarea id="targetMarket" name="targetMarket" rows={3} />
              <FieldError>{errors.targetMarket}</FieldError>
            </div>
            <div>
              <Label htmlFor="tamEstimate">TAM estimate (USD, optional)</Label>
              <Input id="tamEstimate" name="tamEstimate" type="number" min={0} step={1} placeholder="250000000" />
              <FieldError>{errors.tamEstimate}</FieldError>
            </div>
          </div>
          <div>
            <Label htmlFor="monetizationPlan">Monetization plan</Label>
            <Textarea id="monetizationPlan" name="monetizationPlan" rows={3} />
            <FieldError>{errors.monetizationPlan}</FieldError>
          </div>
          <div>
            <Label htmlFor="pitchDeck">Pitch deck (optional, PDF)</Label>
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-ink-50/50 px-4 py-4 text-sm text-ink-500">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-ink-400 ring-1 ring-border">
                <UploadCloud className="h-4 w-4" />
              </span>
              <input
                id="pitchDeck"
                name="pitchDeck"
                type="file"
                accept="application/pdf"
                className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink-700"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <SectionHeader step={3} icon={DollarSign} tone="success" title="Pricing" />
        <CardContent className="space-y-5">
          <div>
            <Label htmlFor="listingType">Listing type</Label>
            <Select
              id="listingType"
              name="listingType"
              value={listingType}
              onChange={(e) => setListingType(e.target.value as typeof listingType)}
            >
              <option value="FIXED_PRICE">Buy It Now — fixed price</option>
              <option value="AUCTION">Auction — reserve price + countdown</option>
              <option value="EQUITY_ROYALTY">Equity / royalty deal only</option>
            </Select>
          </div>

          {listingType === "FIXED_PRICE" && (
            <div>
              <Label htmlFor="askingPrice">Asking price (USD)</Label>
              <Input id="askingPrice" name="askingPrice" type="number" min={0} step={1} />
              <FieldError>{errors.askingPrice}</FieldError>
            </div>
          )}

          {listingType === "AUCTION" && (
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <Label htmlFor="startingBid">Starting bid (USD)</Label>
                <Input id="startingBid" name="startingBid" type="number" min={0} step={1} />
                <FieldError>{errors.startingBid}</FieldError>
              </div>
              <div>
                <Label htmlFor="reservePrice">Reserve price (USD, optional)</Label>
                <Input id="reservePrice" name="reservePrice" type="number" min={0} step={1} />
                <FieldError>{errors.reservePrice}</FieldError>
              </div>
              <div>
                <Label htmlFor="auctionEndsAt">Auction ends</Label>
                <Input id="auctionEndsAt" name="auctionEndsAt" type="datetime-local" />
                <FieldError>{errors.auctionEndsAt}</FieldError>
              </div>
            </div>
          )}

          {listingType !== "EQUITY_ROYALTY" && (
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                name="openToEquity"
                checked={openToEquity}
                onChange={(e) => setOpenToEquity(e.target.checked)}
                className="h-4 w-4 rounded border-border text-accent-600 focus:ring-accent-500"
              />
              Also open to equity or royalty offers
            </label>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse items-center justify-end gap-3 sm:flex-row">
        <SubmitButton intent="draft" variant="outline">
          Save as draft
        </SubmitButton>
        <Button
          type="button"
          variant="primary"
          className="w-full sm:w-auto"
          onClick={() => setConsentModalOpen(true)}
        >
          Submit for review
        </Button>
      </div>

      {consentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4"
          onClick={() => setConsentModalOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h4 className="text-sm font-semibold text-ink-900">Review your submission consent</h4>
              <button
                type="button"
                onClick={() => setConsentModalOpen(false)}
                className="text-ink-400 hover:text-ink-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="mb-4 rounded-lg bg-ink-50 px-3.5 py-2.5 text-xs text-ink-500">
                This confirms you own this idea and consent to listing it publicly — it&apos;s
                separate from the NDA buyers will sign before seeing your full details.
              </p>
              <ConsentDocument listingTitle={title} submitterName={signedName || "You"} date={today} />
            </div>
            <div className="space-y-3 border-t border-border px-5 py-4">
              <label className="flex items-start gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-accent-600 focus:ring-accent-500"
                />
                I confirm I own this idea and consent to it being listed publicly on Idea
                Exchange.
              </label>
              <div>
                <label htmlFor="consent-signed-name" className="text-xs font-medium text-ink-500">
                  Type your full legal name to sign
                </label>
                <input
                  id="consent-signed-name"
                  name="signedName"
                  value={signedName}
                  onChange={(e) => setSignedName(e.target.value)}
                  placeholder="Full legal name"
                  className="mt-1 w-full rounded-lg border border-border px-3 py-1.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
              </div>
              <input type="hidden" name="consentAccepted" value={consentAgreed ? "true" : ""} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setConsentModalOpen(false)}>
                  Cancel
                </Button>
                <ConfirmSubmitButton disabled={!consentAgreed || signedName.trim().length === 0} />
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

const SECTION_TONE_CLASSES = {
  accent: "bg-accent-50 text-accent-700",
  ink: "bg-ink-900 text-white",
  success: "bg-success-50 text-success-700",
} as const;

function SectionHeader({
  step,
  icon: Icon,
  tone,
  title,
  body,
}: {
  step: number;
  icon: LucideIcon;
  tone: keyof typeof SECTION_TONE_CLASSES;
  title: string;
  body?: string;
}) {
  return (
    <CardHeader>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${SECTION_TONE_CLASSES[tone]}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-ink-900">
            {step}. {title}
          </h2>
          {body && <p className="mt-1 text-sm text-ink-500">{body}</p>}
        </div>
      </div>
    </CardHeader>
  );
}

function SubmitButton({
  intent,
  variant,
  children,
}: {
  intent: "draft" | "submit";
  variant: "outline" | "primary";
  children: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name="intent" value={intent} variant={variant} disabled={pending} className="w-full sm:w-auto">
      {pending ? "Saving…" : children}
    </Button>
  );
}

function ConfirmSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name="intent" value="submit" size="sm" disabled={disabled || pending}>
      {pending ? "Submitting…" : "I Agree & Submit for Review"}
    </Button>
  );
}
