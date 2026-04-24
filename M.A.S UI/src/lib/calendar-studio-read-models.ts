import { useQuery } from "@tanstack/react-query";
import {
  addDays as addCalendarDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type {
  AssetReadinessRecordViewData,
  AssetReadinessState,
  CalendarDayCellViewData,
  CalendarDayPanelViewData,
  CalendarMonthGridViewData,
  CampaignColor,
  CampaignKind,
  CampaignPanelViewData,
  CampaignTimelineCell,
  DayCounts,
  DayOwnershipMode,
  WorkspaceApprovalStatus,
  WorkspaceChannel,
  WorkspaceContentStatus,
  WorkspacePipelineId,
} from "@/components/workspace/calendar-studio/types";
import { getOrgId, supabase } from "@/lib/supabase";

type QueryHookOptions = { query?: Record<string, any> };

type CalendarStudioCalendarRow = {
  id: string;
  label?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  event_end_date?: string | null;
  lead_days?: number | null;
  owner_pipeline?: string | null;
  pipeline_trigger?: string | null;
  exclusive_campaign?: boolean | null;
  support_content_allowed?: boolean | null;
  creative_override_allowed?: boolean | null;
  channels_in_scope?: string[] | null;
  allowed_ctas?: string[] | null;
  disallowed_ctas?: string[] | null;
  primary_message?: string | null;
  content_types_required?: string[] | null;
  posting_frequency?: string | null;
  priority?: number | null;
  max_posts_per_day?: number | null;
  universities?: string[] | null;
  objective?: string | null;
  target_audience_note?: string | null;
  asset_notes?: string | null;
  source_asset_url?: string | null;
  planning_notes?: string | null;
};

type CalendarStudioContentRow = {
  id: string;
  status?: string | null;
  platform?: string | null;
  subject_line?: string | null;
  campaign_name?: string | null;
  body?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  media_url?: string | null;
  rejection_note?: string | null;
  metadata?: Record<string, unknown> | null;
  pipeline_run_id?: string | null;
};

type CalendarStudioPipelineRunRow = {
  id: string;
  pipeline?: string | null;
  status?: string | null;
  started_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  error_message?: string | null;
  result?: Record<string, unknown> | null;
};

type CalendarStudioSourceBundle = {
  calendarRows: CalendarStudioCalendarRow[];
  contentRows: NormalizedContentRow[];
  pipelineRuns: CalendarStudioPipelineRunRow[];
  windows: ResolvedStudioWindow[];
};

type ResolvedStudioWindow = {
  id: string;
  eventId: string;
  label: string;
  eventType: string;
  startDate: string;
  endDate: string;
  windowStart: string;
  windowEnd: string;
  priority: number;
  ownerPipeline: WorkspacePipelineId;
  exclusivity: "exclusive" | "allows_support";
  supportContentAllowed: boolean;
  channelsInScope: WorkspaceChannel[];
  maxPostsPerDay: number;
  color: CampaignColor;
  kind: CampaignKind;
  objective: string;
  targetAudience: string;
  messagingConstraints: string[];
  ctaRules: string[];
  offerInScope?: string;
  planningNotes?: string;
  row: CalendarStudioCalendarRow;
};

type NormalizedContentRow = {
  id: string;
  rawStatus: string;
  uiStatus: WorkspaceContentStatus;
  approvalStatus: WorkspaceApprovalStatus;
  channel: WorkspaceChannel | null;
  rawPlatform: string | null;
  title: string;
  campaignId: string | null;
  windowId: string | null;
  createdAt: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  bucketDate: string | null;
  mediaUrl: string | null;
  rejectionNote: string | null;
  isDesignBrief: boolean;
  metadata: Record<string, unknown>;
};

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DEFAULT_LEAD_DAYS = 21;

function getCalendarStudioSourceQueryKey() {
  return ["calendar-studio", "source", getOrgId()];
}

function parseDateValue(value: string | Date) {
  if (value instanceof Date) return value;
  return value.includes("T") ? new Date(value) : parseISO(value);
}

function toDayKey(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "yyyy-MM-dd");
}

