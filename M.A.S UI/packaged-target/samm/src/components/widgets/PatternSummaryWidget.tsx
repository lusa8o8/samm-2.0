import { Lightbulb } from 'lucide-react';
import { StatusChip } from '../shared/StatusChip';
import { ChannelIcon } from '../shared/ChannelIcon';
import type { PatternSummary } from '../../types';

interface Props {
  data: PatternSummary[];
}

export function PatternSummaryWidget({ data }: Props) {
  return (
    <div className="space-y-3">
      {data.map(pattern => (
        <div key={pattern.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Lightbulb size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-foreground leading-snug">{pattern.pattern}</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{pattern.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusChip status={pattern.impact} />
            <span className="flex items-center gap-1">
              {pattern.channels.map(ch => (
                <ChannelIcon key={ch} channel={ch} size={11} />
              ))}
            </span>
            <span className="text-[10px] text-muted-foreground">{pattern.frequency} occurrences</span>
          </div>
          {pattern.recommendation && (
            <div className="bg-primary/5 border border-primary/20 rounded px-2 py-1.5">
              <p className="text-[10px] font-medium text-primary">Recommendation: {pattern.recommendation}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
