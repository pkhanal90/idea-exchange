import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const STAT_TONE_CLASSES = {
  ink: "bg-ink-100 text-ink-600",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  accent: "bg-accent-50 text-accent-700",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone: keyof typeof STAT_TONE_CLASSES;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", STAT_TONE_CLASSES[tone])}>
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="font-mono-nums text-xl font-semibold leading-tight text-ink-900">{value}</p>
          <p className="truncate text-xs text-ink-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
