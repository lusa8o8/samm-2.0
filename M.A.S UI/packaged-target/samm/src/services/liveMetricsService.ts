import { getOrgId, supabase } from "../../../../src/lib/supabase";
import type { Channel, ChannelMetric, MetricKPI, PatternSummary } from "../types";

type MetricRow = {
  platform?: string | null;
  snapshot_date?: string | null;
  followers?: number | null;
  post_reach?: number | null;
  reach?: number | null;
  engagement_rate?: number | null;
  engagement?: number | null;
  signups?: number | null;
  conversions?: number | null;
  clicks?: number | null;
  link_clicks?: number | null;
  site_clicks?: number | null;
  followers_change?: number | null;
  reach_change?: number | null;
  engagement_change?: number | null;
  signups_change?: number | null;
};

type LiveMetricCard = {
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

function calculatePercentChange(current: number, previous: number) {
  if (!previous && !current) return 0;
  if (!previous) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatSignedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatSignedNumber(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

function toChannel(value?: string | null): Channel | null {
  switch ((value ?? "").toLowerCase()) {
    case "facebook":
      return "facebook";
    case "whatsapp":
      return "whatsapp";
    case "youtube":
      return "youtube";
    case "email":
      return "email";
    case "instagram":
      return "instagram";
    case "linkedin":
      return "linkedin";
    case "twitter":
      return "twitter";
    default:
      return null;
  }
}

function toTrend(value: number): ChannelMetric["trend"] {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

function buildMetricCards(rows: MetricRow[]) {
  const grouped = new Map<string, MetricRow[]>();

  for (const row of rows) {
    const platform = row.platform ?? "";
    if (!platform) continue;
    const list = grouped.get(platform) ?? [];
    list.push(row);
    grouped.set(platform, list);
  }

  return Array.from(grouped.entries())
    .map(([platform, metricRows]) => {
      const latest = metricRows[0];
      const previous = metricRows[1];
      const engagement = latest.engagement_rate ?? latest.engagement ?? 0;
      const previousEngagement = previous?.engagement_rate ?? previous?.engagement ?? 0;

      return {
        platform,
        followers: latest.followers ?? 0,
        post_reach: latest.post_reach ?? latest.reach ?? 0,
        engagement,
        signups: latest.signups ?? latest.conversions ?? 0,
        followers_change:
          latest.followers_change ?? calculatePercentChange(latest.followers ?? 0, previous?.followers ?? 0),
        reach_change:
          latest.reach_change ?? calculatePercentChange(latest.post_reach ?? latest.reach ?? 0, previous?.post_reach ?? previous?.reach ?? 0),
        engagement_change:
          latest.engagement_change ?? calculatePercentChange(engagement, previousEngagement),
        signups_change:
          latest.signups_change ?? calculatePercentChange(latest.signups ?? latest.conversions ?? 0, previous?.signups ?? previous?.conversions ?? 0),
      } satisfies LiveMetricCard;
    })
    .sort((a, b) => b.post_reach - a.post_reach);
}

function buildChannelMetrics(cards: LiveMetricCard[]): ChannelMetric[] {
  return cards
    .map((card) => {
      const channel = toChannel(card.platform);
      if (!channel) return null;

      return {
        channel,
        reach: card.post_reach,
        engagement: card.engagement,
        clicks: card.signups,
        conversions: card.signups,
        trend: toTrend(card.signups_change || card.reach_change),
      } satisfies ChannelMetric;
    })
    .filter(Boolean) as ChannelMetric[];
}

function buildKpis(cards: LiveMetricCard[]): MetricKPI[] {
  if (cards.length === 0) return [];

  const totalReach = cards.reduce((sum, card) => sum + card.post_reach, 0);
  const totalSignups = cards.reduce((sum, card) => sum + card.signups, 0);
  const totalFollowers = cards.reduce((sum, card) => sum + card.followers, 0);
  const avgEngagement = cards.reduce((sum, card) => sum + card.engagement, 0) / cards.length;
  const avgReachDelta = cards.reduce((sum, card) => sum + card.reach_change, 0) / cards.length;
  const avgSignupDelta = cards.reduce((sum, card) => sum + card.signups_change, 0) / cards.length;
  const avgFollowerDelta = cards.reduce((sum, card) => sum + card.followers_change, 0) / cards.length;

  return [
    {
      label: "Reach (latest snapshot)",
      value: formatCompact(totalReach),
      delta: formatSignedPercent(avgReachDelta),
      deltaDirection: avgReachDelta > 0 ? "up" : avgReachDelta < 0 ? "down" : "down",
      deltaGood: avgReachDelta >= 0,
      sublabel: "avg vs previous snapshot",
    },
    {
      label: "Avg engagement rate",
      value: `${avgEngagement.toFixed(1)}%`,
      delta: formatSignedPercent(cards.reduce((sum, card) => sum + card.engagement_change, 0) / cards.length),
      deltaDirection: avgEngagement >= 0 ? "up" : "down",
      deltaGood: avgEngagement >= 0,
      sublabel: "across active channels",
    },
    {
      label: "Signups",
      value: formatCompact(totalSignups),
      delta: formatSignedPercent(avgSignupDelta),
      deltaDirection: avgSignupDelta > 0 ? "up" : avgSignupDelta < 0 ? "down" : "down",
      deltaGood: avgSignupDelta >= 0,
      sublabel: "latest snapshot",
    },
    {
      label: "Followers",
      value: formatCompact(totalFollowers),
      delta: formatSignedPercent(avgFollowerDelta),
      deltaDirection: avgFollowerDelta > 0 ? "up" : avgFollowerDelta < 0 ? "down" : "down",
      deltaGood: avgFollowerDelta >= 0,
      sublabel: `${cards.length} active channels`,
    },
  ];
}

function buildSummary(cards: LiveMetricCard[]) {
  if (cards.length === 0) {
    return "No live platform metrics are available for this workspace yet.";
  }

  const topReach = [...cards].sort((a, b) => b.post_reach - a.post_reach)[0];
  const topSignups = [...cards].sort((a, b) => b.signups - a.signups)[0];
  const topEngagement = [...cards].sort((a, b) => b.engagement - a.engagement)[0];

  return `${topReach.platform} is leading reach right now, ${topSignups.platform} is driving the most signups, and ${topEngagement.platform} has the strongest engagement rate. Use this surface to spot where baseline effort is compounding and where campaign support is converting cleanly.`;
}

function buildPatterns(cards: LiveMetricCard[], latestSnapshot: string | null): PatternSummary[] {
  if (cards.length === 0) return [];

  const topReach = [...cards].sort((a, b) => b.post_reach - a.post_reach)[0];
  const topSignups = [...cards].sort((a, b) => b.signups - a.signups)[0];
  const topEngagement = [...cards].sort((a, b) => b.engagement - a.engagement)[0];

  const patterns: PatternSummary[] = [];

  const reachChannel = toChannel(topReach.platform);
  if (reachChannel) {
    patterns.push({
      id: `top-reach-${topReach.platform}`,
      pattern: `${topReach.platform} is leading reach`,
      description: `${topReach.platform} is currently producing the largest audience footprint with ${formatCompact(topReach.post_reach)} reach on the latest snapshot.`,
      frequency: topReach.post_reach,
      impact: "high",
      channels: [reachChannel],
      lastSeen: latestSnapshot ?? new Date().toISOString(),
      recommendation: `Keep high-visibility creative and campaign anchors strong on ${topReach.platform}.`,
    });
  }

  const signupChannel = toChannel(topSignups.platform);
  if (signupChannel) {
    patterns.push({
      id: `top-signups-${topSignups.platform}`,
      pattern: `${topSignups.platform} is converting best`,
      description: `${topSignups.platform} delivered ${topSignups.signups} signups on the latest snapshot, making it the strongest current conversion channel.`,
      frequency: topSignups.signups,
      impact: "high",
      channels: [signupChannel],
      lastSeen: latestSnapshot ?? new Date().toISOString(),
      recommendation: `Preserve strong CTA clarity on ${topSignups.platform} and use it for campaign closes.`,
    });
  }

  const engagementChannel = toChannel(topEngagement.platform);
  if (engagementChannel) {
    patterns.push({
      id: `top-engagement-${topEngagement.platform}`,
      pattern: `${topEngagement.platform} has the strongest engagement`,
      description: `${topEngagement.platform} is currently showing the highest engagement rate at ${topEngagement.engagement.toFixed(1)}%.`,
      frequency: Math.round(topEngagement.engagement * 10),
      impact: "medium",
      channels: [engagementChannel],
      lastSeen: latestSnapshot ?? new Date().toISOString(),
      recommendation: `Use ${topEngagement.platform} for conversation-driving and trust-building content.`,
    });
  }

  return patterns;
}

function buildSparkData(rows: MetricRow[]) {
  const grouped = new Map<string, { reach: number; engagementTotal: number; engagementCount: number }>();

  for (const row of rows) {
    const dateKey = row.snapshot_date ?? "";
    if (!dateKey) continue;
    const current = grouped.get(dateKey) ?? { reach: 0, engagementTotal: 0, engagementCount: 0 };
    current.reach += row.post_reach ?? row.reach ?? 0;
    current.engagementTotal += row.engagement_rate ?? row.engagement ?? 0;
    current.engagementCount += 1;
    grouped.set(dateKey, current);
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-4)
    .map(([date, value], index) => ({
      week: `S${index + 1}`,
      reach: value.reach,
      engagement: value.engagementCount > 0 ? value.engagementTotal / value.engagementCount : 0,
      date,
    }));
}

function buildPeriodLabel(latestSnapshot: string | null) {
  if (!latestSnapshot) return "No snapshot available";
  const date = new Date(latestSnapshot);
  return `Latest snapshot · ${date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`;
}

export async function getMetrics() {
  const { data, error } = await supabase
    .from("platform_metrics")
    .select("*")
    .eq("org_id", getOrgId())
    .order("snapshot_date", { ascending: false })
    .limit(80);

  if (error) throw error;

  const rows = (data ?? []) as MetricRow[];
  const cards = buildMetricCards(rows);
  const latestSnapshot = rows[0]?.snapshot_date ?? null;

  return {
    kpis: buildKpis(cards),
    channels: buildChannelMetrics(cards),
    patterns: buildPatterns(cards, latestSnapshot),
    summary: buildSummary(cards),
    sparkData: buildSparkData(rows),
    periodLabel: buildPeriodLabel(latestSnapshot),
  };
}
