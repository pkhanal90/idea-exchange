"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

const FRAME_HEIGHT = 300; // px — the visible window each screenshot scrolls within
const SLIDE_DURATION = 7000; // ms — long enough to read the still frame and see the scroll

const SLIDES = [
  {
    key: "browse",
    eyebrow: "Browse",
    title: "Curated ideas, sorted by category",
    body: "Public teasers for every listing — no sign-up required to start browsing.",
    image: "/marketing/hero-browse.png",
    url: "ideaexchange.io/listings",
  },
  {
    key: "negotiate",
    eyebrow: "Negotiate",
    title: "Negotiate under NDA",
    body: "Buy It Now, auction, or equity/royalty — counter-offer in-app until you agree.",
    image: "/marketing/hero-negotiate.png",
    url: "ideaexchange.io/dashboard/seller/offers",
  },
  {
    key: "close",
    eyebrow: "Close",
    title: "Escrow-backed close",
    body: "Funds hold in simulated escrow until the IP assignment is signed and ownership transfers.",
    image: "/marketing/hero-close.png",
    url: "ideaexchange.io/deals/…",
  },
];

export function HeroShowcase() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), SLIDE_DURATION);
    return () => clearInterval(id);
  }, []);

  const activeSlide = SLIDES[active];

  return (
    <div className="mx-auto w-full max-w-lg lg:mx-0">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/40">
        <div className="flex items-center gap-1.5 border-b border-border bg-ink-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-danger-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success-500/70" />
          <span className="ml-3 truncate rounded-full bg-white px-3 py-1 text-[11px] text-ink-400 ring-1 ring-border">
            {activeSlide.url}
          </span>
        </div>

        <div
          className="relative overflow-hidden bg-ink-50"
          style={{ height: FRAME_HEIGHT }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={slide.key}
              aria-hidden={i !== active}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-out",
                i === active ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              {/* Real screenshots, not remote/user content — a plain <img>
                  keeps the natural-height + CSS transform scroll trick
                  simple, which next/image's fixed box model would fight. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.image}
                alt=""
                className={cn(
                  "w-full",
                  i === active && "animate-hero-scroll",
                )}
                style={
                  {
                    "--hero-frame-h": `${FRAME_HEIGHT}px`,
                  } as CSSProperties
                }
              />
            </div>
          ))}
        </div>

        <div className="border-t border-border p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-accent-700">
            {activeSlide.eyebrow}
          </p>
          <p className="mt-1.5 text-sm font-semibold text-ink-900">{activeSlide.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">{activeSlide.body}</p>
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
