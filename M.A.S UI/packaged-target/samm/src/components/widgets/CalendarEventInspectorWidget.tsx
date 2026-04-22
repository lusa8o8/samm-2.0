import { CalendarDays, Sparkles, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import type { CalendarEvent } from '../../types';
import { StatusChip } from '../shared/StatusChip';

interface Props {
  data: CalendarEvent;
}

export function CalendarEventInspectorWidget({ data }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{data.name}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays size={12} />
              <span>
                {format(new Date(data.startDate), 'MMM d, yyyy')}
                {data.endDate ? ` to ${format(new Date(data.endDate), 'MMM d, yyyy')}` : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusChip status={data.priority} />
            <StatusChip status={data.status as never} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[12px]">
          {data.campaignType && (
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Type</p>
              <p className="text-foreground font-medium mt-0.5">{data.campaignType}</p>
            </div>
          )}
          {data.targetICP && (
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Audience tags</p>
              <p className="text-foreground font-medium mt-0.5">{data.targetICP}</p>
            </div>
          )}
          {data.ownerPipeline && (
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Owner pipeline</p>
              <p className="text-foreground font-medium mt-0.5">Pipeline {data.ownerPipeline}</p>
            </div>
          )}
          {data.linkedCampaign && (
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Linked campaign</p>
              <p className="text-foreground font-medium mt-0.5">{data.linkedCampaign}</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campaign window rules</p>

        <div className="flex items-start gap-3 rounded-lg bg-background px-3 py-2 border border-border/60">
          <ShieldCheck size={14} className={`mt-0.5 ${data.supportContentAllowed ? 'text-emerald-600' : 'text-slate-400'}`} />
          <div>
            <p className="text-sm font-medium text-foreground">Support content</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {data.supportContentAllowed
                ? 'Pipeline B may fill support-only slots inside this campaign window.'
                : 'Pipeline B is blocked unless support content is explicitly enabled.'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-background px-3 py-2 border border-border/60">
          <Sparkles size={14} className={`mt-0.5 ${data.creativeOverrideAllowed ? 'text-amber-500' : 'text-slate-400'}`} />
          <div>
            <p className="text-sm font-medium text-foreground">Creative deviation</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {data.creativeOverrideAllowed
                ? 'Design work may deviate from the standard palette within the approved creative bounds.'
                : 'Design work should stay inside the standard brand rules for this event.'}
            </p>
          </div>
        </div>
      </div>

      {data.notes && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{data.notes}</p>
        </div>
      )}
    </div>
  );
}
