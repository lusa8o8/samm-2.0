export const DEFAULT_PLANNING_HORIZON_DAYS = 7
export const DEFAULT_SLOT_CHANNELS = ['facebook', 'whatsapp', 'youtube', 'email'] as const
export const DEFAULT_SUPPORT_CONTENT_TYPES = ['reminder', 'reinforcement', 'faq', 'testimonial', 'countdown'] as const

export type SlotPurpose = 'baseline' | 'campaign' | 'support'
export type SupportContentType = typeof DEFAULT_SUPPORT_CONTENT_TYPES[number]

export interface CampaignCalendarEventRow {
  id: string
  label: string
  event_type?: string | null
  event_date: string
  event_end_date?: string | null
  universities?: string[] | null
  lead_days?: number | null
  creative_override_allowed?: boolean | null
  pipeline_trigger?: string | null
  owner_pipeline?: string | null
  exclusive_campaign?: boolean | null
  support_content_allowed?: boolean | null
  channels_in_scope?: string[] | null
  allowed_ctas?: string[] | null
  disallowed_ctas?: string[] | null
  primary_message?: string | null
  content_types_required?: string[] | null
  posting_frequency?: string | null
  priority?: number | null
  max_posts_per_day?: number | null
  max_posts_per_week?: number | null
  min_gap_between_posts?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export interface CampaignConstraintSet {
  primary_message: string | null
  allowed_ctas: string[]
  disallowed_ctas: string[]
  channels_in_scope: string[]
  content_types_required: string[]
  posting_frequency: string | null
  exclusive_campaign: boolean
  support_content_allowed: boolean
  priority: number
  max_posts_per_day: number | null
  max_posts_per_week: number | null
  min_gap_between_posts: number | null
}

export interface ResolvedCampaignWindow {
  window_id: string
  event_id: string
  label: string
  event_type: string
  event_date: string
  event_end_date: string | null
  window_start: string
  window_end: string
  owner_pipeline: string
  lead_days: number
  constraints: CampaignConstraintSet
  universities: string[]
}

export interface ResolvedCalendarSlot {
  slot_id: string
  date: string
  channel: string
  purpose: SlotPurpose
  owner_pipeline: string
  max_posts: number
  current_posts: number
  allowed_ctas: string[]
  allowed_content_types: string[]
  window_ref: string | null
  campaign_ref: string | null
}

export interface CalendarPlanningContext {
  planning_horizon_days: number
  horizon_start: string
  horizon_end: string
  events: CampaignCalendarEventRow[]
  windows: ResolvedCampaignWindow[]
  slots: ResolvedCalendarSlot[]
  active_windows: ResolvedCampaignWindow[]
  baseline_slots: ResolvedCalendarSlot[]
  support_slots: ResolvedCalendarSlot[]
  campaign_slots: ResolvedCalendarSlot[]
}

export interface SchedulerDecisionLog {
  reason_code: string
  window_ref: string | null
  slot_ref: string | null
  rule_triggered: string
  decision: 'allowed' | 'blocked' | 'constrained'
  alternative_action: string | null
}

export interface PipelineAdmissionDecision {
  allowed: boolean
  logs: SchedulerDecisionLog[]
}

export interface CampaignConstraintOutput {
  owner_pipeline: string
  exclusive_campaign: boolean
  support_content_allowed: boolean
  channels_in_scope: string[]
  primary_message: string | null
  allowed_ctas: string[]
  disallowed_ctas: string[]
  content_types_required: string[]
  support_content_types: string[]
  posting_frequency: string | null
  priority: number
  max_posts_per_day: number | null
  max_posts_per_week: number | null
  min_gap_between_posts: number | null
  window_ref: string | null
  campaign_ref: string | null
}

export interface ContentCalendarPreflight {
  allowed: boolean
  reason_code: string
  message: string
  slot: ResolvedCalendarSlot | null
  window: ResolvedCampaignWindow | null
}

function toIsoDate(value: string) {
  return new Date(value).toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return toIsoDate(date.toISOString())
}

function diffDaysInclusive(start: string, end: string) {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  return Math.max(1, Math.round((endMs - startMs) / 86400000) + 1)
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return fallback
}

function asNumber(value: unknown, fallback: number | null = null) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function asStringArray(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
  }
  return fallback
}

