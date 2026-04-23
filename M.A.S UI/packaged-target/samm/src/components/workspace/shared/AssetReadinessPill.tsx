import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssetReadinessState } from "@/components/workspace/calendar-studio/types";

const config: Record<AssetReadinessState, { label: string; icon: ReactNode; cls: string }> = {
  assets_ready: {
    label: "Assets ready",
    icon: <CheckCircle2 size={11} />,
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900",
  },
  partial_assets: {
    label: "Partial assets",
    icon: <CircleDashed size={11} />,
    cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900",
  },
  assets_needed: {
    label: "Assets needed",
    icon: <AlertCircle size={11} />,
    cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900",
  },
};

interface AssetReadinessPillProps {
  state: AssetReadinessState;
  size?: "xs" | "sm";
  className?: string;
}

export function AssetReadinessPill({ state, size = "sm", className }: AssetReadinessPillProps) {
  const c = config[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "xs" ? "px-1.5 py-px text-[10px]" : "px-2 py-0.5 text-[11px]",
        c.cls,
        className,
      )}
    >
      {c.icon}
      {c.label}
    </span>
  );
}
