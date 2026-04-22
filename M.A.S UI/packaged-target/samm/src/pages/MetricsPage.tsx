import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart2, Lightbulb } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChannelIcon } from '../components/shared/ChannelIcon';
import { getMetrics } from '../services/liveMetricsService';
import type { MetricKPI, ChannelMetric, PatternSummary, Channel } from '../types';

const channelLabels: Record<Channel, string> = {
  linkedin: 'LinkedIn',
  twitter: 'X (Twitter)',
  instagram: 'Instagram',
  email: 'Email',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  youtube: 'YouTube',
  design_brief: 'Design Brief',
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
  const [sparkData, setSparkData] = useState<Array<{ week: string; reach: number; engagement: number; date: string }>>([]);
  const [summary, setSummary] = useState('Loading live metrics summary...');
  const [periodLabel, setPeriodLabel] = useState('Loading snapshot...');

  useEffect(() => {
    getMetrics().then((data) => {
      setKpis(data.kpis);
      setChannels(data.channels);
      setPatterns(data.patterns);
      setSparkData(data.sparkData);
      setSummary(data.summary);
      setPeriodLabel(data.periodLabel);
    });
  }, []);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <h1 className="text-xl font-semibold text-foreground">Metrics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{periodLabel}</p>
      </div>

      <div className="px-6 py-6 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {kpis.map((kpi) => <KPICard key={kpi.label} kpi={kpi} />)}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <BarChart2 size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">SAMM summary</p>
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
              {summary}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-4">Reach trend - latest 4 snapshots</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" className="text-[11px]" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`${(value / 1000).toFixed(1)}k`, 'Reach']}
                />
                <Line type="monotone" dataKey="reach" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-1">Channel performance</p>
          <p className="text-xs text-muted-foreground mb-4">Latest platform snapshot totals</p>
          {channels.map((channel) => <ChannelRow key={channel.channel} metric={channel} />)}
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={14} className="text-amber-500" />
            <p className="text-sm font-semibold text-foreground">Detected content patterns</p>
          </div>
          <div className="space-y-3">
            {patterns.map((pattern) => (
              <div key={pattern.id} className="border border-border rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold text-foreground">{pattern.pattern}</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{pattern.description}</p>
                {pattern.recommendation && (
                  <p className="text-[11px] text-primary font-medium">{"-> "}{pattern.recommendation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
