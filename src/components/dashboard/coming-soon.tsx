import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-16 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-500">
          <Construction className="h-5 w-5" />
        </span>
        <p className="mt-3 text-sm font-medium text-ink-700">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-ink-400">{body}</p>
      </CardContent>
    </Card>
  );
}
