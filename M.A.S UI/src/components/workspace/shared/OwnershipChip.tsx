import { cn } from "@/lib/utils";
import type { CampaignColor, DayOwnershipMode, WorkspacePipelineId } from "@/components/workspace/calendar-studio/types";

export const campaignColorClasses: Record<
  CampaignColor,
  { bg: string; border: string; text: string; dot: string; soft: string }
> = {
  blue: {
    bg: "bg-blue-100/70 dark:bg-blue-950/40",
    border: "border-blue-200/80 dark:border-blue-900",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    soft: "bg-blue-50/60 dark:bg-blue-950/20",
  },
  amber: {
    bg: "bg-amber-100/70 dark:bg-amber-950/40",
    border: "border-amber-200/80 dark:border-amber-900",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    soft: "bg-amber-50/60 dark:bg-amber-950/20",
  },
  purple: {
    bg: "bg-purple-100/70 dark:bg-purple-950/40",
    border: "border-purple-200/80 dark:border-purple-900",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
    soft: "bg-purple-50/60 dark:bg-purple-950/20",
  },
  emerald: {
    bg: "bg-emerald-100/70 dark:bg-emerald-950/40",
    border: "border-emerald-200/80 dark:border-emerald-900",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    soft: "bg-emerald-50/60 dark:bg-emerald-950/20",
  },
  pink: {
    bg: "bg-pink-100/70 dark:bg-pink-950/40",
    border: "border-pink-200/80 dark:border-pink-900",
    text: "text-pink-700 dark:text-pink-300",
    dot: "bg-pink-500",
    soft: "bg-pink-50/60 dark:bg-pink-950/20",
  },
  slate: {
    bg: "bg-slate-100/70 dark:bg-slate-900/40",
    border: "border-slate-200/80 dark:border-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-400",
    soft: "bg-slate-50/60 dark:bg-slate-900/20",
  },
};

interface CampaignPillProps {
  name: string;
  color: CampaignColor;
  size?: "xs" | "sm";
  exclusive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CampaignPill({ name, color, size = "xs", exclusive, onClick, className }: CampaignPillProps) {
  const c = campaignColorClasses[color];
  const classes = cn(
    "inline-flex max-w-full items-center gap-1 truncate rounded-full border font-medium transition-colors",
    size === "xs" ? "px-1.5 py-px text-[9px]" : "px-2 py-0.5 text-[10px]",
    c.bg,
    c.border,
    c.text,
    onClick && "cursor-pointer hover:brightness-95",
    className,
  );
  const inner = (
    <>
      <span className={cn("h-1 w-1 flex-shrink-0 rounded-full", c.dot)} />
      <span className="truncate">{name}</span>
      {exclusive ? <span className="opacity-60">·excl</span> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} title={name}>
        {inner}
      </button>
    );
  }

  return (
    <span className={classes} title={name}>
      {inner}
    </span>
  );
}

interface OwnershipChipProps {
  ownership: DayOwnershipMode;
  ownerPipeline?: WorkspacePipelineId;
  size?: "xs" | "sm";
}

const ownershipLabels: Record<DayOwnershipMode, string> = {
  campaign_exclusive: "Exclusive",
  campaign_dominant: "Dominant",
  mixed: "Mixed",
  baseline: "Baseline",
  open: "Open",
};

const ownershipTone: Record<DayOwnershipMode, string> = {
  campaign_exclusive:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900",
  campaign_dominant:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900",
  mixed:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900",
  baseline:
    "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800",
  open: "bg-muted/50 text-muted-foreground border-border",
};

export function OwnershipChip({ ownership, ownerPipeline, size = "xs" }: OwnershipChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "xs" ? "px-1.5 py-px text-[9px]" : "px-2 py-0.5 text-[10px]",
        ownershipTone[ownership],
      )}
    >
      {ownershipLabels[ownership]}
      {ownerPipeline ? <span className="opacity-60">· {ownerPipeline}</span> : null}
    </span>
  );
}
