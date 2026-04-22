import { TrendingUp, TrendingDown } from 'lucide-react';
import type { MetricKPI } from '../../types';

interface Props {
  data: MetricKPI[];
}

export function MetricsSnapshotWidget({ data }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {data.slice(0, 4).map(kpi => (
        <div key={kpi.label} className="rounded-lg border border-border bg-card p-3 space-y-1">
          <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
          <p className="text-lg font-semibold text-foreground">{kpi.value}</p>
          <div className={`flex items-center gap-0.5 text-[10px] font-medium ${kpi.deltaGood ? 'text-emerald-600' : 'text-red-500'}`}>
            {kpi.deltaDirection === 'up'
              ? <TrendingUp size={10} />
              : <TrendingDown size={10} />
            }
            {kpi.delta}
          </div>
        </div>
      ))}
    </div>
  );
}
