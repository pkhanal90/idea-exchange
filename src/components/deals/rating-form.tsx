"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingForm({
  action,
  rateeLabel,
  initialScore,
  initialComment,
}: {
  action: (formData: FormData) => Promise<void>;
  rateeLabel: string;
  initialScore?: number;
  initialComment?: string;
}) {
  const [score, setScore] = useState(initialScore ?? 0);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="score" value={score} />
      <div>
        <p className="mb-1.5 text-sm font-medium text-ink-800">Rate {rateeLabel}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "h-6 w-6",
                  n <= score ? "fill-warning-500 text-warning-500" : "text-ink-200",
                )}
              />
            </button>
          ))}
        </div>
      </div>
      <Textarea
        name="comment"
        rows={2}
        placeholder="Optional comment"
        defaultValue={initialComment}
      />
      <SubmitButton disabled={score === 0} />
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={disabled || pending}>
      {pending ? "Saving…" : "Submit rating"}
    </Button>
  );
}
