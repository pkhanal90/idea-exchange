"use client";

import { useState } from "react";
import { buildSparklinePath } from "@/lib/sparkline";
import { formatCurrency, cn } from "@/lib/utils";

type Range = "7d" | "30d" | "all";

const RANGE_LABELS: Record<Range, string> = { "7d": "7d", "30d": "30d", all: "All" };

export function VolumeTrendCard({
  volume,
  volumeTotals,
  volumeDeltaPct,
}: {
  volume: Record<Range, number[]>;
  volumeTotals: Record<Range, number>;
  volumeDeltaPct: Record<Range, number | null>;
}) {
  const [range, setRange] = useState<Range>("7d");
  const points = volume[range];
  const delta = volumeDeltaPct[range];
  const { linePath, areaPath } = buildSparklinePath(points, 640, 100);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-500">Total volume</p>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span className="text-3xl font-semibold text-ink-900">
              {formatCurrency(volumeTotals[range])}
            </span>
            {delta !== null && (
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-sm font-semibold",
                  delta >= 0 ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700",
                )}
              >
                {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-0.5 rounded-lg border border-border bg-white p-0.5">
          {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                range === r ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900",
              )}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-white p-4">
        <svg viewBox="0 0 640 100" className="block h-[100px] w-full">
          <defs>
            <linearGradient id="volume-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#525aec" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#525aec" stopOpacity="0" />
            </linearGradient>
          </defs>
          {areaPath && <path d={areaPath} fill="url(#volume-area)" />}
          <path d={linePath} fill="none" stroke="#525aec" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