function normalizeOwnerPipeline(event: CampaignCalendarEventRow) {
  const explicit = (event.owner_pipeline ?? event.pipeline_trigger ?? '').toLowerCase()
  if (explicit.includes('pipeline-b')) return 'pipeline-b-weekly'
  if (explicit.includes('pipeline-c')) return 'pipeline-c-campaign'
  return 'pipeline-c-campaign'
}

function derivePriority(event: CampaignCalendarEventRow) {
  const explicit = asNumber(event.priority, null)
  if (explicit !== null) return explicit

  const type = (event.event_type ?? '').toLowerCase()
  if (type.includes('holiday') || type.includes('seasonal')) return 80
  if (type.includes('campaign')) return 75
  return 60
}

export function resolveCampaignWindow(
  event: CampaignCalendarEventRow,
  options?: {
    defaultChannels?: string[]
  },
): ResolvedCampaignWindow {
  const leadDays = asNumber(event.lead_days, 21) ?? 21
  const defaultChannels = options?.defaultChannels?.length
    ? options.defaultChannels
    : [...DEFAULT_SLOT_CHANNELS]
  const ownerPipeline = normalizeOwnerPipeline(event)
  const exclusiveCampaign = asBoolean(event.exclusive_campaign, ownerPipeline === 'pipeline-c-campaign')
  const supportContentAllowed = asBoolean(
    event.support_content_allowed,
    asBoolean(event.creative_override_allowed, false),
  )
  const windowStart = addDays(event.event_date, -leadDays)
  const windowEnd = event.event_end_date ?? event.event_date

  return {
    window_id: `window:${event.id}`,
    event_id: event.id,
    label: event.label,
    event_type: event.event_type ?? 'other',
    event_date: event.event_date,
    event_end_date: event.event_end_date ?? null,
    window_start: windowStart,
    window_end: windowEnd,
    owner_pipeline: ownerPipeline,
    lead_days: leadDays,
    universities: asStringArray(event.universities, []),
    constraints: {
      primary_message: event.primary_message ?? null,
      allowed_ctas: asStringArray(event.allowed_ctas, []),
      disallowed_ctas: asStringArray(event.disallowed_ctas, []),
      channels_in_scope: asStringArray(event.channels_in_scope, defaultChannels),
      content_types_required: asStringArray(event.content_types_required, []),
      posting_frequency: event.posting_frequency ?? null,
      exclusive_campaign: exclusiveCampaign,
      support_content_allowed: supportContentAllowed,
      priority: derivePriority(event),
      max_posts_per_day: asNumber(event.max_posts_per_day, 1),
      max_posts_per_week: asNumber(event.max_posts_per_week, null),
      min_gap_between_posts: asNumber(event.min_gap_between_posts, null),
    },
  }
}

function windowTouchesHorizon(window: ResolvedCampaignWindow, start: string, end: string) {
  return window.window_start <= end && window.window_end >= start
}

function compareWindows(a: ResolvedCampaignWindow, b: ResolvedCampaignWindow) {
  const priorityDelta = b.constraints.priority - a.constraints.priority
  if (priorityDelta !== 0) return priorityDelta

  const durationDelta =
    diffDaysInclusive(a.window_start, a.window_end) - diffDaysInclusive(b.window_start, b.window_end)
  if (durationDelta !== 0) return durationDelta

  const startDelta = new Date(a.window_start).getTime() - new Date(b.window_start).getTime()
  if (startDelta !== 0) return startDelta

  return a.window_id.localeCompare(b.window_id)
}

function resolveWinningWindow(windows: ResolvedCampaignWindow[], date: string) {
  const active = windows.filter((window) => window.window_start <= date && window.window_end >= date)
  if (active.length === 0) return null
  return [...active].sort(compareWindows)[0]
}

function deriveSupportWeeklyBudget(window: ResolvedCampaignWindow) {
  if (!window.constraints.support_content_allowed) return 0
  const explicitWeeklyCap = window.constraints.max_posts_per_week
  if (explicitWeeklyCap !== null && explicitWeeklyCap !== undefined) {
    return Math.max(1, Math.min(explicitWeeklyCap, 3))
  }
  return 2
}

function deriveSupportGapDays(window: ResolvedCampaignWindow) {
  return Math.max(1, window.constraints.min_gap_between_posts ?? 2)
}

