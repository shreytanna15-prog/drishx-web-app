import { getCoatingDotColor } from "@/lib/coating-color";
import { cn } from "@/lib/utils";

type CoatingDotProps = {
  coating?: string | null;
  className?: string;
};

export function CoatingDot({ coating, className }: CoatingDotProps) {
  const color = getCoatingDotColor(coating);
  if (!color) return null;

  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  );
}
