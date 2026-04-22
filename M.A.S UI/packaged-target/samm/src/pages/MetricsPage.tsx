import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart2, Lightbulb } from 'lucide-react';
import { ChannelIcon } from '../components/shared/ChannelIcon';
import { getMetrics } from '../services/mockService';
import type { MetricKPI, ChannelMetric, PatternSummary, Channel } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const sparkData = [
  { week: 'W14', reach: 88000, engagement: 3.8 },
  { week: 'W15', reach: 96000, engagement: 4.1 },
  { week: 'W16', reach: 110000, engagement: 4.3 },
  { week: 'W17', reach: 124840, engagement: 4.7 },
];

const channelLabels: Record<Channel, string> = {
  linkedin: 'LinkedIn',
  twitter: 'X (Twitter)',
  instagram: 'Instagram',
  email: 'Email',
  facebook: 'Facebook',
};

function KPICard({ kpi }: { kpi: MetricKPI }) {
  const isUp = kpi.deltaDirection === 'up';
  const TrendIcon = isUp ? TrendingUp : kpi.deltaDirection === 'down' ? TrendingDown : Minus;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
      <p className="text-xs text-muted-foreground">{kpi.label}</p>
      <p className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</p>
      <div className={`flex items-center gap-1 text-xs font-medium ${kpi.deltaGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
        <TrendIcon size={12} />
        {kpi.delta}
        {kpi.sublabel && <span className="text-muted-foreground font-normal ml-1">{kpi.sublabel}</span>}
      </div>
    </div>
  );
}

function ChannelRow({ metric }: { metric: ChannelMetric }) {
  const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus;
  const trendColor = metric.trend === 'up' ? 'text-emerald-600' : metric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2 w-32 flex-shrink-0">
        <ChannelIcon channel={metric.channel} size={14} />
        <span className="text-sm font-medium text-foreground">{channelLabels[metric.channel]}</span>
      </div>
      <div className="grid grid-cols-4 gap-4 flex-1 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Reach</p>
          <p className="font-semibold">{(metric.reach / 1000).toFixed(1)}k</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Engagement</p>
          <p className="font-semibold">{metric.engagement}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Clicks</p>
          <p className="font-semibold">{metric.clicks.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Conversions</p>
          <p className="font-semibold">{metric.conversions}</p>
        </div>
      </div>
      <div className="w-8 flex justify-end">
        <TrendIcon size={14} className={trendColor} />
      </div>
    </div>
  );
}

export default function MetricsPage() {
  const [kpis, setKpis] = useState<MetricKPI[]>([]);
  const [channels, setChannels] = useState<ChannelMetric[]>([]);
  const [patterns, setPatterns] = useState<PatternSummary[]>([]);

  useEffect(() => {
    getMetrics().then(d => {
      setKpis(d.kpis);
      setChannels(d.channels);
      setPatterns(d.patterns);
    });
  }, []);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <h1 className="text-xl font-semibold text-foreground">Metrics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Week 17 · Apr 14 – Apr 20, 2026</p>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {kpis.map(kpi => <KPICard key={kpi.label} kpi={kpi} />)}
        </div>

        {/* SAMM insight */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <BarChart2 size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">SAMM summary</p>
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
              Reach is up 18% week-over-week, driven primarily by the LinkedIn engagement sprint running this week. Email continues to lead on engagement rate (38.4%) and conversion. LinkedIn generates the most volume but email converts best — a pattern worth leaning into for Spring Sale outreach.
            </p>
          </div>
        </div>

        {/* Trend chart */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-4">Reach trend — last 4 weeks</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" className="text-[11px]" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(v: number) => [`${(v / 1000).toFixed(1)}k`, 'Reach']}
                />
                <Line type="monotone" dataKey="reach" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel breakdown */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-1">Channel performance</p>
          <p className="text-xs text-muted-foreground mb-4">Week 17 rolling totals</p>
          {channels.map(ch => <ChannelRow key={ch.channel} metric={ch} />)}
        </div>

        {/* Pattern insights */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={14} className="text-amber-500" />
            <p className="text-sm font-semibold text-foreground">Detected content patterns</p>
          </div>
          <div className="space-y-3">
            {patterns.map(p => (
              <div key={p.id} className="border border-border rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold text-foreground">{p.pattern}</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{p.description}</p>
                {p.recommendation && (
                  <p className="text-[11px] text-primary font-medium">→ {p.recommendation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
