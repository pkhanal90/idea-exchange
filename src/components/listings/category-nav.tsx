import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/constants";
import { CATEGORY_VISUALS } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";
import type { IndustryCategory } from "@prisma/client";

const FEATURED_CATEGORIES: IndustryCategory[] = [
  "AI_ML",
  "FINTECH",
  "SAAS_B2B",
  "HEALTHTECH",
  "ECOMMERCE",
  "CONSUMER_SOCIAL",
  "CLIMATE_ENERGY",
  "DEVTOOLS",
];

export function CategoryNav() {
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {FEATURED_CATEGORIES.map((category) => {
        const { icon: Icon, gradient } = CATEGORY_VISUALS[category];
        return (
          <Link
            key={category}
            href={`/listings?category=${category}`}
            className="group flex items-center gap-2 rounded-full border border-border bg-white py-1.5 pl-1.5 pr-4 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50"
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-white",
                gradient,
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            {CATEGORY_LABELS[category]}
          </Link>
        );
      })}
    </div>
  );
}