function parseMonthIso(monthIso: string) {
  const normalized = /^\d{4}-\d{2}$/.test(monthIso) ? `${monthIso}-01` : monthIso;
  return parseISO(normalized);
}

function safeString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function safeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function safeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => safeString(item))
    .filter((item): item is string => Boolean(item));
}

function asRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizeText(value: unknown) {
  return safeString(value)?.toLowerCase() ?? "";
}

function normalizePipelineId(value?: string | null): WorkspacePipelineId {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("pipeline-a")) return "A";
  if (normalized.includes("pipeline-b")) return "B";
  if (normalized.includes("pipeline-c")) return "C";
  if (normalized.includes("pipeline-d")) return "D";
  if (normalized.includes("publish")) return "publish";
  return "C";
}

function normalizeChannel(value?: string | null): WorkspaceChannel | null {
  const normalized = (value ?? "").toLowerCase();
  switch (normalized) {
    case "facebook":
      return "facebook";
    case "email":
      return "email";
    case "instagram":
      return "instagram";
    case "linkedin":
      return "linkedin";
    case "twitter":
    case "x":
      return "twitter";
    case "whatsapp":
      return "whatsapp";
    case "youtube":
      return "youtube";
    default:
      return null;
  }
}

function normalizeCampaignColor(eventType?: string | null): CampaignColor {
  const normalized = (eventType ?? "").toLowerCase();
  if (normalized.includes("promotion") || normalized.includes("seasonal") || normalized.includes("holiday")) return "amber";
  if (normalized.includes("webinar") || normalized.includes("community")) return "blue";
  if (normalized.includes("newsletter")) return "slate";
  if (normalized.includes("launch") || normalized.includes("campaign") || normalized.includes("product")) return "purple";
  return "slate";
}

function normalizeCampaignKind(eventType?: string | null): CampaignKind {
  const normalized = (eventType ?? "").toLowerCase();
  if (normalized.includes("promotion")) return "promotion";
  if (normalized.includes("seasonal") || normalized.includes("holiday")) return "seasonal";
  if (normalized.includes("webinar") || normalized.includes("community")) return "webinar";
  if (normalized.includes("newsletter")) return "newsletter";
  if (normalized.includes("launch") || normalized.includes("campaign") || normalized.includes("product")) return "launch";
  return "always_on";
}

function derivePriority(row: CalendarStudioCalendarRow) {
  const explicit = safeNumber(row.priority);
  if (explicit !== null) return explicit;

  const normalized = (row.event_type ?? "").toLowerCase();
  if (normalized.includes("holiday") || normalized.includes("seasonal")) return 80;
  if (normalized.includes("campaign") || normalized.includes("promotion") || normalized.includes("launch")) return 75;
  return 60;
}

function compareWindows(a: ResolvedStudioWindow, b: ResolvedStudioWindow) {
  const priorityDelta = b.priority - a.priority;
  if (priorityDelta !== 0) return priorityDelta;

  const durationDelta =
    differenceInCalendarDays(parseISO(a.windowEnd), parseISO(a.windowStart)) -
    differenceInCalendarDays(parseISO(b.windowEnd), parseISO(b.windowStart));
  if (durationDelta !== 0) return durationDelta;

  const startDelta = parseISO(a.windowStart).getTime() - parseISO(b.windowStart).getTime();
  if (startDelta !== 0) return startDelta;

  return a.id.localeCompare(b.id);
}