export function resolveCalendarSlots(params: {
  windows: ResolvedCampaignWindow[]
  startDate: string
  horizonDays?: number
  defaultChannels?: string[]
}) {
  const horizonDays = params.horizonDays ?? DEFAULT_PLANNING_HORIZON_DAYS
  const defaultChannels = params.defaultChannels?.length
    ? params.defaultChannels
    : [...DEFAULT_SLOT_CHANNELS]
  const slots: ResolvedCalendarSlot[] = []
  const supportSlotsUsedByWindow = new Map<string, number>()

  for (let offset = 0; offset < horizonDays; offset += 1) {
    const date = addDays(params.startDate, offset)
    const winningWindow = resolveWinningWindow(params.windows, date)

    if (!winningWindow) {
      for (const channel of defaultChannels) {
        slots.push({
          slot_id: `${date}:${channel}:baseline`,
          date,
          channel,
          purpose: 'baseline',
          owner_pipeline: 'pipeline-b-weekly',
          max_posts: 1,
          current_posts: 0,
          allowed_ctas: [],
          allowed_content_types: [],
          window_ref: null,
          campaign_ref: null,
        })
      }
      continue
    }

    const channels = winningWindow.constraints.channels_in_scope.length
      ? winningWindow.constraints.channels_in_scope
      : defaultChannels

    for (const channel of channels) {
      slots.push({
        slot_id: `${date}:${channel}:campaign:${winningWindow.event_id}`,
        date,
        channel,
        purpose: 'campaign',
        owner_pipeline: winningWindow.owner_pipeline,
        max_posts: winningWindow.constraints.max_posts_per_day ?? 1,
        current_posts: 0,
        allowed_ctas: winningWindow.constraints.allowed_ctas,
        allowed_content_types:
          winningWindow.constraints.content_types_required,
        window_ref: winningWindow.window_id,
        campaign_ref: winningWindow.event_id,
      })
    }

    if (!winningWindow.constraints.support_content_allowed) {
      continue
    }

    const supportBudget = deriveSupportWeeklyBudget(winningWindow)
    const supportUsed = supportSlotsUsedByWindow.get(winningWindow.window_id) ?? 0
    if (supportUsed >= supportBudget) {
      continue
    }

    const supportGapDays = deriveSupportGapDays(winningWindow)
    const supportIndex = supportUsed
    const daysIntoWindow = diffDaysInclusive(winningWindow.window_start, date) - 1
    if (daysIntoWindow % supportGapDays !== 0) {
      continue
    }

    const supportChannel = channels[supportIndex % channels.length]
    slots.push({
      slot_id: `${date}:${supportChannel}:support:${winningWindow.event_id}:${supportIndex}`,
      date,
      channel: supportChannel,
      purpose: 'support',
      owner_pipeline: 'pipeline-b-weekly',
      max_posts: 1,
      current_posts: 0,
      allowed_ctas: winningWindow.constraints.allowed_ctas,
      allowed_content_types: [...DEFAULT_SUPPORT_CONTENT_TYPES],
      window_ref: winningWindow.window_id,
      campaign_ref: winningWindow.event_id,
    })
    supportSlotsUsedByWindow.set(winningWindow.window_id, supportUsed + 1)
  }

  return slots
}

export async function loadCampaignCalendarPlanningContext(
  supabase: any,
  orgId: string,
  startDate: string,
  options?: {
    horizonDays?: number
    defaultChannels?: string[]
  },
): Promise<CalendarPlanningContext> {
  const horizonDays = options?.horizonDays ?? DEFAULT_PLANNING_HORIZON_DAYS
  const horizonEnd = addDays(startDate, horizonDays - 1)
  const defaultChannels = options?.defaultChannels?.length
    ? options.defaultChannels
    : [...DEFAULT_SLOT_CHANNELS]

  const queryStart = addDays(startDate, -32)
  const queryEnd = addDays(horizonEnd, 60)

  const { data, error } = await supabase
    .from('academic_calendar')
    .select('*')
    .eq('org_id', orgId)
    .gte('event_date', queryStart)
    .lte('event_date', queryEnd)
    .order('event_date', { ascending: true })

  if (error) {
    throw new Error(`Failed to load campaign calendar: ${error.message}`)
  }

  const events = (data ?? []) as CampaignCalendarEventRow[]
  const windows = events
    .map((event) => resolveCampaignWindow(event, { defaultChannels }))
    .filter((window) => windowTouchesHorizon(window, startDate, horizonEnd))
    .sort(compareWindows)

  const slots = resolveCalendarSlots({
    windows,
    startDate,
    horizonDays,
    defaultChannels,
  })

  return {
    planning_horizon_days: horizonDays,
    horizon_start: startDate,
    horizon_end: horizonEnd,
    events,
    windows,
    slots,
    active_windows: windows.filter((window) => window.window_start <= startDate && window.window_end >= startDate),
    baseline_slots: slots.filter((slot) => slot.purpose === 'baseline'),
    support_slots: slots.filter((slot) => slot.purpose === 'support'),
    campaign_slots: slots.filter((slot) => slot.purpose === 'campaign'),
  }
}

