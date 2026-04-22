import { Mail, TrendingDown, TrendingUp, Minus, BarChart3, ExternalLink } from "lucide-react";
import { SiFacebook, SiWhatsapp, SiYoutube } from "react-icons/si";
import { useGetMetricsSparklines, useListMetrics } from "@/lib/api";
import { useWorkspaceInspector } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createInspectorPayload } from "@/lib/workspace-adapter";
import { cn } from "@/lib/utils";

const PLATFORM_META: Record<string, { name: string; icon: React.ElementType; color: string }> = {
  facebook: { name: "Facebook", icon: SiFacebook, color: "text-[#1877F2]" },
  whatsapp: { name: "WhatsApp", icon: SiWhatsapp, color: "text-[#25D366]" },
  youtube: { name: "YouTube", icon: SiYoutube, color: "text-[#FF0000]" },
  email: { name: "Email Newsletter", icon: Mail, color: "text-slate-700" },
};

type MetricCardItem = {
  platform: string;
  followers: number;
  post_reach: number;
  engagement: number;
  signups: number;
  followers_change: number;
  reach_change: number;
  engagement_change: number;
  signups_change: number;
};

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function DeltaPill({ value }: { value: number }) {
  const tone = value > 0 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : value < 0 ? "text-red-700 bg-red-50 border-red-200" : "text-slate-600 bg-slate-50 border-slate-200";
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", tone)}>
      <Icon className="h-3 w-3" />
      {formatPercent(value)}
    </span>
  );
}

function Sparkline({ points }: { points: Array<{ value: number }> }) {
  const values = points.map((point) => point.value);
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-10 items-end gap-1">
      {points.map((point, index) => (
        <div
          key={`${point.value}-${index}`}
          className="flex-1 rounded-sm bg-primary/70"
          style={{ height: `${Math.max((point.value / max) * 100, point.value > 0 ? 12 : 4)}%` }}
          title={`${point.value} signups`}
        />
      ))}
    </div>
  );
}

function MetricCard({ item, sparkline }: { item: MetricCardItem; sparkline: Array<{ value: number }> }) {
  const { openInspector } = useWorkspaceInspector();
  const platformMeta = PLATFORM_META[item.platform] ?? { name: item.platform, icon: BarChart3, color: "text-slate-700" };
  const PlatformIcon = platformMeta.icon;
  const inspectorPayload = createInspectorPayload(
    `${platformMeta.name} metrics`,
    {
      type: "metrics_snapshot",
      title: `${platformMeta.name} live metrics`,
      data: {
        ...item,
        sparkline,
      },
    },
    "Live metrics snapshot with current deltas and recent sign-up movement."
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-border bg-muted/40 p-3">
            <PlatformIcon className={cn("h-5 w-5", platformMeta.color)} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{platformMeta.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Current reach, engagement, and signup movement</p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => openInspector(inspectorPayload)}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Inspect
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricStat label="Followers" value={formatCompactNumber(item.followers)} delta={item.followers_change} />
        <MetricStat label="Reach" value={formatCompactNumber(item.post_reach)} delta={item.reach_change} />
        <MetricStat label="Engagement" value={`${item.engagement.toFixed(1)}%`} delta={item.engagement_change} />
        <MetricStat label="Signups" value={formatCompactNumber(item.signups)} delta={item.signups_change} />
      </div>

      <div className="mt-5 rounded-xl border bg-muted/20 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Recent signup movement</p>
          <Badge variant="outline" className="text-[10px]">Last 7 snapshots</Badge>
        </div>
        <Sparkline points={sparkline} />
      </div>
    </div>
  );
}

function MetricStat({ label, value, delta }: { label: string; value: string; delta: number }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <DeltaPill value={delta} />
      </div>
    </div>
  );
}

export default function Metrics() {
  const { data: metrics, isLoading } = useListMetrics();
  const { data: sparklines } = useGetMetricsSparklines();
  const metricItems = (metrics ?? []) as MetricCardItem[];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(244,241,235,0.45)_0%,rgba(244,241,235,0)_30%)]">
      <header className="shrink-0 border-b border-border/80 bg-background/95 px-4 py-4 backdrop-blur md:px-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Platform Metrics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Weekly reach, engagement, and sign-up movement across every active channel.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto bg-muted/10 px-4 py-5 md:px-6 md:py-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-border bg-muted/40 p-3 text-foreground">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">Live marketing metrics</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                    This surface now reads the real org-scoped metrics snapshot table. Use the inspector on any channel to review the raw workspace object behind the summary card.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.values(PLATFORM_META).map((platform) => (
                    <div
                      key={platform.name}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                    >
                      <platform.icon className={cn("h-4 w-4", platform.color)} />
                      <span>{platform.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {isLoading ? (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-28 w-full rounded-xl" />
                </div>
              ))}
            </section>
          ) : metricItems.length === 0 ? (
            <section className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground shadow-sm">
              <p>No live platform metrics found for this workspace yet.</p>
            </section>
          ) : (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metricItems.map((item) => (
                <MetricCard key={item.platform} item={item} sparkline={sparklines?.[item.platform] ?? []} />
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
