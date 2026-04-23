import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, RefreshCw, Calendar, Tag, Target, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { getListContentQueryKey, useActionContent, useRetryContent } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ChannelIcon } from '../shared/ChannelIcon';
import { StatusChip } from '../shared/StatusChip';
import type { ContentDraft } from '../../types';

type InspectorContentDraft = ContentDraft & {
  platform?: string | null;
  pipelineRunId?: string | null;
};

interface Props {
  data: InspectorContentDraft[];
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

function ContentDraftDetail({ draft }: { draft: InspectorContentDraft }) {
  const queryClient = useQueryClient();
  const [actionState, setActionState] = useState<string | null>(null);
  const gradient = channelGradients[draft.channel] ?? 'from-muted/40 to-muted/10';

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListContentQueryKey() });
    queryClient.invalidateQueries({ queryKey: ['inbox-items'] });
    queryClient.invalidateQueries({ queryKey: ['inbox-summary'] });
    queryClient.invalidateQueries({ queryKey: ['pipeline-status'] });
    queryClient.invalidateQueries({ queryKey: ['pipeline-runs'] });
  };

  const actionMutation = useActionContent({
    mutation: {
      onSuccess: invalidate,
    },
  });
  const retryMutation = useRetryContent({
    mutation: {
      onSuccess: invalidate,
    },
  });

  const handleApprove = async () => {
    await actionMutation.mutateAsync({
      id: draft.id,
      pipelineRunId: draft.pipelineRunId,
      platform: draft.platform,
      data: { action: 'approve' },
    });
    setActionState('approved');
  };

  const handleReject = async () => {
    await actionMutation.mutateAsync({
      id: draft.id,
      pipelineRunId: draft.pipelineRunId,
      platform: draft.platform,
      data: { action: 'reject', note: 'Rejected from packaged content inspector' },
    });
    setActionState('rejected');
  };

  const handleRetry = async () => {
    await retryMutation.mutateAsync({ id: draft.id });
    setActionState('retrying');
  };

  return (
    <div className="space-y-4">
      <div className={cn('flex flex-col gap-3 rounded-xl border border-border/50 bg-gradient-to-br p-5', gradient)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChannelIcon channel={draft.channel} size={16} />
            <span className="text-xs font-medium text-foreground capitalize">
              {draft.channel}
              {" \u00b7 "}
              {draft.contentType}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusChip status={draft.status} />
            {draft.approvalStatus && draft.status === 'draft' && (
              <StatusChip status={(actionState as never) ?? draft.approvalStatus} />
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">{draft.title}</p>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">{draft.preview}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {draft.linkedCampaign && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Link2 size={12} className="mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Campaign</p>
              <p className="text-[12px] font-medium text-foreground">{draft.linkedCampaign}</p>
            </div>
          </div>
        )}
        {draft.objective && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Target size={12} className="mt-0.5 flex-shrink-0 text-purple-500" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Objective</p>
              <p className="text-[12px] font-medium text-foreground">{draft.objective}</p>
            </div>
          </div>
        )}
        {draft.ctaType && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Target size={12} className="mt-0.5 flex-shrink-0 text-amber-500" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">CTA</p>
              <p className="text-[12px] font-medium text-foreground">{draft.ctaType}</p>
            </div>
          </div>
        )}
        {(draft.scheduledFor || draft.publishedAt || draft.createdAt) && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Calendar size={12} className="mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {draft.status === 'scheduled' ? 'Scheduled' : draft.status === 'published' ? 'Published' : 'Created'}
              </p>
              <p className="text-[12px] font-medium text-foreground">
                {format(new Date(draft.scheduledFor ?? draft.publishedAt ?? draft.createdAt), 'MMM d, HH:mm')}
              </p>
            </div>
          </div>
        )}
      </div>

      {draft.patternTags && draft.patternTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag size={11} className="text-muted-foreground" />
          {draft.patternTags.map((tag) => (
            <span key={tag} className="rounded-full border border-border/50 bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {draft.status === 'failed' && draft.failureReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/20">
          <p className="mb-0.5 text-[11px] font-medium text-red-700 dark:text-red-400">Failure reason</p>
          <p className="text-[12px] text-red-700/80 dark:text-red-400/80">{draft.failureReason}</p>
        </div>
      )}

      {!actionState && (
        <div className="flex gap-2 pt-1">
          {draft.status === 'draft' && draft.approvalStatus === 'pending' && (
            <>
              <button
                onClick={() => void handleApprove()}
                disabled={actionMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
              >
                <CheckCircle size={14} /> Approve
              </button>
              <button
                onClick={() => void handleReject()}
                disabled={actionMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
              >
                <XCircle size={14} /> Reject
              </button>
            </>
          )}
          {draft.status === 'failed' && (
            <button
              onClick={() => void handleRetry()}
              disabled={retryMutation.isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
            >
              <RefreshCw size={14} /> Retry
            </button>
          )}
        </div>
      )}

      {actionState && (
        <div
          className={cn(
            'rounded-xl px-4 py-3 text-center text-sm font-medium',
            actionState === 'approved'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
              : actionState === 'rejected'
                ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                : 'bg-primary/10 text-primary',
          )}
        >
          {actionState === 'approved' ? 'Approved' : actionState === 'rejected' ? 'Rejected' : 'Queued for retry'}
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
      {data.map((draft) => (
        <div key={draft.id} className="space-y-1.5 rounded-lg border border-border bg-card p-3">
          <div className="flex items-start gap-2">
            <ChannelIcon channel={draft.channel} size={13} className="mt-0.5 flex-shrink-0" />
            <p className="flex-1 text-xs font-medium leading-snug text-foreground">{draft.title}</p>
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">{draft.preview}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusChip status={draft.status} />
            {draft.approvalStatus && <StatusChip status={draft.approvalStatus} />}
          </div>
        </div>
      ))}
    </div>
  );
}
