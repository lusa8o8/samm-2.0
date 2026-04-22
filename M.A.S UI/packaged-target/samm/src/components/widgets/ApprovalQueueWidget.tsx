import { CheckCircle, XCircle, AlertTriangle, MessageSquare, Info, CheckSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { StatusChip } from '../shared/StatusChip';
import type { InboxItem } from '../../types';
import { useState } from 'react';
import { approveInboxItem, rejectInboxItem } from '../../services/mockService';
import { cn } from '@/lib/utils';

interface ApprovalQueueWidgetProps {
  data: InboxItem[];
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  approval: {
    icon: <CheckSquare size={14} />,
    label: 'Approval',
    color: 'text-amber-500',
  },
  suggestion: {
    icon: <MessageSquare size={14} />,
    label: 'Suggestion',
    color: 'text-blue-500',
  },
  escalation: {
    icon: <AlertTriangle size={14} />,
    label: 'Escalation',
    color: 'text-red-500',
  },
  fyi: {
    icon: <Info size={14} />,
    label: 'FYI',
    color: 'text-muted-foreground',
  },
};

function InboxItemDetail({ item }: { item: InboxItem }) {
  const [actionState, setActionState] = useState<'approved' | 'rejected' | null>(null);
  const cfg = typeConfig[item.type] ?? typeConfig.fyi;

  const handleApprove = async () => {
    await approveInboxItem(item.id);
    setActionState('approved');
  };

  const handleReject = async () => {
    await rejectInboxItem(item.id);
    setActionState('rejected');
  };

  return (
    <div className="space-y-4">
      {/* Type badge + timestamp */}
      <div className="flex items-center justify-between">
        <span className={cn('flex items-center gap-1.5 text-xs font-medium', cfg.color)}>
          {cfg.icon}
          {cfg.label}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock size={10} />
          {format(new Date(item.createdAt), 'MMM d, HH:mm')}
        </span>
      </div>

      {/* Priority + status chips */}
      <div className="flex items-center gap-2">
        <StatusChip status={item.priority} />
        <StatusChip status={(actionState ?? item.status) as never} />
        <span className="text-[11px] text-muted-foreground ml-1">{item.source}</span>
      </div>

      {/* Summary */}
      <div>
        <p className="text-sm text-foreground leading-relaxed">{item.summary}</p>
      </div>

      {/* Rationale box */}
      <div className="rounded-xl bg-muted/50 border border-border/60 px-4 py-3">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">SAMM's reasoning</p>
        <p className="text-[12px] text-foreground/80 leading-relaxed italic">{item.rationale}</p>
      </div>

      {/* Action buttons */}
      {!actionState && (
        <div className="flex gap-2 pt-1">
          {item.type === 'approval' && (
            <>
              <button
                onClick={handleApprove}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-sm font-medium hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle size={14} /> Approve
              </button>
              <button
                onClick={handleReject}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <XCircle size={14} /> Reject
              </button>
            </>
          )}
          {item.type === 'suggestion' && (
            <>
              <button
                onClick={handleApprove}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <CheckCircle size={14} /> Use suggestion
              </button>
              <button
                onClick={handleReject}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-card text-muted-foreground border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                <XCircle size={14} /> Dismiss
              </button>
            </>
          )}
          {(item.type === 'escalation' || item.type === 'fyi') && (
            <button
              onClick={handleApprove}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-card text-muted-foreground border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Mark as seen
            </button>
          )}
        </div>
      )}

      {actionState && (
        <div className={cn(
          'rounded-xl px-4 py-3 text-sm font-medium text-center',
          actionState === 'approved' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
        )}>
          {actionState === 'approved' ? '✓ Actioned' : '✕ Dismissed'}
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
      {data.map(item => (
        <InboxItemDetail key={item.id} item={item} />
      ))}
    </div>
  );
}
