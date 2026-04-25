export type WorkspacePipelineId = "A" | "B" | "C" | "D" | "publish";
export type WorkspaceContentStatus = "draft" | "scheduled" | "published" | "failed";
export type WorkspaceApprovalStatus = "pending" | "approved" | "rejected";
export type WorkspaceChannel = "linkedin" | "twitter" | "instagram" | "email" | "facebook" | "whatsapp" | "youtube";

export type AssetReadinessState = "assets_ready" | "partial_assets" | "assets_needed";
export type DayOwnershipMode = "campaign_exclusive" | "campaign_dominant" | "mixed" | "open" | "baseline";
export type CampaignKind = "launch" | "promotion" | "webinar" | "seasonal" | "newsletter" | "always_on";
export type CampaignColor = "blue" | "amber" | "purple" | "emerald" | "pink" | "slate";

export interface KeyCampaignInput {
  id: string;
  name: string;
  kind: CampaignKind;
  startDate: string;
  endDate?: string;
  exclusivity: "exclusive" | "allows_support";
  assetReadiness: AssetReadinessState;
  notes?: string;
}

export interface MonthlyPlanningSessionViewData {
  id: string;
  planningMonth: string;
  monthlyObjective: string;
  keyCampaigns: KeyCampaignInput[];
  temporaryEmphasis: string[];
  operatorCapacityNote: string;
  assetReadinessByCampaign: Record<string, AssetReadinessState>;
  oneOffNotes: string[];
  status: "draft" | "reviewing" | "committed";
  totalPlannedDays?: number;
  estimatedContentVolume?: number;
}

export interface DayCounts {
  scheduled: number;
  drafts: number;
  failed: number;
  waitingApproval: number;
}

export interface ContentChipData {
  id: string;
  channel: WorkspaceChannel;
  status: WorkspaceContentStatus;
  title: string;
}

export interface CalendarDayCellViewData {
  date: string;
  isToday?: boolean;
  isCurrentMonth: boolean;
  ownership: DayOwnershipMode;
  campaignId?: string;
  campaignEventDate?: string;
  campaignName?: string;
  campaignColor?: CampaignColor;
  ownerPipeline?: WorkspacePipelineId;
  capacity: { used: number; max: number };
  counts: DayCounts;
  previewChips: ContentChipData[];
  openSlots: number;
}

export interface CalendarDayPanelViewData extends CalendarDayCellViewData {
  campaignContext?: {
    id: string;
    name: string;
    objective: string;
    eventDate: string;
    exclusivity: "exclusive" | "allows_support";
  };
  oneTimeContext?: {
    title: string;
    scheduledFor: string;
    channels: WorkspaceChannel[];
    contentCount: number;
    additionalCount: number;
  };
  supportContentAllowed: boolean;
  perChannelLimits: { channel: WorkspaceChannel; used: number; max: number }[];
  scheduledItems: {
    id: string;
    channel: WorkspaceChannel;
    title: string;
    scheduledFor: string;
    status: WorkspaceContentStatus;
  }[];
  draftItems: {
    id: string;
    channel: WorkspaceChannel;
    title: string;
    approvalStatus: WorkspaceApprovalStatus;
  }[];
  failureItems: {
    id: string;
    channel: WorkspaceChannel;
    title: string;
    reason: string;
    failedAt: string;
  }[];
  campaignDeleteCandidate?: {
    id: string;
    label: string;
    startDate: string;
    endDate: string;
    canDelete: boolean;
    blockedReason?: string;
    linkedContentCount: number;
    publishedContentCount: number;
  };
  oneTimeDeleteCandidates: {
    id: string;
    groupKey: string;
    label: string;
    scheduledFor: string;
    eventRef?: string | null;
    channels: WorkspaceChannel[];
    canDelete: boolean;
    blockedReason?: string;
    contentCount: number;
    publishedContentCount: number;
  }[];
  notes?: string;
}

export interface CampaignTimelineCell {
  date: string;
  scheduled: number;
  drafts: number;
  failed: number;
  isToday?: boolean;
}

export interface CampaignPanelViewData {
  id: string;
  name: string;
  kind: CampaignKind;
  color: CampaignColor;
  startDate: string;
  endDate: string;
  objective: string;
  targetAudience: string;
  ownerPipeline: WorkspacePipelineId;
  exclusivity: "exclusive" | "allows_support";
  supportContentAllowed: boolean;
  messagingConstraints: string[];
  ctaRules: string[];
  offerInScope?: string;
  assetReadiness: AssetReadinessState;
  assetSourceLinks?: { label: string; url: string }[];
  assetNotes?: string;
  contentBreakdown: {
    scheduled: number;
    drafts: number;
    failed: number;
    pendingApproval: number;
    published: number;
  };
  readinessPercent: number;
  missingSlots: number;
  approvalBacklog: number;
  timeline: CampaignTimelineCell[];
}

export interface AssetReadinessRecordViewData {
  contextId: string;
  contextLabel: string;
  state: AssetReadinessState;
  sourceLinks: { label: string; url: string }[];
  notes?: string;
  assetRequestSummary?: string;
}

export interface CalendarMonthGridViewData {
  monthLabel: string;
  monthIso: string;
  weekdayLabels: string[];
  days: CalendarDayCellViewData[];
  totalScheduled: number;
  totalDrafts: number;
  totalFailed: number;
  totalOpenSlots: number;
  committedPercent: number;
  activeCampaigns: { id: string; name: string; color: CampaignColor }[];
}
