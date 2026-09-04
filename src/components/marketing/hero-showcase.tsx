"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const TEASER_TILES = [
  { gradient: "from-indigo-500 to-indigo-700", label: "AI / ML", title: "Adaptive tutoring engine", price: "$85,000" },
  { gradient: "from-emerald-500 to-emerald-700", label: "Fintech", title: "SMB cash-flow forecaster", price: "$120,000" },
  { gradient: "from-rose-500 to-rose-700", label: "Healthtech", title: "Post-op recovery tracker", price: "From $40,000" },
  { gradient: "from-amber-500 to-amber-700", label: "E-commerce", title: "Returns automation kit", price: "Equity / Royalty" },
];

const DEAL_STEPS = [
  { label: "Offer accepted", done: true },
  { label: "Escrow funded", done: true },
  { label: "IP assignment signed", done: true },
  { label: "Ownership transferred", done: false },
];

const STAT_ROW = [
  { label: "Listings", value: "6" },
  { label: "Under offer", value: "2" },
  { label: "Sold", value: "3" },
];

const SLIDES = [
  {
    key: "browse",
    eyebrow: "Browse",
    title: "Curated ideas, sorted by category",
    body: "Public teasers for every listing — no sign-up required to start browsing.",
    content: (
      <div className="grid grid-cols-2 gap-3">
        {TEASER_TILES.map((tile) => (
          <div key={tile.title} className="overflow-hidden rounded-lg border border-border">
            <div className={cn("h-12 bg-gradient-to-br", tile.gradient)} />
            <div className="p-2.5">
              <p className="text-[10px] font-medium text-ink-400">{tile.label}</p>
              <p className="mt-0.5 truncate text-xs font-semibold text-ink-900">{tile.title}</p>
              <p className="mt-1 text-[11px] font-semibold text-accent-700">{tile.price}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "negotiate",
    eyebrow: "Negotiate",
    title: "Negotiate under NDA",
    body: "Buy It Now, auction, or equity/royalty — counter-offer in-app until you agree.",
    content: (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-border bg-ink-50 px-3 py-2.5">
          <span className="flex items-center gap-2 text-xs font-medium text-ink-700">
            <Lock className="h-3.5 w-3.5 text-ink-400" />
            Full diligence — NDA required
          </span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-ink-500 ring-1 ring-border">
            Locked
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-success-500/30 bg-success-50 px-3 py-2.5 text-xs font-medium text-success-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          NDA accepted — details unlocked
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-ink-400">Offer</p>
          <p className="font-mono-nums mt-1 text-lg font-semibold text-ink-900">
            $95,000 <span className="font-sans text-xs font-normal text-ink-400">Buy It Now</span>
          </p>
          <div className="mt-2 flex gap-2">
            <span className="rounded-md bg-ink-900 px-2.5 py-1 text-[11px] font-medium text-white">Counter</span>
            <span className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-ink-700">
              Accept
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "escrow",
    eyebrow: "Close",
    title: "Escrow-backed close",
    body: "Funds hold in simulated escrow until the IP assignment is signed and ownership transfers.",
    content: (
      <div>
        <div className="grid grid-cols-3 gap-2">
          {STAT_ROW.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border p-2.5 text-center">
              <p className="font-mono-nums text-lg font-semibold text-ink-900">{stat.value}</p>
              <p className="text-[10px] text-ink-400">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {DEAL_STEPS.map((step) => (
            <div key={step.label} className="flex items-center gap-2 text-xs">
              <CheckCircle2 className={cn("h-3.5 w-3.5", step.done ? "text-success-500" : "text-ink-200")} />
              <span className={step.done ? "text-ink-700" : "text-ink-400"}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export function HeroShowcase() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-lg lg:mx-0">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/40">
        <div className="flex items-center gap-1.5 border-b border-border bg-ink-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-danger-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success-500/70" />
          <span className="ml-3 rounded-full bg-white px-3 py-1 text-[11px] text-ink-400 ring-1 ring-border">
            ideaexchange.io
          </span>
        </div>
        <div className="relative h-[340px] sm:h-[320px]">
          {SLIDES.map((slide, i) => (
            <div
              key={slide.key}
              aria-hidden={i !== active}
              className={cn(
                "absolute inset-0 flex flex-col p-6 transition-all duration-500 ease-out",
                i === active
                  ? "translate-x-0 opacity-100"
                  : "pointer-events-none translate-x-2 opacity-0",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-accent-700">
                {slide.eyebrow}
              </p>
              <div className="mt-3">{slide.content}</div>
              <div className="mt-auto pt-4">
                <p className="text-sm font-semibold text-ink-900">{slide.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">{slide.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-center gap-2 lg:justify-start">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.key}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show ${slide.title}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === active ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}