export function evaluatePipelineAdmission(params: {
  pipelineId: string
  planningContext: CalendarPlanningContext
  explicitEventId?: string | null
}): PipelineAdmissionDecision {
  const { pipelineId, planningContext, explicitEventId } = params

  if (pipelineId === 'pipeline-b-weekly') {
    if (planningContext.campaign_slots.length === 0) {
      return {
        allowed: true,
        logs: [{
          reason_code: 'allowed_no_active_campaign_window',
          window_ref: null,
          slot_ref: null,
          rule_triggered: 'no_active_campaign_window',
          decision: 'allowed',
          alternative_action: null,
        }],
      }
    }

    if (planningContext.baseline_slots.length > 0) {
      return {
        allowed: true,
        logs: [{
          reason_code: 'restricted_to_baseline_gaps',
          window_ref: planningContext.windows[0]?.window_id ?? null,
          slot_ref: null,
          rule_triggered: 'pipeline_b_gap_fill_only',
          decision: 'constrained',
          alternative_action: 'Plan only against open baseline slots.',
        }],
      }
    }

    if (planningContext.support_slots.length > 0) {
      return {
        allowed: true,
        logs: [{
          reason_code: 'restricted_to_support_content',
          window_ref: planningContext.windows[0]?.window_id ?? null,
          slot_ref: null,
          rule_triggered: 'support_content_allowed',
          decision: 'constrained',
          alternative_action: 'Emit support content only inside the campaign window.',
        }],
      }
    }

    return {
      allowed: false,
      logs: [{
        reason_code: 'blocked_by_exclusive_campaign',
        window_ref: planningContext.windows[0]?.window_id ?? null,
        slot_ref: null,
        rule_triggered: 'exclusive_campaign_window',
        decision: 'blocked',
        alternative_action: 'Wait for the campaign window to end or allow support content for this window.',
      }],
    }
  }

  if (pipelineId === 'pipeline-c-campaign') {
    const candidateWindow = explicitEventId
      ? planningContext.windows.find((window) => window.event_id === explicitEventId)
      : planningContext.windows.find((window) => window.owner_pipeline === 'pipeline-c-campaign')

    if (explicitEventId && !candidateWindow) {
      return {
        allowed: true,
        logs: [{
          reason_code: 'allowed_by_named_event_context',
          window_ref: null,
          slot_ref: null,
          rule_triggered: 'named_event_context',
          decision: 'allowed',
          alternative_action: null,
        }],
      }
    }

    if (!candidateWindow) {
      return {
        allowed: false,
        logs: [{
          reason_code: 'blocked_no_campaign_window',
          window_ref: null,
          slot_ref: null,
          rule_triggered: 'campaign_window_required',
          decision: 'blocked',
          alternative_action: 'Add or select an upcoming calendar event before running Pipeline C.',
        }],
      }
    }

    return {
      allowed: true,
      logs: [{
        reason_code: 'allowed_campaign_window_owned',
        window_ref: candidateWindow.window_id,
        slot_ref: null,
        rule_triggered: explicitEventId ? 'named_event_context' : 'campaign_window_available',
        decision: 'allowed',
        alternative_action: null,
      }],
    }
  }

  return {
    allowed: true,
    logs: [],
  }
}

