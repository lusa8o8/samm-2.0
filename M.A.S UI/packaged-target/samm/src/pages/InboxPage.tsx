import { useState } from 'react';
import { CheckCircle, XCircle, ExternalLink, Filter, MessageSquare, AlertTriangle, Info, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StatusChip } from '../components/shared/StatusChip';
import { useInspector } from '../components/shell/WorkspaceShell';
import {
  getInboxItems,
  approveInboxItem,
  rejectInboxItem,
  readFunctionError,
  updateInboxCampaignSchedule,
  isActionableInboxStatus,
} from '../services/liveInboxService';
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

type CampaignScheduleItem = {
  slot_id: string;
  date: string;
  channel: string;
  role: string;
  content_type: string;
  visual_need: string;
  title_seed: string;
  rationale: string;
  countdown_label?: string | null;
  plan_item_id?: string | null;
};

type InboxActionState = Extract<InboxItem['status'], 'approved' | 'rejected' | 'actioned'>;

const campaignChannels = ['facebook', 'instagram', 'linkedin', 'whatsapp', 'youtube', 'email'];
const visualNeeds = ['text_only', 'static', 'carousel', 'video'];
const contentTypes = ['announcement', 'value', 'proof', 'countdown', 'conversion', 'reminder', 'campaign'];

function getCampaignSchedule(item: InboxItem): CampaignScheduleItem[] {
  const payload = item.payload ?? {};
  const schedule = payload.proposed_schedule ?? payload.campaign_brief?.proposed_schedule;
  return Array.isArray(schedule) ? schedule : [];
}

function getEffectiveStatus(item: InboxItem, actionStates: Record<string, InboxActionState>): InboxItem['status'] {
  return actionStates[item.id] ?? item.status;
}

function CampaignScheduleEditor({
  item,
  onSaved,
}: {
  item: InboxItem;
  onSaved: () => void;
}) {
  const initialSchedule = getCampaignSchedule(item);
  const [rows, setRows] = useState<CampaignScheduleItem[]>(initialSchedule);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (initialSchedule.length === 0) return null;

  const updateRow = (index: number, patch: Partial<CampaignScheduleItem>) => {
    setRows((current) => current.map((row, rowIndex) => (
      rowIndex === index
        ? {
            ...row,
            ...patch,
            slot_id: patch.date || patch.channel
              ? `${patch.date ?? row.date}:${patch.channel ?? row.channel}:campaign:manual:${index + 1}`
              : row.slot_id,
          }
        : row
    )));
  };

  const removeRow = (index: number) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const addRow = () => {
    const last = rows[rows.length - 1];
    const date = last?.date ?? new Date().toISOString().slice(0, 10);
    const channel = last?.channel ?? 'facebook';
    const nextIndex = rows.length + 1;
    setRows((current) => [
      ...current,
      {
        slot_id: `${date}:${channel}:campaign:manual:${nextIndex}`,
        date,
        channel,
        role: 'campaign support',
        content_type: 'campaign',
        visual_need: 'static',
        title_seed: item.title,
        rationale: 'Manual campaign schedule item.',
        countdown_label: null,
        plan_item_id: null,
      },
    ]);
  };

  const save = async () => {
    try {
      setSaving(true);
      setLocalError(null);
      await updateInboxCampaignSchedule(item.id, rows);
      onSaved();
    } catch (err) {
      setLocalError(await readFunctionError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-blue-900">Campaign schedule</p>
          <p className="text-[11px] text-blue-800/70">Edit the actual dates and roles before approving this brief.</p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50"
        >
          Add item
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={`${row.slot_id}-${index}`} className="grid grid-cols-1 gap-2 rounded-lg border border-blue-100 bg-white p-2 lg:grid-cols-[130px_120px_1fr_120px_120px_auto]">
            <input
              type="date"
              value={row.date}
              onChange={(event) => updateRow(index, { date: event.target.value })}
              className="h-9 rounded-lg border border-border bg-background px-2 text-xs"
            />
            <select
              value={row.channel}
              onChange={(event) => updateRow(index, { channel: event.target.value })}
              className="h-9 rounded-lg border border-border bg-background px-2 text-xs capitalize"
            >
              {campaignChannels.map((channel) => (
                <option key={channel} value={channel}>{channel}</option>
              ))}
            </select>
            <input
              value={row.role}
              onChange={(event) => updateRow(index, { role: event.target.value })}
              className="h-9 rounded-lg border border-border bg-background px-2 text-xs"
              placeholder="campaign role"
            />
            <select
              value={row.content_type}
              onChange={(event) => updateRow(index, { content_type: event.target.value })}
              className="h-9 rounded-lg border border-border bg-background px-2 text-xs"
            >
              {contentTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={row.visual_need}
              onChange={(event) => updateRow(index, { visual_need: event.target.value })}
              className="h-9 rounded-lg border border-border bg-background px-2 text-xs"
            >
              {visualNeeds.map((need) => (
                <option key={need} value={need}>{need}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="h-9 rounded-lg border border-red-100 px-2 text-[11px] font-medium text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
            <input
              value={row.title_seed}
              onChange={(event) => updateRow(index, { title_seed: event.target.value })}
              className="h-9 rounded-lg border border-border bg-background px-2 text-xs lg:col-span-3"
              placeholder="title seed"
            />
            <input
              value={row.rationale}
              onChange={(event) => updateRow(index, { rationale: event.target.value })}
              className="h-9 rounded-lg border border-border bg-background px-2 text-xs lg:col-span-3"
              placeholder="why this item exists"
            />
          </div>
        ))}
      </div>

      {localError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {localError}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving || rows.length === 0}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save schedule'}
        </button>
      </div>
    </div>
  );
}

function InboxCard({
  item,
  onApprove,
  onReject,
  onInspect,
  onScheduleSaved,
  actionState,
}: {
  item: InboxItem;
  onApprove: (item: InboxItem) => void;
  onReject: (id: string) => void;
  onInspect: (item: InboxItem) => void;
  onScheduleSaved: () => void;
  actionState?: InboxActionState;
}) {
  const effectiveStatus = actionState ?? item.status;
  const isActionable = isActionableInboxStatus(effectiveStatus);
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

      {item.linkedObjectType === 'campaign_brief' && (
        <CampaignScheduleEditor item={item} onSaved={onScheduleSaved} />
      )}

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
  const [actionStates, setActionStates] = useState<Record<string, InboxActionState>>({});
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
  const actionableItems = items.filter((item) => isActionableInboxStatus(getEffectiveStatus(item, actionStates)));
  const pendingCount = actionableItems.length;
  const subtitle =
    items.length === 0
      ? 'No inbox items right now'
      : pendingCount === 0
        ? 'No items need your attention'
        : `${pendingCount} item${pendingCount !== 1 ? 's' : ''} ${pendingCount === 1 ? 'needs' : 'need'} your attention`;

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
              ? pendingCount
              : actionableItems.filter(i => i.type === tab.id).length;

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
            onScheduleSaved={() => void queryClient.invalidateQueries({ queryKey: ['inbox-items'] })}
            actionState={actionStates[item.id]}
          />
        ))}
      </div>
    </div>
  );
}
