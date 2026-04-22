import { CheckCircle, XCircle, RefreshCw, Calendar, Tag, Target, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { ChannelIcon } from '../shared/ChannelIcon';
import { StatusChip } from '../shared/StatusChip';
import type { ContentDraft } from '../../types';
import { useState } from 'react';
import { approveContentItem, rejectContentItem, retryContentItem } from '../../services/liveContentService';
import { cn } from '@/lib/utils';

interface Props {
  data: ContentDraft[];
}

const channelGradients: Record<string, string> = {
  linkedin: 'from-blue-600/20 to-blue-400/5',
  twitter: 'from-sky-500/20 to-sky-300/5',
  instagram: 'from-purple-500/20 to-pink-400/5',
  facebook: 'from-blue-700/20 to-blue-500/5',
  whatsapp: 'from-emerald-500/20 to-emerald-300/5',
  youtube: 'from-red-500/20 to-rose-300/5',
  email: 'from-emerald-500/20 to-emerald-300/5',
  design_brief: 'from-amber-500/20 to-yellow-300/5',
  blog: 'from-amber-500/20 to-amber-300/5',
};

function ContentDraftDetail({ draft }: { draft: ContentDraft }) {
  const [actionState, setActionState] = useState<string | null>(null);
  const gradient = channelGradients[draft.channel] ?? 'from-muted/40 to-muted/10';

  const handleApprove = async () => {
    await approveContentItem(draft.id);
    setActionState('approved');
  };

  const handleReject = async () => {
    await rejectContentItem(draft.id);
    setActionState('rejected');
  };

  const handleRetry = async () => {
    await retryContentItem(draft.id);
    setActionState('retrying');
  };

  return (
    <div className="space-y-4">
      {/* Visual preview banner */}
      <div className={cn('rounded-xl bg-gradient-to-br p-5 border border-border/50 flex flex-col gap-3', gradient)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChannelIcon channel={draft.channel} size={16} />
            <span className="text-xs font-medium text-foreground capitalize">{draft.channel} · {draft.contentType}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusChip status={draft.status} />
            {draft.approvalStatus && draft.status === 'draft' && (
              <StatusChip status={(actionState as never) ?? draft.approvalStatus} />
            )}
          </div>
        </div>

        {/* Full content text */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">{draft.title}</p>
          <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{draft.preview}</p>
        </div>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-2">
        {draft.linkedCampaign && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Link2 size={12} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Campaign</p>
              <p className="text-[12px] font-medium text-foreground">{draft.linkedCampaign}</p>
            </div>
          </div>
        )}
        {draft.objective && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Target size={12} className="text-purple-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Objective</p>
              <p className="text-[12px] font-medium text-foreground">{draft.objective}</p>
            </div>
          </div>
        )}
        {draft.ctaType && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Target size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">CTA</p>
              <p className="text-[12px] font-medium text-foreground">{draft.ctaType}</p>
            </div>
          </div>
        )}
        {(draft.scheduledFor || draft.publishedAt || draft.createdAt) && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Calendar size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {draft.status === 'scheduled' ? 'Scheduled' : draft.status === 'published' ? 'Published' : 'Created'}
              </p>
              <p className="text-[12px] font-medium text-foreground">
                {format(new Date(draft.scheduledFor ?? draft.publishedAt ?? draft.createdAt), 'MMM d, HH:mm')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {draft.patternTags && draft.patternTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag size={11} className="text-muted-foreground" />
          {draft.patternTags.map(tag => (
            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Failure reason */}
      {draft.status === 'failed' && draft.failureReason && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 px-4 py-3">
          <p className="text-[11px] font-medium text-red-700 dark:text-red-400 mb-0.5">Failure reason</p>
          <p className="text-[12px] text-red-700/80 dark:text-red-400/80">{draft.failureReason}</p>
        </div>
      )}

      {/* Actions */}
      {!actionState && (
        <div className="flex gap-2 pt-1">
          {draft.status === 'draft' && draft.approvalStatus === 'pending' && (
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
          {draft.status === 'failed' && (
            <button
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <RefreshCw size={14} /> Retry
            </button>
          )}
        </div>
      )}

      {actionState && (
        <div className={cn(
          'rounded-xl px-4 py-3 text-sm font-medium text-center',
          actionState === 'approved' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
          : actionState === 'rejected' ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
          : 'bg-primary/10 text-primary'
        )}>
          {actionState === 'approved' ? '✓ Approved' : actionState === 'rejected' ? '✕ Rejected' : '↻ Queued for retry'}
        </div>
      )}
    </div>
  );
}

export function ContentBatchReviewWidget({ data }: Props) {
  if (data.length === 0) return <p className="text-xs text-muted-foreground">No content items.</p>;

  if (data.length === 1) {
    return <ContentDraftDetail draft={data[0]} />;
  }

  return (
    <div className="space-y-2">
      {data.map(draft => (
        <div key={draft.id} className="rounded-lg border border-border bg-card p-3 space-y-1.5">
          <div className="flex items-start gap-2">
            <ChannelIcon channel={draft.channel} size={13} className="mt-0.5 flex-shrink-0" />
            <p className="text-xs font-medium text-foreground leading-snug flex-1">{draft.title}</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">{draft.preview}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusChip status={draft.status} />
            {draft.approvalStatus && <StatusChip status={draft.approvalStatus} />}
          </div>
        </div>
      ))}
    </div>
  );
}
