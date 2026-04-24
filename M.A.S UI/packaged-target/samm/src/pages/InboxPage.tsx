import { useState } from 'react';
import { CheckCircle, XCircle, ExternalLink, Filter, MessageSquare, AlertTriangle, Info, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StatusChip } from '../components/shared/StatusChip';
import { useInspector } from '../components/shell/WorkspaceShell';
import { getInboxItems, approveInboxItem, rejectInboxItem, readFunctionError } from '../services/liveInboxService';
import type { InboxItem } from '../types';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'approval', label: 'Approvals' },
  { id: 'suggestion', label: 'Suggestions' },
  { id: 'escalation', label: 'Escalations' },
  { id: 'fyi', label: 'FYI' },
];

const typeIcons: Record<string, React.ReactNode> = {
  approval: <CheckSquare size={13} className="text-amber-500" />,
  suggestion: <MessageSquare size={13} className="text-blue-500" />,
  escalation: <AlertTriangle size={13} className="text-red-500" />,
  fyi: <Info size={13} className="text-muted-foreground" />,
};

function InboxCard({
  item,
  onApprove,
  onReject,
  onInspect,
  actionState,
}: {
  item: InboxItem;
  onApprove: (item: InboxItem) => void;
  onReject: (id: string) => void;
  onInspect: (item: InboxItem) => void;
  actionState?: 'approved' | 'rejected' | 'actioned';
}) {
  const effectiveStatus = actionState ?? item.status;
  const isActionable = effectiveStatus === 'pending' || effectiveStatus === 'new';
  const statusLabel = effectiveStatus === 'actioned' ? 'seen' : undefined;

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-4 space-y-3 transition-all',
        effectiveStatus === 'approved' && 'opacity-60 border-emerald-200 dark:border-emerald-900/50',
        effectiveStatus === 'rejected' && 'opacity-60 border-red-200 dark:border-red-900/50',
        effectiveStatus === 'actioned' && 'opacity-60 border-slate-200 dark:border-slate-800/50',
        isActionable && 'hover:border-border/80 hover:shadow-sm'
      )}
      data-testid={`inbox-item-${item.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5">{typeIcons[item.type]}</div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{item.source} · {format(new Date(item.createdAt), 'MMM d, HH:mm')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusChip status={item.priority} />
          <StatusChip status={effectiveStatus as never} label={statusLabel} />
        </div>
      </div>

      <p className="text-[13px] text-foreground/80 leading-relaxed">{item.summary}</p>

      <div className="bg-muted/40 rounded-lg px-3 py-2 border border-border/50">
        <p className="text-[11px] text-muted-foreground italic leading-relaxed">{item.rationale}</p>
      </div>

      <div className="flex items-center gap-2 pt-1">
        {isActionable && item.type === 'approval' && (
          <>
            <button
              onClick={() => onApprove(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
              data-testid={`approve-${item.id}`}
            >
              <CheckCircle size={12} /> Approve
            </button>
            <button
              onClick={() => onReject(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              data-testid={`reject-${item.id}`}
            >
              <XCircle size={12} /> Reject
            </button>
          </>
        )}
        {isActionable && item.type === 'suggestion' && (
          <>
            <button
              onClick={() => onApprove(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 text-xs font-medium hover:bg-primary/20 transition-colors"
              data-testid={`approve-suggestion-${item.id}`}
            >
              <CheckCircle size={12} /> Use suggestion
            </button>
            <button
              onClick={() => onReject(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card text-muted-foreground border border-border text-xs font-medium hover:bg-muted transition-colors"
              data-testid={`reject-suggestion-${item.id}`}
            >
              <XCircle size={12} /> Dismiss
            </button>
          </>
        )}
        {isActionable && (item.type === 'escalation' || item.type === 'fyi') && (
          <button
            onClick={() => onApprove(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card text-muted-foreground border border-border text-xs font-medium hover:bg-muted transition-colors"
            data-testid={`dismiss-${item.id}`}
          >
            Mark as seen
          </button>
        )}
        <button
          onClick={() => onInspect(item)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card text-muted-foreground border border-border text-xs font-medium hover:bg-muted transition-colors ml-auto"
          data-testid={`inspect-${item.id}`}
        >
          <ExternalLink size={11} /> Open
        </button>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [actionStates, setActionStates] = useState<Record<string, 'approved' | 'rejected' | 'actioned'>>({});
  const [error, setError] = useState<string | null>(null);
  const { openInspector } = useInspector();
  const queryClient = useQueryClient();
  const {
    data: items = [],
    error: inboxQueryError,
  } = useQuery({
    queryKey: ['inbox-items'],
    queryFn: getInboxItems,
  });

  const resolvedQueryError =
    inboxQueryError instanceof Error ? inboxQueryError.message : inboxQueryError ? 'The request failed.' : null;

  const handleApprove = async (item: InboxItem) => {
    try {
      await approveInboxItem(item.id);
      setActionStates((s) => ({
        ...s,
        [item.id]: item.type === 'escalation' || item.type === 'fyi' ? 'actioned' : 'approved',
      }));
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['inbox-items'] });
      void queryClient.invalidateQueries({ queryKey: ['inbox-summary'] });
    } catch (err) {
      setError(await readFunctionError(err));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectInboxItem(id);
      setActionStates(s => ({ ...s, [id]: 'rejected' }));
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['inbox-items'] });
      void queryClient.invalidateQueries({ queryKey: ['inbox-summary'] });
    } catch (err) {
      setError(await readFunctionError(err));
    }
  };

  const handleInspect = (item: InboxItem) => {
    openInspector(item.title, {
      type: 'approval_queue',
      title: item.title,
      data: [item],
    });
  };

  const filtered = items.filter(i => activeTab === 'all' || i.type === activeTab);
  const pendingCount = items.filter(i => (i.status === 'pending' || i.status === 'new') && !actionStates[i.id]).length;
  const totalCount = items.length;
  const subtitle =
    totalCount === 0
      ? 'No inbox items right now'
      : pendingCount === totalCount
        ? `${totalCount} item${totalCount !== 1 ? 's' : ''} in inbox`
        : `${totalCount} item${totalCount !== 1 ? 's' : ''} in inbox · ${pendingCount} need your attention`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Inbox</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
            <Filter size={12} /> Filter
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {tabs.map(tab => {
            const count = tab.id === 'all'
              ? items.length
              : items.filter(i => i.type === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {(error || resolvedQueryError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error ?? resolvedQueryError}
          </div>
        )}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <CheckCircle size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">All clear</p>
            <p className="text-xs mt-1">No items in this category</p>
          </div>
        )}
        {filtered.map(item => (
          <InboxCard
            key={item.id}
            item={item}
            onApprove={handleApprove}
            onReject={handleReject}
            onInspect={handleInspect}
            actionState={actionStates[item.id]}
          />
        ))}
      </div>
    </div>
  );
}