export function deriveCampaignConstraintOutput(
  window: ResolvedCampaignWindow | null,
  options?: {
    campaignBrief?: {
      key_message?: string | null
      call_to_action?: string | null
      platforms?: string[] | null
    } | null
  },
): CampaignConstraintOutput | null {
  if (!window) return null

  const brief = options?.campaignBrief ?? null
  const allowedCtas = window.constraints.allowed_ctas.length > 0
    ? window.constraints.allowed_ctas
    : brief?.call_to_action
      ? [brief.call_to_action]
      : []
  const channels = window.constraints.channels_in_scope.length > 0
    ? window.constraints.channels_in_scope
    : Array.isArray(brief?.platforms)
      ? brief.platforms.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [...DEFAULT_SLOT_CHANNELS]

  return {
    owner_pipeline: window.owner_pipeline,
    exclusive_campaign: window.constraints.exclusive_campaign,
    support_content_allowed: window.constraints.support_content_allowed,
    channels_in_scope: channels,
    primary_message: window.constraints.primary_message ?? brief?.key_message ?? null,
    allowed_ctas: allowedCtas,
    disallowed_ctas: window.constraints.disallowed_ctas,
    content_types_required: window.constraints.content_types_required,
    support_content_types: window.constraints.support_content_allowed
      ? [...DEFAULT_SUPPORT_CONTENT_TYPES]
      : [],
    posting_frequency: window.constraints.posting_frequency,
    priority: window.constraints.priority,
    max_posts_per_day: window.constraints.max_posts_per_day,
    max_posts_per_week: window.constraints.max_posts_per_week,
    min_gap_between_posts: window.constraints.min_gap_between_posts,
    window_ref: window.window_id,
    campaign_ref: window.event_id,
  }
}

export function validateContentAgainstCalendar(params: {
  planningContext: CalendarPlanningContext
  scheduledDate: string
  platform: string
  purpose: SlotPurpose
  contentType?: string | null
  ctaText?: string | null
  ownerPipeline?: string | null
}): ContentCalendarPreflight {
  const slot = planningContext.slots.find((candidate) => (
    candidate.date === params.scheduledDate
      && candidate.channel === params.platform
      && candidate.purpose === params.purpose
      && (!params.ownerPipeline || candidate.owner_pipeline === params.ownerPipeline)
  )) ?? null

  if (!slot) {
    return {
      allowed: false,
      reason_code: 'no_slot_for_date_channel',
      message: `No calendar slot exists for ${params.platform} on ${params.scheduledDate}.`,
      slot: null,
      window: null,
    }
  }

  const window = slot.window_ref
    ? planningContext.windows.find((candidate) => candidate.window_id === slot.window_ref) ?? null
    : null

  if (params.purpose !== slot.purpose) {
    return {
      allowed: false,
      reason_code: 'slot_purpose_mismatch',
      message: `Slot ${slot.slot_id} requires ${slot.purpose} content, not ${params.purpose}.`,
      slot,
      window,
    }
  }

  if (params.ownerPipeline && slot.owner_pipeline !== params.ownerPipeline) {
    return {
      allowed: false,
      reason_code: 'slot_owner_mismatch',
      message: `Slot ${slot.slot_id} is owned by ${slot.owner_pipeline}, not ${params.ownerPipeline}.`,
      slot,
      window,
    }
  }

  if (slot.allowed_content_types.length > 0 && params.contentType) {
    const normalizedType = params.contentType.trim().toLowerCase()
    const normalizedAllowed = slot.allowed_content_types.map((item) => item.trim().toLowerCase())
    if (!normalizedAllowed.includes(normalizedType)) {
      return {
        allowed: false,
        reason_code: 'content_type_not_allowed',
        message: `Content type ${params.contentType} is not allowed for slot ${slot.slot_id}.`,
        slot,
        window,
      }
    }
  }

  if (slot.allowed_ctas.length > 0 && params.ctaText) {
    const normalizedCta = params.ctaText.trim().toLowerCase()
    const ctaAllowed = slot.allowed_ctas.some((candidate) => candidate.trim().toLowerCase() === normalizedCta)
    if (!ctaAllowed) {
      return {
        allowed: false,
        reason_code: 'cta_not_allowed',
        message: `CTA ${params.ctaText} is not allowed for slot ${slot.slot_id}.`,
        slot,
        window,
      }
    }
  }

  return {
    allowed: true,
    reason_code: 'allowed',
    message: `Slot ${slot.slot_id} is valid for ${params.platform}.`,
    slot,
    window,
  }
}
