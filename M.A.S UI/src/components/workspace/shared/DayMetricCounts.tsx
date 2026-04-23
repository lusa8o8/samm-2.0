import { cn } from "@/lib/utils";
import type { DayCounts } from "@/components/workspace/calendar-studio/types";

interface DayMetricCountsProps {
  counts: DayCounts;
  size?: "xs" | "sm";
  align?: "start" | "between";
  className?: string;
}

const dotMap: { key: keyof DayCounts; label: string; tone: string; dot: string }[] = [
  { key: "scheduled", label: "Sch", tone: "text-foreground/70", dot: "bg-purple-500" },
  { key: "drafts", label: "Dft", tone: "text-foreground/70", dot: "bg-slate-400" },
  { key: "waitingApproval", label: "Apr", tone: "text-amber-700", dot: "bg-amber-500" },
  { key: "failed", label: "Fail", tone: "text-red-700", dot: "bg-red-500" },
];

export function DayMetricCounts({ counts, size = "xs", align = "start", className }: DayMetricCountsProps) {
  const visible = dotMap.filter((d) => counts[d.key] > 0);
  if (visible.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1.5", align === "between" && "w-full justify-between", className)}>
      {visible.map((d) => (
        <span
          key={d.key}
          className={cn(
            "inline-flex items-center gap-1 leading-none",
            size === "xs" ? "text-[9px]" : "text-[10px]",
            d.tone,
          )}
          title={`${d.label}: ${counts[d.key]}`}
        >
          <span className={cn("h-1 w-1 rounded-full", d.dot)} />
          <span className="font-medium tabular-nums">{counts[d.key]}</span>
        </span>
      ))}
    </div>
  );
}
