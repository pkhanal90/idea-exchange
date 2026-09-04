import { CATEGORY_VISUALS } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";
import type { IndustryCategory } from "@prisma/client";

export function CategoryIcon({
  category,
  size = "md",
}: {
  category: IndustryCategory;
  size?: "sm" | "md";
}) {
  const { icon: Icon, gradient } = CATEGORY_VISUALS[category];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        gradient,
      )}
    >
      <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} strokeWidth={2} />
    </span>
  );
}
