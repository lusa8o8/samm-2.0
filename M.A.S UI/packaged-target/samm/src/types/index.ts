export type ModuleId =
  | 'samm'
  | 'inbox'
  | 'content'
  | 'metrics'
  | 'calendar'
  | 'operations'
  | 'crm'
  | 'sales'
  | 'ambassadors';

export interface Module {
  id: ModuleId;
  label: string;
  icon: string;
  enabled: boolean;
  optional?: boolean;
  badge?: number;
}

export type PipelineId = 'A' | 'B' | 'C' | 'D' | 'publish';
export type RunStatus = 'running' | 'waiting_human' | 'failed' | 'completed' | 'scheduled';
export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'rejected';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type Priority = 'high' | 'medium' | 'low';
export type Channel = 'linkedin' | 'twitter' | 'instagram' | 'email' | 'facebook' | 'whatsapp' | 'youtube' | 'design_brief';
export type ContentType = 'post' | 'story' | 'article' | 'email' | 'reel';
export type EventType = 'campaign_launch' | 'product_release' | 'webinar' | 'holiday' | 'promotion';

export interface PipelineRun {
  id: string;
  pipelineId: PipelineId;
  pipelineName: string;
  status: RunStatus;
  startedAt: string;
  lastActivity: string;
  stepCurrent: number;
  stepTotal: number;
  stepName: string;
  message?: string;
  retriesLeft?: number;
}

export interface InboxItem {
  id: string;
  type: 'approval' | 'suggestion' | 'escalation' | 'fyi';
  title: string;
  summary: string;
  rationale: string;
  source: string;
  sourcePipeline: PipelineId;
  priority: Priority;
  status: ApprovalStatus | 'new';
  createdAt: string;
  linkedObjectId?: string;
  linkedObjectType?: string;
}

export interface ContentDraft {
  id: string;
  title: string;
  preview: string;
  channel: Channel;
  contentType: ContentType;
  status: ContentStatus;
  createdAt: string;
  scheduledFor?: string;
  publishedAt?: string;
  failedAt?: string;
  failureReason?: string;
  linkedCampaign?: string;
  linkedICP?: string;
  objective?: string;
  ctaType?: string;
  offerAssociation?: string;
  patternTags?: string[];
  approvalStatus?: ApprovalStatus;
}

export interface CalendarEvent {
  id: string;
  name: string;
  eventType: EventType;
  startDate: string;
  endDate?: string;
  targetICP?: string;
  objective?: string;
  campaignType?: string;
  priority: Priority;
  status: 'planned' | 'ready' | 'active' | 'completed' | 'cancelled';
  ownerPipeline?: PipelineId;
  notes?: string;
  linkedCampaign?: string;
  contentReady?: number;
  contentTotal?: number;
}

export interface MetricKPI {
  label: string;
  value: string;
  delta: string;
  deltaDirection: 'up' | 'down';
  deltaGood: boolean;
  sublabel?: string;
}

export interface ChannelMetric {
  channel: Channel;
  reach: number;
  engagement: number;
  clicks: number;
  conversions: number;
  trend: 'up' | 'down' | 'flat';
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  segment: string;
  score: number;
  stage: 'new' | 'engaged' | 'qualified' | 'opportunity' | 'customer' | 'churned';
  lastActivity: string;
  tags: string[];
  outreachStatus?: string;
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  count: number;
  avgScore: number;
  criteria: string[];
  stage: string;
}

export interface TriggerQueueItem {
  id: string;
  contactId: string;
  contactName: string;
  triggerType: string;
  triggeredAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  outreachDecision?: string;
  priority: Priority;
}

export interface SalesSequence {
  id: string;
  name: string;
  targetSegment: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  currentStep: number;
  totalSteps: number;
  enrolled: number;
  converted: number;
  stopped: number;
  conversionRate: number;
  lastActivity: string;
  offerAssociation?: string;
}

export interface OfferDecision {
  id: string;
  contactId: string;
  contactName: string;
  offerId: string;
  offerName: string;
  decision: 'presented' | 'accepted' | 'declined' | 'pending';
  discountApplied?: number;
  reason?: string;
  decidedAt: string;
}

export interface PatternSummary {
  id: string;
  pattern: string;
  description: string;
  frequency: number;
  impact: 'high' | 'medium' | 'low';
  channels: Channel[];
  exampleContent?: string;
  lastSeen: string;
  recommendation?: string;
}

export interface SammMessage {
  id: string;
  role: 'samm' | 'user';
  content: string;
  timestamp: string;
  widgets?: WidgetDescriptor[];
  actions?: ActionDescriptor[];
}

export type WidgetType =
  | 'approval_queue'
  | 'campaign_brief_panel'
  | 'content_batch_review'
  | 'calendar_event_inspector'
  | 'pipeline_run_timeline'
  | 'lead_card'
  | 'sequence_status_panel'
  | 'metrics_snapshot'
  | 'failure_group'
  | 'settings_editor'
  | 'pattern_summary'
  | 'module_toggle_card'
  | 'trigger_queue_panel'
  | 'offer_decision_card'
  | 'outcome_summary_panel';

export interface WidgetDescriptor {
  type: WidgetType;
  title?: string;
  data: unknown;
}

export interface ActionDescriptor {
  label: string;
  action: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  payload?: unknown;
}

export interface WorkspaceContext {
  activeRuns: PipelineRun[];
  pendingApprovals: number;
  nextCalendarEvent?: CalendarEvent;
  recentFailures: PipelineRun[];
  currentFocus?: string;
}
