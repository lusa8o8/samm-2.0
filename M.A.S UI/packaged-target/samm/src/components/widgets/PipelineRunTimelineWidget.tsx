import { StatusChip } from '../shared/StatusChip';
import type { PipelineRun } from '../../types';
import { format } from 'date-fns';

interface Props {
  data: PipelineRun[];
}

export function PipelineRunTimelineWidget({ data }: Props) {
  return (
    <div className="space-y-2">
      {data.map(run => (
        <div key={run.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground">{run.pipelineName}</span>
            <StatusChip status={run.status} showDot />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${run.stepTotal > 0 ? (run.stepCurrent / run.stepTotal) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{run.stepCurrent}/{run.stepTotal}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">{run.stepName}</p>
          {run.message && (
            <p className="text-[10px] text-muted-foreground/70 leading-snug">{run.message}</p>
          )}
          <p className="text-[10px] text-muted-foreground/50">
            Last activity: {format(new Date(run.lastActivity), 'HH:mm')}
          </p>
        </div>
      ))}
    </div>
  );
}
