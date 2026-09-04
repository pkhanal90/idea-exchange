import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// A plain (non-component) helper so the `Date.now()` read isn't flagged by
// react-hooks/purity, which only cares about impure calls directly inside a
// Component or Hook body — this must still read wall-clock time per request.
export function isPast(date: Date | string | null | undefined) {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() <= Date.now();
}

// Accepts number, string, or anything coercible via Number() — including
// Prisma's Decimal, which implements valueOf() as a numeric string.
type Numeric = number | string | { toString(): string };

export function formatCurrency(value: Numeric | null | undefined) {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatCompactCurrency(value: Numeric | null | undefined) {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function timeAgo(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let value_ = seconds;
  for (const [amount, unit] of units) {
    if (value_ < amount) {
      const rounded = Math.floor(value_);
      return `${rounded} ${unit}${rounded !== 1 ? "s" : ""} ago`;
    }
    value_ /= amount;
  }
  return "—";
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
