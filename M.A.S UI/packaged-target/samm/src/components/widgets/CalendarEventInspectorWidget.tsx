import { Calendar, Target, Users, Tag, Clock, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import type { CalendarEvent } from '../../types';
import { StatusChip } from '../shared/StatusChip';
import { cn } from '@/lib/utils';

interface Props {
  data: CalendarEvent & {
    objective?: string;
    linkedCampaign?: string;
    contentReady?: number;
    contentTotal?: number;
  };
}

const eventTypeColors: Record<string, string> = {
  campaign: 'from-primary/20 to-primary/5',
  campaign_launch: 'from-primary/20 to-primary/5',
  product_launch: 'from-purple-500/20 to-pink-400/5',
  product_release: 'from-purple-500/20 to-pink-400/5',
  seasonal: 'from-amber-500/20 to-orange-400/5',
  holiday: 'from-amber-500/20 to-orange-400/5',
  promotion: 'from-amber-500/20 to-orange-400/5',
  industry_event: 'from-emerald-500/20 to-emerald-300/5',
  webinar: 'from-blue-500/20 to-cyan-300/5',
  newsletter: 'from-slate-500/20 to-slate-300/5',
};

export function CalendarEventInspectorWidget({ data: event }: Props) {
  const gradient = eventTypeColors[event.eventType] ?? 'from-muted/40 to-muted/10';
  const readiness = event.contentTotal && event.contentTotal > 0
    ? Math.round(((event.contentReady ?? 0) / event.contentTotal) * 100)
    : null;

  const showLaunch = event.status === 'ready';
  const showGenerate = event.status === 'planned' && readiness !== null && readiness < 100;

  return (
    <div className="space-y-4">
      <div className={cn('rounded-xl bg-gradient-to-br p-5 border border-border/50', gradient)}>
        <div className="mb-3 flex items-center gap-2">
          <Calendar size={14} className="text-foreground/70" />
          <span className="text-xs font-medium capitalize text-foreground">
            {event.eventType.replace('_', ' ')}
          </span>
        </div>
        <p className="mb-1 text-base font-semibold text-foreground">{event.name}</p>
        <p className="text-[12px] text-muted-foreground">
          {format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')}
          {event.endDate && `  ${format(new Date(event.endDate), 'MMM d')}`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <StatusChip status={event.status as never} />
        <StatusChip status={event.priority} />
        {event.ownerPipeline && (
          <span className="rounded-full border border-border/50 bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            Owner: {event.ownerPipeline}
          </span>
        )}
      </div>

      {readiness !== null && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <FileText size={12} />
              Content readiness
            </span>
            <span className="text-xs text-muted-foreground">
              {event.contentReady} / {event.contentTotal} ready
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                readiness >= 100 ? 'bg-emerald-500' : readiness >= 50 ? 'bg-primary' : 'bg-amber-500'
              )}
              style={{ width: `${readiness}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{readiness}% complete</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {event.targetICP && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Users size={12} className="mt-0.5 shrink-0 text-blue-500" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Target ICP</p>
              <p className="text-[12px] font-medium text-foreground">{event.targetICP}</p>
            </div>
          </div>
        )}
        {event.objective && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Target size={12} className="mt-0.5 shrink-0 text-purple-500" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Objective</p>
              <p className="text-[12px] font-medium text-foreground">{event.objective}</p>
            </div>
          </div>
        )}
        {event.campaignType && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Tag size={12} className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Campaign type</p>
              <p className="text-[12px] font-medium capitalize text-foreground">{event.campaignType}</p>
            </div>
          </div>
        )}
        {event.linkedCampaign && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Clock size={12} className="mt-0.5 shrink-0 text-emerald-500" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Linked campaign</p>
              <p className="text-[12px] font-medium text-foreground">{event.linkedCampaign}</p>
            </div>
          </div>
        )}
      </div>

      {event.notes && (
        <div className="rounded-xl border border-border/60 bg-muted/50 px-4 py-3">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
          <p className="text-[12px] leading-relaxed text-foreground/80">{event.notes}</p>
        </div>
      )}

      {(showLaunch || showGenerate) && (
        <div className="flex gap-2 pt-1">
          {showLaunch && (
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 size={14} /> Launch event
            </button>
          )}
          {showGenerate && (
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
              <AlertCircle size={14} /> Generate remaining content
            </button>
          )}
        </div>
      )}
    </div>
  );
}
