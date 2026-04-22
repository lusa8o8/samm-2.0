import { StatusChip } from '../shared/StatusChip';
import type { SalesSequence } from '../../types';

interface Props {
  data: SalesSequence[];
}

export function SequenceStatusWidget({ data }: Props) {
  return (
    <div className="space-y-3">
      {data.map(seq => (
        <div key={seq.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">{seq.name}</p>
            <StatusChip status={seq.status as never} showDot />
          </div>
          <p className="text-[11px] text-muted-foreground">Target: {seq.targetSegment}</p>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${(seq.currentStep / seq.totalSteps) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">Step {seq.currentStep}/{seq.totalSteps}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center">
            {[
              { label: 'Enrolled', value: seq.enrolled },
              { label: 'Converted', value: seq.converted },
              { label: 'Rate', value: `${seq.conversionRate}%` },
            ].map(stat => (
              <div key={stat.label} className="bg-muted/40 rounded p-1.5">
                <p className="text-[11px] font-semibold text-foreground">{stat.value}</p>
                <p className="text-[9px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