function buildMessagingConstraints(row: CalendarStudioCalendarRow, supportContentAllowed: boolean) {
  const constraints: string[] = [];
  const primaryMessage = safeString(row.primary_message);
  const requiredTypes = safeStringArray(row.content_types_required);
  const postingFrequency = safeString(row.posting_frequency);

  if (primaryMessage) constraints.push(primaryMessage);
  if (requiredTypes.length > 0) constraints.push(`Required content types: ${requiredTypes.join(", ")}`);
  if (postingFrequency) constraints.push(`Posting frequency: ${postingFrequency}`);
  if (!supportContentAllowed) constraints.push("Support content is blocked inside this campaign window.");

  return constraints.length > 0 ? constraints : ["No explicit messaging constraints configured."];
}

function buildCtaRules(row: CalendarStudioCalendarRow) {
  const allowed = safeStringArray(row.allowed_ctas);
  const disallowed = safeStringArray(row.disallowed_ctas);
  const rules: string[] = [];

  if (allowed.length > 0) rules.push(`Allowed CTAs: ${allowed.join(", ")}`);
  if (disallowed.length > 0) rules.push(`Avoid CTAs: ${disallowed.join(", ")}`);

  return rules.length > 0 ? rules : ["No explicit CTA rules configured."];
}

function resolveStudioWindow(row: CalendarStudioCalendarRow): ResolvedStudioWindow | null {
  const eventId = safeString(row.id);
  const eventDate = safeString(row.event_date);
  if (!eventId || !eventDate) return null;

  const leadDays = safeNumber(row.lead_days) ?? DEFAULT_LEAD_DAYS;
  const windowStart = format(addCalendarDays(parseISO(eventDate), -leadDays), "yyyy-MM-dd");
  const windowEnd = safeString(row.event_end_date) ?? eventDate;
  const supportContentAllowed = Boolean(row.support_content_allowed);
  const ownerPipeline = normalizePipelineId(row.owner_pipeline ?? row.pipeline_trigger ?? null);
  const channelsInScope = safeStringArray(row.channels_in_scope)
    .map((channel) => normalizeChannel(channel))
    .filter((channel): channel is WorkspaceChannel => Boolean(channel));
  const label = safeString(row.label) ?? "Campaign window";
  const objective = safeString(row.objective) ?? safeString(row.primary_message) ?? label;
  const targetAudience =
    safeString(row.target_audience_note) ??
    (safeStringArray(row.universities).length > 0 ? safeStringArray(row.universities).join(", ") : "General audience");

  return {
    id: `window:${eventId}`,
    eventId,
    label,
    eventType: safeString(row.event_type) ?? "other",
    startDate: eventDate,
    endDate: windowEnd,
    windowStart,
    windowEnd,
    priority: derivePriority(row),
    ownerPipeline,
    exclusivity: row.exclusive_campaign ? "exclusive" : "allows_support",
    supportContentAllowed,
    channelsInScope,
    maxPostsPerDay: safeNumber(row.max_posts_per_day) ?? (channelsInScope.length > 0 ? channelsInScope.length : 1),
    color: normalizeCampaignColor(row.event_type),
    kind: normalizeCampaignKind(row.event_type),
    objective,
    targetAudience,
    messagingConstraints: buildMessagingConstraints(row, supportContentAllowed),
    ctaRules: buildCtaRules(row),
    planningNotes: safeString(row.planning_notes) ?? undefined,
    row,
  };
}

function toUiContentStatus(status?: string | null): WorkspaceContentStatus {
  if (status === "pending_approval") return "draft";
  if (status === "approved") return "scheduled";
  if (status === "published") return "published";
  if (status === "failed") return "failed";
  return "draft";
}

