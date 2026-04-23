import { cn } from "@/lib/utils";
import { ChannelIcon } from "@/components/workspace/shared/ChannelIcon";
import type { ContentChipData, WorkspaceContentStatus } from "@/components/workspace/calendar-studio/types";

const statusBorder: Record<WorkspaceContentStatus, string> = {
  scheduled: "border-purple-200/70 dark:border-purple-900",
  draft: "border-slate-200/70 dark:border-slate-800",
  published: "border-emerald-200/70 dark:border-emerald-900",
  failed: "border-red-300/70 dark:border-red-900",
};

const statusBg: Record<WorkspaceContentStatus, string> = {
  scheduled: "bg-card",
  draft: "bg-card",
  published: "bg-emerald-50/40 dark:bg-emerald-950/15",
  failed: "bg-red-50/40 dark:bg-red-950/15",
};

interface ContentChipProps {
  chip: ContentChipData;
  className?: string;
}

export function ContentChip({ chip, className }: ContentChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 truncate rounded-md border px-1 py-0.5",
        statusBorder[chip.status],
        statusBg[chip.status],
        className,
      )}
      title={chip.title}
    >
      <ChannelIcon channel={chip.channel} size={9} className="flex-shrink-0" />
      <span className="truncate text-[9px] leading-none text-foreground/80">{chip.title}</span>
    </div>
  );
}
