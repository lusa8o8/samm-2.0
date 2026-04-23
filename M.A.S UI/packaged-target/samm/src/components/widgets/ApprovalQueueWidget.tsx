import { useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, CheckSquare, Clock, Info, MessageSquare, XCircle } from "lucide-react";
import { approveInboxItem, readFunctionError, rejectInboxItem } from "../../services/liveInboxService";
import { StatusChip } from "../shared/StatusChip";
import type { InboxItem } from "../../types";
import { cn } from "@/lib/utils";

interface ApprovalQueueWidgetProps {
  data: InboxItem[];
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  approval: {
    icon: <CheckSquare size={14} />,
    label: "Approval",
    color: "text-amber-500",
  },
  suggestion: {
    icon: <MessageSquare size={14} />,
    label: "Suggestion",
    color: "text-blue-500",
  },
  escalation: {
    icon: <AlertTriangle size={14} />,
    label: "Escalation",
    color: "text-red-500",
  },
  fyi: {
    icon: <Info size={14} />,
    label: "FYI",
    color: "text-muted-foreground",
  },
};

function InboxItemDetail({ item }: { item: InboxItem }) {
  const [actionState, setActionState] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cfg = typeConfig[item.type] ?? typeConfig.fyi;

  const handleApprove = async () => {
    try {
      await approveInboxItem(item.id);
      setActionState("approved");
      setError(null);
    } catch (err) {
      setError(await readFunctionError(err));
    }
  };

  const handleReject = async () => {
    try {
      await rejectInboxItem(item.id);
      setActionState("rejected");
      setError(null);
    } catch (err) {
      setError(await readFunctionError(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={cn("flex items-center gap-1.5 text-xs font-medium", cfg.color)}>
          {cfg.icon}
          {cfg.label}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock size={10} />
          {format(new Date(item.createdAt), "MMM d, HH:mm")}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <StatusChip status={item.priority} />
        <StatusChip status={(actionState ?? item.status) as never} />
        <span className="ml-1 text-[11px] text-muted-foreground">{item.source}</span>
      </div>

      <div>
        <p className="text-sm leading-relaxed text-foreground">{item.summary}</p>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/50 px-4 py-3">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          SAMM's reasoning
        </p>
        <p className="text-[12px] italic leading-relaxed text-foreground/80">{item.rationale}</p>
      </div>

      {!actionState && (
        <div className="flex gap-2 pt-1">
          {item.type === "approval" && (
            <>
              <button
                onClick={handleApprove}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
              >
                <CheckCircle size={14} /> Approve
              </button>
              <button
                onClick={handleReject}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
              >
                <XCircle size={14} /> Reject
              </button>
            </>
          )}

          {item.type === "suggestion" && (
            <>
              <button
                onClick={handleApprove}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <CheckCircle size={14} /> Use suggestion
              </button>
              <button
                onClick={handleReject}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <XCircle size={14} /> Dismiss
              </button>
            </>
          )}

          {(item.type === "escalation" || item.type === "fyi") && (
            <button
              onClick={handleApprove}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Mark as seen
            </button>
          )}
        </div>
      )}

      {actionState && (
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-center text-sm font-medium",
            actionState === "approved"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400",
          )}
        >
          {actionState === "approved" ? "✓ Actioned" : "✕ Dismissed"}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

export function ApprovalQueueWidget({ data }: ApprovalQueueWidgetProps) {
  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground">No items.</p>;
  }

  if (data.length === 1) {
    return <InboxItemDetail item={data[0]} />;
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <InboxItemDetail key={item.id} item={item} />
      ))}
    </div>
  );
}