function toApprovalStatus(status?: string | null): WorkspaceApprovalStatus {
  if (status === "approved" || status === "scheduled" || status === "published") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

function getBucketDate(row: CalendarStudioContentRow) {
  const rawStatus = (row.status ?? "").toLowerCase();

  if (rawStatus === "scheduled" || rawStatus === "approved") {
    return toDayKey(row.scheduled_at);
  }
  if (rawStatus === "published") {
    return toDayKey(row.published_at) ?? toDayKey(row.scheduled_at);
  }
  if (["draft", "pending_approval", "rejected", "failed"].includes(rawStatus)) {
    return toDayKey(row.created_at);
  }

  return null;
}

function getContentTitle(row: CalendarStudioContentRow) {
  return (
    safeString(row.subject_line) ??
    safeString(row.campaign_name) ??
    safeString(row.platform)?.replace(/_/g, " ") ??
    "Content item"
  );
}

function normalizeContentRows(rows: CalendarStudioContentRow[], windows: ResolvedStudioWindow[]) {
  const labelToCampaignId = new Map<string, string>();
  for (const window of windows) {
    labelToCampaignId.set(normalizeText(window.label), window.eventId);
  }

  return rows.map((row) => {
    const metadata = asRecord(row.metadata);
    const metadataCampaignId = safeString(metadata.campaign_ref);
    const metadataWindowId = safeString(metadata.window_ref);
    const fallbackCampaignId = labelToCampaignId.get(normalizeText(row.campaign_name)) ?? null;
    const campaignId = metadataCampaignId ?? fallbackCampaignId;
    const windowId = metadataWindowId ?? (campaignId ? `window:${campaignId}` : null);
    const rawStatus = (row.status ?? "draft").toLowerCase();
    const rawPlatform = safeString(row.platform)?.toLowerCase() ?? null;
    const isDesignBrief = rawPlatform === "design_brief";

    return {
      id: row.id,
      rawStatus,
      uiStatus: toUiContentStatus(rawStatus),
      approvalStatus: toApprovalStatus(rawStatus),
      channel: normalizeChannel(rawPlatform),
      rawPlatform,
      title: getContentTitle(row),
      campaignId,
      windowId,
      createdAt: safeString(row.created_at),
      scheduledAt: safeString(row.scheduled_at),
      publishedAt: safeString(row.published_at),
      bucketDate: getBucketDate(row),
      mediaUrl: safeString(row.media_url),
      rejectionNote: safeString(row.rejection_note),
      isDesignBrief,
      metadata,
    } satisfies NormalizedContentRow;
  });
}

function touchesDay(window: ResolvedStudioWindow, dayKey: string) {
  return window.windowStart <= dayKey && window.windowEnd >= dayKey;
}

function overlapsRange(window: ResolvedStudioWindow, rangeStart: string, rangeEnd: string) {
  return window.windowStart <= rangeEnd && window.windowEnd >= rangeStart;
}

function getContentRowsForDay(source: CalendarStudioSourceBundle, dayKey: string) {
  return source.contentRows.filter((row) => row.bucketDate === dayKey);
}

function getActiveWindowsForDay(source: CalendarStudioSourceBundle, dayKey: string) {
  return source.windows.filter((window) => touchesDay(window, dayKey)).sort(compareWindows);
}

function getLinkedContentForWindow(source: CalendarStudioSourceBundle, window: ResolvedStudioWindow) {
  return source.contentRows.filter((row) => row.windowId === window.id || row.campaignId === window.eventId);
}

function getPriorityRank(status: string) {
  if (status === "scheduled" || status === "approved") return 0;
  if (status === "draft" || status === "pending_approval" || status === "rejected") return 1;
  if (status === "failed") return 2;
  return 3;
}

function sortContentRows(a: NormalizedContentRow, b: NormalizedContentRow) {
  const rankDelta = getPriorityRank(a.rawStatus) - getPriorityRank(b.rawStatus);
  if (rankDelta !== 0) return rankDelta;

  const aTime = parseDateValue(a.scheduledAt ?? a.publishedAt ?? a.createdAt ?? new Date(0)).getTime();
  const bTime = parseDateValue(b.scheduledAt ?? b.publishedAt ?? b.createdAt ?? new Date(0)).getTime();
  return bTime - aTime;
}

function buildDayCounts(rows: NormalizedContentRow[]): DayCounts {
  const actionableRows = rows.filter((row) => !row.isDesignBrief);
  return {
    scheduled: actionableRows.filter((row) => row.rawStatus === "scheduled" || row.rawStatus === "approved").length,
    drafts: actionableRows.filter((row) => ["draft", "pending_approval", "rejected"].includes(row.rawStatus)).length,
    failed: actionableRows.filter((row) => row.rawStatus === "failed").length,
    waitingApproval: actionableRows.filter((row) => ["draft", "pending_approval"].includes(row.rawStatus)).length,
  };
}

function buildDayOwnershipMode(activeWindows: ResolvedStudioWindow[], rows: NormalizedContentRow[]): DayOwnershipMode {
  if (activeWindows.length > 1) return "mixed";
  if (activeWindows.length === 1) {
    return activeWindows[0].exclusivity === "exclusive" ? "campaign_exclusive" : "campaign_dominant";
  }
  return rows.some((row) => !row.isDesignBrief) ? "baseline" : "open";
}

function buildDayCapacity(window: ResolvedStudioWindow | null, counts: DayCounts) {
  const max = window ? window.maxPostsPerDay : 0;
  const used = counts.scheduled + counts.drafts;
  return {
    used: Math.min(used, max),
    max,
  };
}

function getPerChannelLimits(dayRows: NormalizedContentRow[], window: ResolvedStudioWindow | null) {
  const channels = window?.channelsInScope?.length
    ? window.channelsInScope
    : Array.from(
        new Set(
          dayRows
            .map((row) => row.channel)
            .filter((channel): channel is WorkspaceChannel => Boolean(channel)),
        ),
      );

  return channels.map((channel) => ({
    channel,
    used: dayRows.filter((row) => row.channel === channel && !row.isDesignBrief).length,
    max: 1,
  }));
}

function buildCalendarDayCell(source: CalendarStudioSourceBundle, dayKey: string, monthIso: string): CalendarDayCellViewData {
  const dayRows = getContentRowsForDay(source, dayKey);
  const activeWindows = getActiveWindowsForDay(source, dayKey);
  const primaryWindow = activeWindows[0] ?? null;
  const counts = buildDayCounts(dayRows);
  const capacity = buildDayCapacity(primaryWindow, counts);
  const previewChips = dayRows
    .filter((row) => !row.isDesignBrief && row.channel)
    .sort(sortContentRows)
    .slice(0, 3)
    .map((row) => ({
      id: row.id,
      channel: row.channel as WorkspaceChannel,
      status: row.uiStatus,
      title: row.title,
    }));

  return {
    date: dayKey,
    isToday: dayKey === format(new Date(), "yyyy-MM-dd"),
    isCurrentMonth: format(parseISO(dayKey), "yyyy-MM") === format(parseMonthIso(monthIso), "yyyy-MM"),
    ownership: buildDayOwnershipMode(activeWindows, dayRows),
    campaignId: primaryWindow?.eventId,
    campaignEventDate: primaryWindow?.startDate,
    campaignName: primaryWindow?.label,
    campaignColor: primaryWindow?.color,
    ownerPipeline: primaryWindow?.ownerPipeline,
    capacity,
    counts,
    previewChips,
    openSlots: Math.max(capacity.max - capacity.used, 0),
  };
}

function buildCampaignTimeline(source: CalendarStudioSourceBundle, window: ResolvedStudioWindow): CampaignTimelineCell[] {
  const days = eachDayOfInterval({
    start: parseISO(window.windowStart),
    end: parseISO(window.windowEnd),
  });
  const linkedRows = getLinkedContentForWindow(source, window);

  return days.map((date) => {
    const dayKey = format(date, "yyyy-MM-dd");
    const dayRows = linkedRows.filter((row) => row.bucketDate === dayKey && !row.isDesignBrief);
    const counts = buildDayCounts(dayRows);

    return {
      date: dayKey,
      scheduled: counts.scheduled,
      drafts: counts.drafts,
      failed: counts.failed,
      isToday: dayKey === format(new Date(), "yyyy-MM-dd"),
    };
  });
}

function buildAssetReadinessFromRows(window: ResolvedStudioWindow, rows: NormalizedContentRow[]): AssetReadinessRecordViewData {
  const uniqueSourceLinks = new Map<string, { label: string; url: string }>();

  if (safeString(window.row.source_asset_url)) {
    uniqueSourceLinks.set(window.row.source_asset_url as string, {
      label: "Source asset",
      url: window.row.source_asset_url as string,
    });
  }

  for (const row of rows) {
    if (row.mediaUrl && !uniqueSourceLinks.has(row.mediaUrl)) {
      uniqueSourceLinks.set(row.mediaUrl, {
        label: row.title,
        url: row.mediaUrl,
      });
    }
  }

  let state: AssetReadinessState = "assets_needed";
  if (rows.some((row) => Boolean(row.mediaUrl))) {
    state = "assets_ready";
  } else if (rows.length > 0) {
    state = "partial_assets";
  }

  const assetRequestSummary =
    state === "assets_ready"
      ? undefined
      : state === "partial_assets"
        ? `Complete missing creative references or uploaded media for ${window.label}.`
        : `No linked assets are ready for ${window.label}. Gather source material or request new assets before scheduling the remaining content.`;

  return {
    contextId: window.eventId,
    contextLabel: window.label,
    state,
    sourceLinks: Array.from(uniqueSourceLinks.values()),
    notes: safeString(window.row.asset_notes) ?? undefined,
    assetRequestSummary,
  };
}

export async function loadCalendarStudioSourceBundle(): Promise<CalendarStudioSourceBundle> {
  const [calendarResult, contentResult, pipelineRunsResult] = await Promise.all([
    supabase.from("academic_calendar").select("*").eq("org_id", getOrgId()).order("event_date", { ascending: true }),
    supabase.from("content_registry").select("*").eq("org_id", getOrgId()).order("created_at", { ascending: false }),
    supabase.from("pipeline_runs").select("*").eq("org_id", getOrgId()).order("started_at", { ascending: false }),
  ]);

  if (calendarResult.error) throw calendarResult.error;
  if (contentResult.error) throw contentResult.error;
  if (pipelineRunsResult.error) throw pipelineRunsResult.error;

  const windows = (calendarResult.data ?? [])
    .map((row) => resolveStudioWindow(row as CalendarStudioCalendarRow))
    .filter((window): window is ResolvedStudioWindow => Boolean(window))
    .sort(compareWindows);

  return {
    calendarRows: (calendarResult.data ?? []) as CalendarStudioCalendarRow[],
    contentRows: normalizeContentRows((contentResult.data ?? []) as CalendarStudioContentRow[], windows),
    pipelineRuns: (pipelineRunsResult.data ?? []) as CalendarStudioPipelineRunRow[],
    windows,
  };
}

export function buildCalendarStudioMonthGrid(source: CalendarStudioSourceBundle, monthIso: string): CalendarMonthGridViewData {
  const monthStart = startOfMonth(parseMonthIso(monthIso));
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const dayKeys = eachDayOfInterval({ start: gridStart, end: gridEnd }).map((day) => format(day, "yyyy-MM-dd"));
  const monthRangeStart = format(monthStart, "yyyy-MM-dd");
  const monthRangeEnd = format(monthEnd, "yyyy-MM-dd");
  const days = dayKeys.map((dayKey) => buildCalendarDayCell(source, dayKey, monthIso));
  const currentMonthDays = days.filter((day) => day.isCurrentMonth);
  const activeCampaigns = source.windows
    .filter((window) => overlapsRange(window, monthRangeStart, monthRangeEnd))
    .map((window) => ({
      id: window.eventId,
      name: window.label,
      color: window.color,
      start: window.windowStart,
    }))
    .sort((a, b) => a.start.localeCompare(b.start));

  const totalScheduled = currentMonthDays.reduce((sum, day) => sum + day.counts.scheduled, 0);
  const totalDrafts = currentMonthDays.reduce((sum, day) => sum + day.counts.drafts, 0);
  const totalFailed = currentMonthDays.reduce((sum, day) => sum + day.counts.failed, 0);
  const totalOpenSlots = currentMonthDays.reduce((sum, day) => sum + day.openSlots, 0);
  const committedPercent = Math.round(
    (totalScheduled / Math.max(totalScheduled + totalDrafts + totalFailed + totalOpenSlots, 1)) * 100,
  );

  return {
    monthLabel: format(monthStart, "MMMM yyyy"),
    monthIso: format(monthStart, "yyyy-MM"),
    weekdayLabels: WEEKDAY_LABELS,
    days,
    totalScheduled,
    totalDrafts,
    totalFailed,
    totalOpenSlots,
    committedPercent,
    activeCampaigns: activeCampaigns.map(({ start, ...campaign }) => campaign),
  };
}

export function buildCalendarStudioDayDetail(source: CalendarStudioSourceBundle, date: string): CalendarDayPanelViewData {
  const dayKey = toDayKey(date);
  if (!dayKey) throw new Error("Invalid day detail date.");

  const dayCell = buildCalendarDayCell(source, dayKey, dayKey);
  const dayRows = getContentRowsForDay(source, dayKey);
  const activeWindows = getActiveWindowsForDay(source, dayKey);
  const primaryWindow = activeWindows[0] ?? null;

  const draftRows = dayRows
    .filter((row) => !row.isDesignBrief && row.channel && ["draft", "pending_approval", "rejected"].includes(row.rawStatus))
    .sort(sortContentRows);
  const failureRows = dayRows
    .filter((row) => !row.isDesignBrief && row.channel && row.rawStatus === "failed")
    .sort(sortContentRows);
  const scheduledRows = dayRows
    .filter((row) => !row.isDesignBrief && row.channel && ["scheduled", "approved"].includes(row.rawStatus))
    .sort(sortContentRows);

  return {
    ...dayCell,
    campaignContext: primaryWindow
      ? {
          id: primaryWindow.eventId,
          name: primaryWindow.label,
          objective: primaryWindow.objective,
          eventDate: primaryWindow.startDate,
          exclusivity: primaryWindow.exclusivity,
        }
      : undefined,
    supportContentAllowed: primaryWindow?.supportContentAllowed ?? false,
    perChannelLimits: getPerChannelLimits(dayRows, primaryWindow),
    scheduledItems: scheduledRows.map((row) => ({
      id: row.id,
      channel: row.channel as WorkspaceChannel,
      title: row.title,
      scheduledFor: row.scheduledAt ?? row.createdAt ?? `${dayKey}T00:00:00.000Z`,
      status: row.uiStatus,
    })),
    draftItems: draftRows.map((row) => ({
      id: row.id,
      channel: row.channel as WorkspaceChannel,
      title: row.title,
      approvalStatus: row.approvalStatus,
    })),
    failureItems: failureRows.map((row) => ({
      id: row.id,
      channel: row.channel as WorkspaceChannel,
      title: row.title,
      reason: row.rejectionNote ?? "Delivery or generation failed.",
      failedAt: row.createdAt ?? `${dayKey}T00:00:00.000Z`,
    })),
    notes: primaryWindow?.planningNotes,
  };
}

export function buildCalendarStudioCampaignWindowDetail(
  source: CalendarStudioSourceBundle,
  campaignId: string,
): CampaignPanelViewData {
  const window = source.windows.find((item) => item.eventId === campaignId || item.id === campaignId);
  if (!window) throw new Error("Campaign window not found.");

  const linkedRows = getLinkedContentForWindow(source, window);
  const actionableRows = linkedRows.filter((row) => !row.isDesignBrief);
  const timeline = buildCampaignTimeline(source, window);
  const contentBreakdown = {
    scheduled: actionableRows.filter((row) => ["scheduled", "approved"].includes(row.rawStatus)).length,
    drafts: actionableRows.filter((row) => ["draft", "rejected"].includes(row.rawStatus)).length,
    failed: actionableRows.filter((row) => row.rawStatus === "failed").length,
    pendingApproval: actionableRows.filter((row) => ["draft", "pending_approval"].includes(row.rawStatus)).length,
    published: actionableRows.filter((row) => row.rawStatus === "published").length,
  };
  const missingSlots = timeline.reduce((sum, cell) => {
    const capacity = Math.max(window.maxPostsPerDay, 0);
    const used = cell.scheduled + cell.drafts;
    return sum + Math.max(capacity - used, 0);
  }, 0);
  const readinessPercent = Math.round(
    ((contentBreakdown.published + contentBreakdown.scheduled) /
      Math.max(
        contentBreakdown.published +
          contentBreakdown.scheduled +
          contentBreakdown.drafts +
          contentBreakdown.pendingApproval +
          contentBreakdown.failed +
          missingSlots,
        1,
      )) *
      100,
  );
  const assetRecord = buildAssetReadinessFromRows(window, linkedRows);

  return {
    id: window.eventId,
    name: window.label,
    kind: window.kind,
    color: window.color,
    startDate: window.startDate,
    endDate: window.endDate,
    objective: window.objective,
    targetAudience: window.targetAudience,
    ownerPipeline: window.ownerPipeline,
    exclusivity: window.exclusivity,
    supportContentAllowed: window.supportContentAllowed,
    messagingConstraints: window.messagingConstraints,
    ctaRules: window.ctaRules,
    offerInScope: window.offerInScope,
    assetReadiness: assetRecord.state,
    assetSourceLinks: assetRecord.sourceLinks,
    assetNotes: assetRecord.notes,
    contentBreakdown,
    readinessPercent,
    missingSlots,
    approvalBacklog: contentBreakdown.pendingApproval,
    timeline,
  };
}

export function buildCalendarStudioAssetReadinessDetail(
  source: CalendarStudioSourceBundle,
  contextId: string,
): AssetReadinessRecordViewData {
  const window = source.windows.find((item) => item.eventId === contextId || item.id === contextId);
  if (!window) throw new Error("Asset context not found.");
  const linkedRows = getLinkedContentForWindow(source, window);
  return buildAssetReadinessFromRows(window, linkedRows);
}

export function useCalendarStudioSourceBundle(options?: QueryHookOptions) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getCalendarStudioSourceQueryKey(),
    queryFn: loadCalendarStudioSourceBundle,
    ...options?.query,
  });
}

