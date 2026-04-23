import { cn } from "@/lib/utils";

interface ContentCapacityBarProps {
  used: number;
  max: number;
  size?: "xs" | "sm";
  showLabel?: boolean;
  className?: string;
}

export function ContentCapacityBar({
  used,
  max,
  size = "xs",
  showLabel,
  className,
}: ContentCapacityBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const tone =
    pct >= 100 ? "bg-red-400" : pct >= 80 ? "bg-amber-400" : pct >= 40 ? "bg-primary" : "bg-emerald-400";

  return (
    <div className={cn("flex w-full items-center gap-2", className)}>
      <div className={cn("flex-1 overflow-hidden rounded-full bg-muted", size === "xs" ? "h-1" : "h-1.5")}>
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </div>
      {showLabel ? (
        <span className="flex-shrink-0 text-[9px] tabular-nums text-muted-foreground">
          {used}/{max}
        </span>
      ) : null}
    </div>
  );
}
