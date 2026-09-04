import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-7 w-7 text-[11px]",
};

export function LogoMark({
  size = "md",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-md bg-gradient-to-br from-accent-500 to-accent-700 font-bold tracking-tighter text-white shadow-sm",
        sizeClasses[size],
        className,
      )}
    >
      IE
    </span>
  );
}