export function useCalendarStudioMonthGrid(monthIso: string, options?: QueryHookOptions) {
  const sourceQuery = useCalendarStudioSourceBundle(options);
  return {
    ...sourceQuery,
    data: sourceQuery.data ? buildCalendarStudioMonthGrid(sourceQuery.data, monthIso) : undefined,
  };
}

export function useCalendarStudioDayDetail(date: string, options?: QueryHookOptions) {
  const sourceQuery = useCalendarStudioSourceBundle(options);
  return {
    ...sourceQuery,
    data: sourceQuery.data ? buildCalendarStudioDayDetail(sourceQuery.data, date) : undefined,
  };
}

export function useCalendarStudioCampaignWindowDetail(campaignId: string, options?: QueryHookOptions) {
  const sourceQuery = useCalendarStudioSourceBundle(options);
  return {
    ...sourceQuery,
    data: sourceQuery.data ? buildCalendarStudioCampaignWindowDetail(sourceQuery.data, campaignId) : undefined,
  };
}

export function useCalendarStudioAssetReadinessDetail(contextId: string, options?: QueryHookOptions) {
  const sourceQuery = useCalendarStudioSourceBundle(options);
  return {
    ...sourceQuery,
    data: sourceQuery.data ? buildCalendarStudioAssetReadinessDetail(sourceQuery.data, contextId) : undefined,
  };
}
