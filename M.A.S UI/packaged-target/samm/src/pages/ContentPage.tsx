import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw, ExternalLink, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { StatusChip } from '../components/shared/StatusChip';
import { ChannelIcon } from '../components/shared/ChannelIcon';
import { useInspector } from '../components/shell/WorkspaceShell';
import { getContentRegistry, approveContentItem, rejectContentItem, retryContentItem } from '../services/liveContentService';
import type { ContentDraft } from '../types';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'published', label: 'Published' },
  { id: 'failed', label: 'Failed' },
];

function ContentCard({
  draft,
  onApprove,
  onReject,
  onRetry,
  onInspect,
  approvalState,
}: {
  draft: ContentDraft;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRetry: (id: string) => void;
  onInspect: (draft: ContentDraft) => void;
  approvalState?: string;
}) {
  return (
    <div
      className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-sm transition-all cursor-pointer group"
      onClick={() => onInspect(draft)}
      data-testid={`content-card-${draft.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <ChannelIcon channel={draft.channel} size={14} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug truncate">{draft.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{draft.contentType} · {draft.channel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusChip status={draft.status} />
          {draft.approvalStatus && draft.status === 'draft' && (
            <StatusChip status={approvalState as never ?? draft.approvalStatus} />
          )}
        </div>
      </div>

      {/* Preview */}
      <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{draft.preview}</p>

      {/* Metadata tags */}
      <div className="flex flex-wrap gap-1.5">
        {draft.linkedCampaign && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium border border-primary/20">
            {draft.linkedCampaign}
          </span>
        )}
        {draft.objective && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
            {draft.objective}
          </span>
        )}
        {draft.patternTags?.slice(0, 2).map(tag => (
          <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
            #{tag}
          </span>
        ))}
      </div>

      {/* Timestamp */}
      <p className="text-[10px] text-muted-foreground">
        {draft.status === 'scheduled' && draft.scheduledFor && `Scheduled for ${format(new Date(draft.scheduledFor), 'MMM d, HH:mm')}`}
        {draft.status === 'published' && draft.publishedAt && `Published ${format(new Date(draft.publishedAt), 'MMM d, HH:mm')}`}
        {draft.status === 'failed' && draft.failedAt && `Failed ${format(new Date(draft.failedAt), 'MMM d, HH:mm')}`}
        {draft.status === 'draft' && `Created ${format(new Date(draft.createdAt), 'MMM d, HH:mm')}`}
      </p>

      {/* Failure reason */}
      {draft.status === 'failed' && draft.failureReason && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 px-3 py-2">
          <p className="text-[11px] text-red-700 dark:text-red-400">{draft.failureReason}</p>
        </div>
      )}

      {/* Actions */}
      <div
        className="flex items-center gap-2 pt-1"
        onClick={e => e.stopPropagation()}
      >
        {draft.status === 'draft' && !approvalState && draft.approvalStatus === 'pending' && (
          <>
            <button
              onClick={() => onApprove(draft.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-medium hover:bg-emerald-100 transition-colors"
              data-testid={`content-approve-${draft.id}`}
            >
              <CheckCircle size={11} /> Approve
            </button>
            <button
              onClick={() => onReject(draft.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-medium hover:bg-red-100 transition-colors"
              data-testid={`content-reject-${draft.id}`}
            >
              <XCircle size={11} /> Reject
            </button>
          </>
        )}
        {draft.status === 'failed' && (
          <button
            onClick={() => onRetry(draft.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 text-xs font-medium hover:bg-primary/20 transition-colors"
            data-testid={`content-retry-${draft.id}`}
          >
            <RefreshCw size={11} /> Retry
          </button>
        )}
        <button
          onClick={() => onInspect(draft)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-card text-muted-foreground border border-border text-xs font-medium hover:bg-muted transition-colors ml-auto opacity-0 group-hover:opacity-100"
          data-testid={`content-inspect-${draft.id}`}
        >
          <ExternalLink size={11} /> View details
        </button>
      </div>
    </div>
  );
}

export default function ContentPage() {
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [approvalStates, setApprovalStates] = useState<Record<string, string>>({});
  const { openInspector } = useInspector();

  const loadDrafts = async () => {
    const nextDrafts = await getContentRegistry();
    setDrafts(nextDrafts);
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const handleApprove = async (id: string) => {
    await approveContentItem(id);
    setApprovalStates(s => ({ ...s, [id]: 'approved' }));
    await loadDrafts();
  };

  const handleReject = async (id: string) => {
    await rejectContentItem(id);
    setApprovalStates(s => ({ ...s, [id]: 'rejected' }));
    await loadDrafts();
  };

  const handleRetry = async (id: string) => {
    await retryContentItem(id);
    setApprovalStates(s => ({ ...s, [id]: 'retrying' }));
    await loadDrafts();
  };

  const handleInspect = (draft: ContentDraft) => {
    openInspector(draft.title, {
      type: 'content_batch_review',
      title: 'Content details',
      data: [draft],
    });
  };

  const filtered = activeTab === 'all'
    ? drafts
    : drafts.filter(d => activeTab === 'failed' ? d.status === 'failed' || d.status === 'rejected' : d.status === activeTab);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Content Registry</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {drafts.filter(d => d.status === 'draft' && d.approvalStatus === 'pending').length} drafts pending approval
            </p>
          </div>
        </div>

        <div className="flex gap-1 mt-4">
          {tabs.map(tab => {
            const count = tab.id === 'all'
              ? drafts.length
              : drafts.filter(d => tab.id === 'failed' ? d.status === 'failed' || d.status === 'rejected' : d.status === tab.id).length;
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
                data-testid={`content-tab-${tab.id}`}
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

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <FileText size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No content here</p>
            <p className="text-xs mt-1">Nothing in this category</p>
          </div>
        )}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {filtered.map(draft => (
            <ContentCard
              key={draft.id}
              draft={draft}
              onApprove={handleApprove}
              onReject={handleReject}
              onRetry={handleRetry}
              onInspect={handleInspect}
              approvalState={approvalStates[draft.id]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
