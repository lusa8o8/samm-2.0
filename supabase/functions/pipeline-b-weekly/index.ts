// supabase/functions/pipeline-b-weekly/index.ts
// ─────────────────────────────────────────────────────────────────────
// Pipeline B — Weekly Publishing Engine
// Runs on the configured run_day, invoked by the coordinator
// ─────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  createAnthropicClient,
  generateJsonWithAnthropic,
  generateTextWithAnthropic,
} from '../_shared/llm-client.ts'
import { getAgentDefinition } from '../_shared/agent-registry.ts'
import { getIntegrationDefinition } from '../_shared/integration-registry.ts'
import { PIPELINE_RUN_STATUS, type PipelineRunStatus } from '../_shared/pipeline-run-status.ts'
import { publishDueContentRows } from '../_shared/publish-content.ts'
import { areAmbassadorsEnabled } from '../_shared/org-capabilities.ts'
import {
  linkCoordinatorTaskToPipelineRun,
  syncCoordinatorTaskFromRun,
} from '../_shared/samm-memory.ts'
import {
  buildStructuredConfigSummary,
  getPrimaryIcpCategory,
  getPrimaryOffer,
  loadStructuredConfigSnapshot,
  type StructuredConfigSnapshot,
} from '../_shared/structured-config.ts'
import {
  DEFAULT_SUPPORT_CONTENT_TYPES,
  loadCampaignCalendarPlanningContext,
  type CalendarPlanningContext,
  type ResolvedCalendarSlot,
} from '../_shared/calendar-coordination.ts'

// ── types ─────────────────────────────────────────────────────────────
interface NewContent {
  id: string
  type: 'content_piece' | 'product_page'
  title: string
  description: string
  url: string
  subject: string
  university_relevance: string[]
}

interface WeeklyPost {
  platform: 'facebook' | 'whatsapp' | 'youtube' | 'email'
  body: string
  subject_line?: string
  content_source?: string
  scheduled_day: string
  scheduled_at?: string
  slot_id?: string
  purpose?: 'baseline' | 'support'
  content_type?: string
  cta_text?: string | null
  window_ref?: string | null
  campaign_ref?: string | null
}

interface PipelineContext {
  orgId: string
  today: string
  calendarEvents?: any[]
}

interface PipelineBResults {
  content_items_found: number
  posts_drafted: number
  drafts_sent_for_approval: number
  posts_published: number
  ambassador_update_sent: boolean
  report_generated: boolean
  errors: string[]
  draft_content_ids: string[]
  planning_horizon_days: number
  calendar_windows_considered: number
  resolved_slots: number
  baseline_slots: number
  support_slots: number
  campaign_slots: number
  content_strategy_summary?: Record<string, unknown> | null
}

type BaselineContentCategory =
  | 'education'
  | 'inspiration'
  | 'interactive'
  | 'trust'
  | 'promotional'

type PlannedSlotDirective = {
  slot_id: string
  channel: WeeklyPost['platform']
  purpose: 'baseline' | 'support'
  required_content_type: string
  required_cta_text: string | null
  angle_constraint: string
  audience_anchor: string | null
  offer_anchor: string | null
  seasonality_anchor: string | null
}

type WeeklyContentStrategy = {
  profile: string
  active_channels: string[]
  baseline_mix: Record<BaselineContentCategory, number>
  weekly_post_budget: number
  support_slot_budget: number
  channel_targets: Record<string, number>
  content_type_targets: Record<BaselineContentCategory, number>
  selected_baseline_slot_ids: string[]
  selected_support_slot_ids: string[]
  selected_slot_ids: string[]
  directives: Record<string, PlannedSlotDirective>
}

// ── org config helper ─────────────────────────────────────────────────
async function getOrgConfig(supabase: any, orgId: string) {
  const { data, error } = await supabase
    .from('org_config')
    .select('*')
    .eq('org_id', orgId)
    .single()
  if (error) throw new Error(`Failed to load org config: ${error.message}`)
  return data
}

// ── brand voice prompt builder ────────────────────────────────────────
function buildSystemPrompt(brandVoice: any, orgLabel?: string): string {
  const tone = brandVoice?.tone ?? 'clear, helpful, and on-brand'
  const audience = brandVoice?.target_audience?.trim() || 'your core audience'
  const alwaysSay = Array.isArray(brandVoice?.always_say) && brandVoice.always_say.length > 0
    ? brandVoice.always_say.join(', ')
    : 'be useful, concrete, and trustworthy'
  const neverSay = Array.isArray(brandVoice?.never_say) && brandVoice.never_say.length > 0
    ? brandVoice.never_say.join(', ')
    : 'make unrealistic promises or sound generic'
  const ctaPreference = brandVoice?.cta_preference ?? brandVoice?.preferred_cta ?? 'Learn more'
  const goodExample = brandVoice?.example_good_post ?? brandVoice?.good_post_example ?? ''
  const badExample = brandVoice?.example_bad_post ?? brandVoice?.bad_post_example ?? ''

  const resolvedOrgLabel = orgLabel ?? brandVoice?.full_name ?? brandVoice?.name ?? 'this brand'

  return `You are the social media voice for ${resolvedOrgLabel}.
Target audience: ${audience}
Tone: ${tone}
Always: ${alwaysSay}
Never: ${neverSay}
Preferred CTA: ${ctaPreference}
${goodExample ? `Good post example: "${goodExample}"` : ''}
${badExample ? `Bad post example: "${badExample}"` : ''}`.trim()
}

// ── JSON extractor — handles markdown code fences safely ──────────────
// ── mock new content feed ─────────────────────────────────────────────
function getMockNewContent(config: any, structuredConfig: StructuredConfigSnapshot): NewContent[] {
  const orgLabel = config?.full_name?.trim() || config?.org_name?.trim() || 'Your brand'
  const primaryUrl = config?.primary_cta_url
    || config?.social_handles?.custom_app_url
    || config?.social_handles?.studyhub_url
    || 'https://example.com'
  const primaryIcp = getPrimaryIcpCategory(structuredConfig)
  const primaryOffer = getPrimaryOffer(structuredConfig)
  const audience = primaryIcp?.description?.trim()
    || config?.brand_voice?.target_audience?.trim()
    || 'your core audience'
  const featuredOfferLabel = primaryOffer?.name?.trim() || `${orgLabel} featured offer`
  const defaultCta = primaryOffer?.default_cta?.trim() || config?.brand_voice?.cta_preference || 'Learn more'

  return [
    {
      id: 'content_001',
      type: 'content_piece',
      title: featuredOfferLabel,
      description: `A timely highlight built for ${audience}. CTA focus: ${defaultCta}.`,
      url: primaryUrl,
      subject: 'Offer',
      university_relevance: []
    },
    {
      id: 'content_002',
      type: 'content_piece',
      title: `${orgLabel} customer story`,
      description: 'A trust-building story that shows the value behind the brand.',
      url: primaryUrl,
      subject: 'Story',
      university_relevance: []
    },
    {
      id: 'content_003',
      type: 'product_page',
      title: `${orgLabel} main product or landing page`,
      description: 'A direct response destination for people ready to take action.',
      url: primaryUrl,
      subject: 'CTA',
      university_relevance: []
    }
  ]
}

// ── main handler ──────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const anthropic = createAnthropicClient(Deno.env.get('ANTHROPIC_API_KEY')!)

  const payload = await req.json().catch(() => ({}))
  const orgId = payload?.orgId ?? payload?.org_id
  if (!orgId || typeof orgId !== 'string') {
    return new Response(
      JSON.stringify({ ok: false, error: 'orgId is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }
  const context: PipelineContext = {
    orgId,
    today: payload?.today ?? new Date().toISOString().split('T')[0],
    calendarEvents: Array.isArray(payload?.calendarEvents) ? payload.calendarEvents : undefined
  }

  const resumeRunId = typeof payload?.resume_run_id === 'string'
    ? payload.resume_run_id
    : typeof payload?.resumeRunId === 'string'
      ? payload.resumeRunId
      : null
  const workerRunId = typeof payload?.worker_run_id === 'string'
    ? payload.worker_run_id
    : typeof payload?.workerRunId === 'string'
      ? payload.workerRunId
      : null
  const coordinatorTaskId = typeof payload?.coordinator_task_id === 'string'
    ? payload.coordinator_task_id
    : null

  const config = await getOrgConfig(supabase, context.orgId)
  const structuredConfig = await loadStructuredConfigSnapshot(supabase, context.orgId)

  if (resumeRunId) {
    return await resumePipelineBRun({ supabase, anthropic, context, config, runId: resumeRunId })
  }

  let runId: string | null = null
  const results: PipelineBResults = {
    content_items_found: 0,
    posts_drafted: 0,
    drafts_sent_for_approval: 0,
    posts_published: 0,
    ambassador_update_sent: false,
    report_generated: false,
    errors: [] as string[],
    draft_content_ids: [] as string[],
    planning_horizon_days: 0,
    calendar_windows_considered: 0,
    resolved_slots: 0,
    baseline_slots: 0,
    support_slots: 0,
    campaign_slots: 0,
    content_strategy_summary: null,
  }

  try {
    if (workerRunId) {
      const existingRun = await loadPipelineBRun(supabase, context.orgId, workerRunId)
      runId = existingRun.id
    } else {
      runId = await createPipelineBRun(supabase, context.orgId, coordinatorTaskId)
    }

    console.log('Starting parallel fetch phase...')

    const [metricsResult, planningContext, contentResult] = await Promise.all([
      supabase
        .from('platform_metrics')
        .select('*')
        .eq('org_id', context.orgId)
        .order('snapshot_date', { ascending: false })
        .limit(8),
      loadCampaignCalendarPlanningContext(supabase, context.orgId, context.today),

      Promise.resolve({ data: getMockNewContent(config, structuredConfig), error: null })
    ])

    const lastWeekMetrics = metricsResult.data ?? []
    const resolvedPlanning = planningContext as CalendarPlanningContext
    const upcomingEvents = resolvedPlanning.windows.map((window) => ({
      id: window.event_id,
      label: window.label,
      event_type: window.event_type,
      event_date: window.event_date,
      event_end_date: window.event_end_date,
      universities: window.universities,
      owner_pipeline: window.owner_pipeline,
      window_start: window.window_start,
      window_end: window.window_end,
      exclusive_campaign: window.constraints.exclusive_campaign,
      support_content_allowed: window.constraints.support_content_allowed,
      channels_in_scope: window.constraints.channels_in_scope,
      allowed_ctas: window.constraints.allowed_ctas,
      priority: window.constraints.priority,
    }))
    const newContent = contentResult.data ?? []

    results.content_items_found = newContent.length
    results.planning_horizon_days = resolvedPlanning.planning_horizon_days
    results.calendar_windows_considered = resolvedPlanning.windows.length
    results.resolved_slots = resolvedPlanning.slots.length
    results.baseline_slots = resolvedPlanning.baseline_slots.length
    results.support_slots = resolvedPlanning.support_slots.length
    results.campaign_slots = resolvedPlanning.campaign_slots.length
    console.log(`Fetched: ${lastWeekMetrics.length} metric rows, ${upcomingEvents.length} upcoming events, ${newContent.length} new content items`)

    const allowedSlots = resolvedPlanning.slots.filter((slot) => slot.purpose === 'baseline' || slot.purpose === 'support')
    if (allowedSlots.length === 0) {
      throw new Error('No allowed baseline or support slots are available in the current planning horizon')
    }
    const contentStrategy = buildWeeklyContentStrategy(allowedSlots, structuredConfig, config, context.today)
    const planningSlots = allowedSlots.filter((slot) => contentStrategy.selected_slot_ids.includes(slot.slot_id))
    if (planningSlots.length === 0) {
      throw new Error('No planning slots were selected from the current baseline/support horizon')
    }
    results.content_strategy_summary = {
      profile: contentStrategy.profile,
      active_channels: contentStrategy.active_channels,
      baseline_mix: contentStrategy.baseline_mix,
      weekly_post_budget: contentStrategy.weekly_post_budget,
      support_slot_budget: contentStrategy.support_slot_budget,
      channel_targets: contentStrategy.channel_targets,
      content_type_targets: contentStrategy.content_type_targets,
      selected_baseline_slot_ids: contentStrategy.selected_baseline_slot_ids,
      selected_support_slot_ids: contentStrategy.selected_support_slot_ids,
      selected_slot_ids: contentStrategy.selected_slot_ids,
      directives: Object.values(contentStrategy.directives).map((directive) => ({
        slot_id: directive.slot_id,
        purpose: directive.purpose,
        channel: directive.channel,
        required_content_type: directive.required_content_type,
        required_cta_text: directive.required_cta_text,
      })),
    }

    console.log('Running plan agent...')
    const weeklyPlan = await runPlanAgent(
      anthropic,
      planningSlots,
      contentStrategy,
      lastWeekMetrics,
      upcomingEvents,
      newContent,
      context.today,
      config.posting_limits,
      config,
      structuredConfig
    )
    console.log(`Plan created: ${weeklyPlan.length} posts planned`)

    console.log('Running copy writer...')
    const draftedPosts: WeeklyPost[] = []

    for (const planItem of weeklyPlan) {
      const post = await runCopyWriter(anthropic, planItem, newContent, config.brand_voice, structuredConfig, contentStrategy)
      draftedPosts.push(post)
      results.posts_drafted++
    }

    console.log('Sending drafts to Content Registry for approval...')

    for (const post of draftedPosts) {
      const { data: registryRow } = await supabase
        .from('content_registry')
        .insert({
          org_id: context.orgId,
          platform: post.platform,
          body: post.body,
          subject_line: post.subject_line ?? null,
          status: 'draft',
          pipeline_run_id: runId,
          scheduled_at: post.scheduled_at ?? getScheduledTime(post.scheduled_day, context.today),
          created_by: 'pipeline-b-weekly',
          metadata: {
            owner_pipeline: 'pipeline-b-weekly',
            purpose: post.purpose ?? 'baseline',
            content_type: post.content_type ?? null,
            cta_text: post.cta_text ?? null,
            slot_ref: post.slot_id ?? null,
            window_ref: post.window_ref ?? null,
            campaign_ref: post.campaign_ref ?? null,
            planning_horizon_days: results.planning_horizon_days,
          },
        })
        .select('id')
        .single()

      if (registryRow?.id) {
        results.draft_content_ids.push(registryRow.id)
      }

      results.drafts_sent_for_approval++
    }

    console.log(`${results.drafts_sent_for_approval} drafts sent to Content Registry`)

    await updatePipelineBRun(
      supabase,
      runId,
      PIPELINE_RUN_STATUS.WAITING_HUMAN,
      results
    )

    return new Response(
      JSON.stringify({ ok: true, waiting_human: true, run_id: runId, ...results }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    results.errors.push(message)
    await updatePipelineBRun(
      supabase,
      runId,
      PIPELINE_RUN_STATUS.FAILED,
      { ...results, error: message }
    )
    console.error('Pipeline B failed:', err)
    return new Response(
      JSON.stringify({ ok: false, error: message, run_id: runId, ...results }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function createPipelineBRun(supabase: any, orgId: string, coordinatorTaskId?: string | null) {
  const { data, error } = await supabase
    .from('pipeline_runs')
    .insert({
      org_id: orgId,
      pipeline: 'pipeline-b-weekly',
      coordinator_task_id: coordinatorTaskId ?? null,
      status: PIPELINE_RUN_STATUS.RUNNING,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create Pipeline B run: ${error.message}`)
  if (coordinatorTaskId && data?.id) {
    await linkCoordinatorTaskToPipelineRun(supabase, {
      taskId: coordinatorTaskId,
      runId: data.id,
    })
  }
  return data?.id as string
}

async function loadPipelineBRun(supabase: any, orgId: string, runId: string) {
  const { data, error } = await supabase
    .from('pipeline_runs')
    .select('*')
    .eq('id', runId)
    .eq('org_id', orgId)
    .eq('pipeline', 'pipeline-b-weekly')
    .single()

  if (error) throw new Error(`Failed to load Pipeline B run: ${error.message}`)
  return data
}

async function updatePipelineBRun(
  supabase: any,
  runId: string,
  status: string,
  result: Record<string, unknown>,
) {
  const patch: Record<string, unknown> = {
    status,
    result,
  }

  if (
    status === PIPELINE_RUN_STATUS.SUCCESS
    || status === PIPELINE_RUN_STATUS.FAILED
    || status === PIPELINE_RUN_STATUS.CANCELLED
  ) {
    patch.finished_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('pipeline_runs')
    .update(patch)
    .eq('id', runId)

  if (error) throw new Error(`Failed to update Pipeline B run: ${error.message}`)
  await syncCoordinatorTaskFromRun(supabase, {
    runId,
    status: status as PipelineRunStatus,
    result,
  })
}

async function resumePipelineBRun(params: {
  supabase: any
  anthropic: ReturnType<typeof createAnthropicClient>
  context: PipelineContext
  config: any
  runId: string
}) {
  const { supabase, anthropic, context, config, runId } = params
  const run = await loadPipelineBRun(supabase, context.orgId, runId)

  if (run.status === PIPELINE_RUN_STATUS.SUCCESS || run.status === PIPELINE_RUN_STATUS.CANCELLED) {
    return new Response(
      JSON.stringify({ ok: true, already_final: true, run_id: runId, ...(run.result ?? {}) }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (run.status !== PIPELINE_RUN_STATUS.WAITING_HUMAN && run.status !== PIPELINE_RUN_STATUS.RESUMED) {
    return new Response(
      JSON.stringify({ ok: false, error: `Pipeline B run ${runId} is not resumable from status ${run.status}` }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const stored = (run.result ?? {}) as Record<string, any>
  const results = {
    content_items_found: stored.content_items_found ?? 0,
    posts_drafted: stored.posts_drafted ?? 0,
    drafts_sent_for_approval: stored.drafts_sent_for_approval ?? 0,
    posts_published: stored.posts_published ?? 0,
    ambassador_update_sent: stored.ambassador_update_sent ?? false,
    report_generated: stored.report_generated ?? false,
    errors: Array.isArray(stored.errors) ? stored.errors : [],
    draft_content_ids: Array.isArray(stored.draft_content_ids) ? stored.draft_content_ids : [],
    planning_horizon_days: stored.planning_horizon_days ?? 0,
    calendar_windows_considered: stored.calendar_windows_considered ?? 0,
    resolved_slots: stored.resolved_slots ?? 0,
    baseline_slots: stored.baseline_slots ?? 0,
    support_slots: stored.support_slots ?? 0,
    campaign_slots: stored.campaign_slots ?? 0,
    content_strategy_summary: stored.content_strategy_summary ?? null,
  }

  await updatePipelineBRun(
    supabase,
    runId,
    PIPELINE_RUN_STATUS.RESUMED,
    results
  )

  try {
    const { data: draftRows, error: draftsError } = await supabase
      .from('content_registry')
      .select('*')
      .eq('org_id', context.orgId)
      .in('id', results.draft_content_ids)

    if (draftsError) throw new Error(`Failed to load Pipeline B drafts: ${draftsError.message}`)

    const drafts = draftRows ?? []
    const pendingDrafts = drafts.filter((row: any) => row.status === 'draft')
    if (pendingDrafts.length > 0) {
      await updatePipelineBRun(
        supabase,
        runId,
        PIPELINE_RUN_STATUS.WAITING_HUMAN,
        results
      )

      return new Response(
        JSON.stringify({ ok: true, waiting_human: true, pending_drafts: pendingDrafts.length, run_id: runId, ...results }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    const approvedDrafts = drafts.filter((row: any) => row.status === 'scheduled' || row.status === 'approved')
    if (approvedDrafts.length === 0) {
      await updatePipelineBRun(
        supabase,
        runId,
        PIPELINE_RUN_STATUS.CANCELLED,
        results
      )

      return new Response(
        JSON.stringify({ ok: true, cancelled: true, run_id: runId, ...results }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: lastWeekMetrics, error: metricsError } = await supabase
      .from('platform_metrics')
      .select('*')
      .eq('org_id', context.orgId)
      .order('snapshot_date', { ascending: false })
      .limit(8)

    if (metricsError) throw new Error(`Failed to reload metrics for Pipeline B resume: ${metricsError.message}`)

    const now = Date.now()
    const duePosts = approvedDrafts.filter((row: any) => !row.scheduled_at || new Date(row.scheduled_at).getTime() <= now)
    const publishSummary = await publishDueContentRows({
      supabase,
      rows: duePosts,
      claimPrefix: `pipeline-b:${runId}`,
    })

    results.posts_published += publishSummary.published
    for (const failed of publishSummary.results.filter((row) => row.outcome === 'failed')) {
      results.errors.push(`${failed.platform}: ${failed.error}`)
    }

    if (!results.ambassador_update_sent && areAmbassadorsEnabled(config)) {
      await runAmbassadorUpdate(supabase, anthropic, context, getMockNewContent(config), config.brand_voice, config)
      results.ambassador_update_sent = true
    } else if (!areAmbassadorsEnabled(config)) {
      console.log('Ambassadors module disabled; skipping ambassador update')
    }

    if (!results.report_generated) {
      await runReporter(supabase, anthropic, context, lastWeekMetrics ?? [], results, config)
      results.report_generated = true
    }

    await updatePipelineBRun(
      supabase,
      runId,
      PIPELINE_RUN_STATUS.SUCCESS,
      results
    )

    return new Response(
      JSON.stringify({ ok: true, resumed: true, run_id: runId, ...results }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    results.errors.push(message)
    await updatePipelineBRun(
      supabase,
      runId,
      PIPELINE_RUN_STATUS.FAILED,
      { ...results, error: message }
    )

    return new Response(
      JSON.stringify({ ok: false, error: message, run_id: runId, ...results }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// plan agent ────────────────────────────────────────────────────────
async function runPlanAgent(
  anthropic: ReturnType<typeof createAnthropicClient>,
  allowedSlots: ResolvedCalendarSlot[],
  contentStrategy: WeeklyContentStrategy,
  metrics: any[],
  upcomingEvents: any[],
  newContent: NewContent[],
  today: string,
  postingLimits: any,
  config: any,
  structuredConfig: StructuredConfigSnapshot
): Promise<any[]> {
  const structuredSummary = buildStructuredConfigSummary(structuredConfig, today)
  const limitsStr = postingLimits
    ? `Weekly posting limits per platform: ${JSON.stringify(postingLimits)}`
    : 'Default: plan 5 posts across platforms.'
  const slotInputs = allowedSlots.map((slot) => ({
    slot_id: slot.slot_id,
    date: slot.date,
    channel: slot.channel,
    purpose: slot.purpose,
    allowed_ctas: slot.allowed_ctas,
    allowed_content_types: slot.allowed_content_types,
    window_ref: slot.window_ref,
    campaign_ref: slot.campaign_ref,
    directive: contentStrategy.directives[slot.slot_id] ?? null,
  }))
  const maxPosts = Math.min(allowedSlots.length, 9)

  try {
    const proposedPlan = await generateJsonWithAnthropic<any[]>(anthropic, {
      task: 'weekly_planner',
      maxTokens: 1200,
      system: `${buildSystemPrompt(config?.brand_voice, config?.full_name?.trim() || config?.org_name?.trim() || 'this brand')}

You are the weekly content planner for this business.
You do not invent free-form weekly posts. You fill only the allowed slots provided to you.
Each slot may be used at most once. Never invent a slot_id, date, channel, or purpose.
Treat the campaign calendar, ICP, offer catalog, seasonality, approval policy, and outreach defaults as source-of-truth business constraints.
Support content means:
- it does NOT introduce a new offer
- it does NOT override the allowed CTA
- it reinforces the active campaign message
- it must stay within the slot's allowed content types
Brand keywords are supporting language, not the central angle for every post.
Use them only when they naturally support the required content type.
Treat each slot directive as mandatory:
- respect the required content type
- respect the required CTA when supplied
- anchor each baseline post to the named audience use case, offer, or seasonality trigger instead of falling back to generic source-story copy

${limitsStr}

Respond with JSON only - an array of up to ${maxPosts} plan items:
[
  {
    "slot_id": "must match one allowed slot exactly",
    "platform": "facebook|whatsapp|youtube|email",
    "content_id": "id of the new content to feature, or null for original",
    "angle": "what angle or hook to use",
    "scheduled_day": "monday|tuesday|wednesday|thursday|friday",
    "goal": "awareness|trust|action|loyalty",
    "purpose": "baseline|support",
    "content_type": "education|inspiration|interactive|trust|promotional|reminder|reinforcement|faq|testimonial|countdown",
    "cta_text": "exact CTA text to use for this slot, or null"
  }
]`,
      messages: [{
        role: 'user',
        content: `Today: ${today}

Allowed slots for this planning horizon:
${JSON.stringify(slotInputs, null, 2)}

New content available:
${JSON.stringify(newContent, null, 2)}

Upcoming events (next 21 days):
${JSON.stringify(upcomingEvents.map(e => ({
  label: e.label,
  date: e.event_date,
  type: e.event_type,
  universities: e.universities
})), null, 2)}

Last week metrics:
${JSON.stringify(metrics.slice(0, 4).map(m => ({
  platform: m.platform,
  engagement: m.engagement,
  reach: m.post_reach
})), null, 2)}

Structured business config:
${structuredSummary}

Weekly content strategy profile:
${JSON.stringify({
  profile: contentStrategy.profile,
  active_channels: contentStrategy.active_channels,
  baseline_mix: contentStrategy.baseline_mix,
  weekly_post_budget: contentStrategy.weekly_post_budget,
  support_slot_budget: contentStrategy.support_slot_budget,
  channel_targets: contentStrategy.channel_targets,
  content_type_targets: contentStrategy.content_type_targets,
  selected_slot_ids: contentStrategy.selected_slot_ids,
}, null, 2)}

Create this week's content plan.`
      }],
      fallback: '[]',
    })
    return normalizeWeeklyPlan(proposedPlan, allowedSlots, structuredConfig, contentStrategy)
  } catch (e) {
    console.error('Plan agent JSON parse failed:', e)
    return buildFallbackPlan(allowedSlots, structuredConfig, contentStrategy)
  }
}
// ── copy writer ───────────────────────────────────────────────────────
function toScheduledDay(date: string) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase()
}

function toScheduledAt(date: string) {
  return new Date(`${date}T09:00:00.000Z`).toISOString()
}

function normalizeWeeklyPlan(
  rawPlan: any[],
  allowedSlots: ResolvedCalendarSlot[],
  structuredConfig: StructuredConfigSnapshot,
  contentStrategy: WeeklyContentStrategy,
): any[] {
  const slotMap = new Map(allowedSlots.map((slot) => [slot.slot_id, slot]))
  const usedSlots = new Set<string>()
  const normalized: any[] = []
  const primaryOffer = getPrimaryOffer(structuredConfig)

  for (const item of Array.isArray(rawPlan) ? rawPlan : []) {
    const slotId = typeof item?.slot_id === 'string' ? item.slot_id : ''
    if (!slotMap.has(slotId) || usedSlots.has(slotId)) continue

    const slot = slotMap.get(slotId)!
    const directive = contentStrategy.directives[slot.slot_id]
    const requestedType = typeof item?.content_type === 'string' && item.content_type.trim().length > 0
      ? item.content_type.trim().toLowerCase()
      : directive?.required_content_type ?? (slot.purpose === 'support'
        ? DEFAULT_SUPPORT_CONTENT_TYPES[0]
        : 'education')
    const preferredType = directive?.required_content_type ?? requestedType
    const contentType = slot.allowed_content_types.length > 0 && !slot.allowed_content_types.includes(preferredType)
      ? slot.allowed_content_types[0]
      : preferredType
    const requestedCta = typeof item?.cta_text === 'string' && item.cta_text.trim().length > 0
      ? item.cta_text.trim()
      : null
    const ctaText = directive?.required_cta_text
      ?? requestedCta
      ?? slot.allowed_ctas[0]
      ?? primaryOffer?.default_cta
      ?? null

    normalized.push({
      slot_id: slot.slot_id,
      platform: slot.channel,
      content_id: typeof item?.content_id === 'string' ? item.content_id : null,
      angle: typeof item?.angle === 'string' && item.angle.trim().length > 0
        ? item.angle.trim()
        : directive?.angle_constraint ?? (slot.purpose === 'support'
          ? 'reinforce the active campaign message without introducing a new offer'
          : 'deliver a useful, concrete post grounded in current config'),
      scheduled_day: toScheduledDay(slot.date),
      scheduled_at: toScheduledAt(slot.date),
      goal: typeof item?.goal === 'string' ? item.goal : (slot.purpose === 'support' ? 'action' : 'trust'),
      purpose: slot.purpose,
      content_type: contentType,
      cta_text: ctaText,
      window_ref: slot.window_ref,
      campaign_ref: slot.campaign_ref,
    })
    usedSlots.add(slot.slot_id)
  }

  return normalized.length > 0 ? normalized : buildFallbackPlan(allowedSlots, structuredConfig, contentStrategy)
}

function buildFallbackPlan(
  allowedSlots: ResolvedCalendarSlot[],
  structuredConfig: StructuredConfigSnapshot,
  contentStrategy: WeeklyContentStrategy,
): any[] {
  return allowedSlots.slice(0, Math.min(allowedSlots.length, 6)).map((slot, index) => {
    const directive = contentStrategy.directives[slot.slot_id]
    return {
    slot_id: slot.slot_id,
    platform: slot.channel,
    content_id: null,
    angle: directive?.angle_constraint ?? (slot.purpose === 'support'
      ? 'reinforce the active campaign message and urgency'
      : index % 2 === 0
        ? 'educate with a practical angle tied to the current offer'
        : 'build trust with proof, source story, or product reality'),
    scheduled_day: toScheduledDay(slot.date),
    scheduled_at: toScheduledAt(slot.date),
    goal: slot.purpose === 'support' ? 'action' : (index % 2 === 0 ? 'awareness' : 'trust'),
    purpose: slot.purpose,
    content_type: directive?.required_content_type ?? (slot.purpose === 'support'
      ? DEFAULT_SUPPORT_CONTENT_TYPES[0]
      : index % 2 === 0
        ? 'education'
        : 'trust'),
    cta_text: directive?.required_cta_text ?? slot.allowed_ctas[0] ?? null,
    window_ref: slot.window_ref,
    campaign_ref: slot.campaign_ref,
    }
  })
}

async function runCopyWriter(
  anthropic: ReturnType<typeof createAnthropicClient>,
  planItem: any,
  newContent: NewContent[],
  brandVoice: any,
  structuredConfig: StructuredConfigSnapshot,
  contentStrategy: WeeklyContentStrategy,
): Promise<WeeklyPost> {

  const featuredContent = newContent.find(c => c.id === planItem.content_id)
  const primaryOffer = getPrimaryOffer(structuredConfig)
  const primaryIcp = getPrimaryIcpCategory(structuredConfig)
  const structuredSummary = buildStructuredConfigSummary(structuredConfig, new Date().toISOString().split('T')[0])
  const hashtags = Array.isArray(brandVoice?.hashtags) && brandVoice.hashtags.length > 0
    ? brandVoice.hashtags.join(' ')
    : ''
  const postFormatPreference = brandVoice?.post_format_preference?.trim() || ''
  const directive = contentStrategy.directives[planItem.slot_id]
  const supportRule = planItem.purpose === 'support'
    ? 'This is support content inside an active campaign window. Reinforce the campaign message only. Do not introduce a new offer or a different CTA.'
    : 'This is baseline content. Stay within the configured business truth, anchor the post to the named audience, offer, or seasonality cue, and avoid inventing a campaign.'

  const response = await generateTextWithAnthropic(anthropic, {
    task: 'weekly_copywriter',
    maxTokens: 300,
    system: `${buildSystemPrompt(brandVoice)}

For email: include a subject line on the first line starting with "Subject: "
For WhatsApp: keep under 200 characters, conversational
For Facebook: 2-3 sentences, engaging hook, emoji ok
For YouTube community: short, drives comments
Use the provided CTA exactly when one is supplied.
${supportRule}
Use at most 1-2 "always say" keywords when they are naturally relevant. Do not force all brand keywords into every post.
If approved hashtags exist, only use those hashtags and do not invent new ones.
Treat geographic/source language as supporting proof, not the whole idea, unless the required content type is trust or testimonial.

Write the post copy only — no preamble.`,
    messages: [{
      role: 'user',
      content: `Write a ${planItem.platform} post.
Goal: ${planItem.goal}
Angle: ${planItem.angle}
Scheduled: ${planItem.scheduled_day}
Purpose: ${planItem.purpose ?? 'baseline'}
Content type: ${planItem.content_type ?? 'education'}
Required CTA: ${planItem.cta_text ?? 'none'}
Primary offer: ${primaryOffer?.name ?? 'none configured'}
Primary audience segment: ${primaryIcp?.name ?? 'none configured'}
Primary offer CTA: ${primaryOffer?.default_cta ?? 'none configured'}
Audience description: ${primaryIcp?.description ?? 'none configured'}
Slot directive: ${directive ? JSON.stringify(directive, null, 2) : 'none'}
Structured config summary: ${structuredSummary}
Approved hashtags: ${hashtags || 'none'}
Post format preference: ${postFormatPreference || 'none'}
${featuredContent
  ? `Featured content:\nTitle: ${featuredContent.title}\nURL: ${featuredContent.url}`
  : 'No specific content — write an original engagement post.'}`
    }]
  })

  const body = response.content[0].type === 'text'
    ? response.content[0].text.trim()
    : ''

  let subject_line: string | undefined
  let postBody = body
  if (planItem.platform === 'email' && body.startsWith('Subject: ')) {
    const lines = body.split('\n')
    subject_line = lines[0].replace('Subject: ', '').trim()
    postBody = lines.slice(1).join('\n').trim()
  }

  return {
    platform: planItem.platform,
    body: postBody,
    subject_line,
    content_source: featuredContent?.url,
    scheduled_day: planItem.scheduled_day,
    scheduled_at: planItem.scheduled_at,
    slot_id: planItem.slot_id,
    purpose: planItem.purpose,
    content_type: planItem.content_type,
    cta_text: planItem.cta_text ?? null,
    window_ref: planItem.window_ref ?? null,
    campaign_ref: planItem.campaign_ref ?? null,
  }
}

function buildWeeklyContentStrategy(
  allowedSlots: ResolvedCalendarSlot[],
  structuredConfig: StructuredConfigSnapshot,
  config: any,
  today: string,
): WeeklyContentStrategy {
  const primaryOffer = getPrimaryOffer(structuredConfig)
  const primaryIcp = getPrimaryIcpCategory(structuredConfig)
  const structuredSummary = JSON.parse(buildStructuredConfigSummary(structuredConfig, today))
  const activeSeasonality = structuredSummary.active_seasonality as Record<string, unknown> | null
  const defaultChannels = Array.isArray(structuredConfig.campaignDefaults?.default_channels)
    ? structuredConfig.campaignDefaults.default_channels
    : Array.isArray(primaryIcp?.default_channels)
      ? primaryIcp.default_channels
      : []
  const activeChannels = Array.from(new Set([
    ...defaultChannels,
    ...allowedSlots.map((slot) => slot.channel),
  ]))
  const profile = isRetailProductOffer(primaryOffer)
    ? 'b2c_retail_cpg_default'
    : 'general_default'

  let baselineMix: Record<BaselineContentCategory, number> = isRetailProductOffer(primaryOffer)
    ? {
        education: 15,
        inspiration: 25,
        interactive: 10,
        trust: 25,
        promotional: 25,
      }
    : {
        education: 30,
        inspiration: 20,
        interactive: 10,
        trust: 25,
        promotional: 15,
      }

  const defaultObjective = (structuredConfig.campaignDefaults?.default_objective ?? '').toString().toLowerCase()
  if (defaultObjective === 'conversion' || defaultObjective === 'sales') {
    baselineMix = {
      education: Math.max(10, baselineMix.education - 5),
      inspiration: baselineMix.inspiration,
      interactive: Math.max(5, baselineMix.interactive - 5),
      trust: baselineMix.trust,
      promotional: baselineMix.promotional + 10,
    }
  } else if (defaultObjective === 'awareness') {
    baselineMix = {
      education: baselineMix.education + 5,
      inspiration: baselineMix.inspiration + 5,
      interactive: Math.max(5, baselineMix.interactive - 5),
      trust: baselineMix.trust,
      promotional: Math.max(10, baselineMix.promotional - 5),
    }
  }

  if (activeSeasonality?.demand_level === 'high') {
    baselineMix = {
      education: Math.max(10, baselineMix.education - 5),
      inspiration: baselineMix.inspiration,
      interactive: Math.max(5, baselineMix.interactive - 5),
      trust: baselineMix.trust + 5,
      promotional: baselineMix.promotional + 5,
    }
  }

  const baselineSlots = allowedSlots.filter((slot) => slot.purpose === 'baseline')
  const supportSlots = allowedSlots.filter((slot) => slot.purpose === 'support')
  const weeklyPostBudget = deriveWeeklyPostBudget(activeChannels, activeSeasonality, profile, structuredConfig, supportSlots.length)
  const supportSlotBudget = deriveSupportSlotBudget(supportSlots, weeklyPostBudget, activeSeasonality, structuredConfig)
  const selectedSupportSlots = selectSupportSlots(supportSlots, supportSlotBudget)
  const remainingBaselineBudget = Math.max(0, weeklyPostBudget - selectedSupportSlots.length)
  const channelTargets = buildChannelTargets(activeChannels, remainingBaselineBudget, profile)
  const selectedBaselineSlots = selectBaselineSlots(baselineSlots, channelTargets, remainingBaselineBudget)
  const selectedSlotIds = [
    ...selectedBaselineSlots.map((slot) => slot.slot_id),
    ...selectedSupportSlots.map((slot) => slot.slot_id),
  ]
  const { assignments: baselineAssignments, targetCounts: contentTypeTargets } = assignBaselineContentTypes(selectedBaselineSlots, baselineMix)
  const directives: Record<string, PlannedSlotDirective> = {}

  for (const slot of selectedBaselineSlots) {
    const requiredContentType = baselineAssignments[slot.slot_id] ?? 'education'
    const requiredCtaText = requiredContentType === 'promotional' || requiredContentType === 'trust'
      ? slot.allowed_ctas[0] ?? primaryOffer?.default_cta ?? config?.brand_voice?.cta_preference ?? null
      : slot.allowed_ctas[0] ?? null
    directives[slot.slot_id] = {
      slot_id: slot.slot_id,
      channel: slot.channel,
      purpose: 'baseline',
      required_content_type: requiredContentType,
      required_cta_text: requiredCtaText,
      angle_constraint: buildBaselineAngleConstraint(requiredContentType, primaryOffer, primaryIcp, activeSeasonality),
      audience_anchor: primaryIcp?.name ?? null,
      offer_anchor: primaryOffer?.name ?? null,
      seasonality_anchor: activeSeasonality?.period_name?.toString() ?? null,
    }
  }

  for (const slot of supportSlots) {
    const requiredContentType = slot.allowed_content_types.find((value) => DEFAULT_SUPPORT_CONTENT_TYPES.includes(value))
      ?? DEFAULT_SUPPORT_CONTENT_TYPES[0]
    directives[slot.slot_id] = {
      slot_id: slot.slot_id,
      channel: slot.channel,
      purpose: 'support',
      required_content_type: requiredContentType,
      required_cta_text: slot.allowed_ctas[0] ?? primaryOffer?.default_cta ?? null,
      angle_constraint: 'Reinforce the active campaign message and urgency without introducing a new offer or narrative.',
      audience_anchor: primaryIcp?.name ?? null,
      offer_anchor: primaryOffer?.name ?? null,
      seasonality_anchor: activeSeasonality?.period_name?.toString() ?? null,
    }
  }

  return {
    profile,
    active_channels: activeChannels,
    baseline_mix: baselineMix,
    weekly_post_budget: weeklyPostBudget,
    support_slot_budget: selectedSupportSlots.length,
    channel_targets: channelTargets,
    content_type_targets: contentTypeTargets,
    selected_baseline_slot_ids: selectedBaselineSlots.map((slot) => slot.slot_id),
    selected_support_slot_ids: selectedSupportSlots.map((slot) => slot.slot_id),
    selected_slot_ids: selectedSlotIds,
    directives,
  }
}

function deriveWeeklyPostBudget(
  activeChannels: string[],
  activeSeasonality: Record<string, unknown> | null,
  profile: string,
  structuredConfig: StructuredConfigSnapshot,
  supportSlotCount: number,
) {
  let budget = profile === 'b2c_retail_cpg_default' ? 6 : 5
  if (activeChannels.length <= 2) {
    budget = Math.min(budget, Math.max(3, activeChannels.length + 2))
  }
  if (activeSeasonality?.demand_level === 'high') {
    budget += 1
  } else if (activeSeasonality?.demand_level === 'low') {
    budget = Math.max(4, budget - 1)
  }
  if (supportSlotCount > 0) {
    budget += 1
  }
  const horizonCap = Math.max(4, Math.min(9, activeChannels.length * 2 + 1))
  const baselineAllowed = structuredConfig.campaignDefaults?.baseline_content_allowed
  if (baselineAllowed === false) {
    return Math.min(Math.max(1, supportSlotCount), horizonCap)
  }
  return Math.min(Math.max(4, budget), horizonCap)
}

function buildChannelTargets(
  activeChannels: string[],
  weeklyPostBudget: number,
  profile: string,
) {
  const defaults = profile === 'b2c_retail_cpg_default'
    ? { facebook: 0.34, whatsapp: 0.33, youtube: 0.17, email: 0.16 }
    : { facebook: 0.3, whatsapp: 0.2, youtube: 0.3, email: 0.2 }

  const targets: Record<string, number> = {}
  const activeSet = new Set(activeChannels)
  const weightedChannels = Object.entries(defaults).filter(([channel]) => activeSet.has(channel))
  const fallbackChannels = activeChannels.filter((channel) => !(channel in defaults))

  let assigned = 0
  for (const [channel, weight] of weightedChannels) {
    const count = Math.floor(weight * weeklyPostBudget)
    targets[channel] = count
    assigned += count
  }
  for (const channel of fallbackChannels) {
    targets[channel] = 0
  }

  const priority = [
    ...weightedChannels
      .sort((a, b) => b[1] - a[1])
      .map(([channel]) => channel),
    ...fallbackChannels,
  ]

  let cursor = 0
  while (assigned < weeklyPostBudget && priority.length > 0) {
    const channel = priority[cursor % priority.length]
    targets[channel] = (targets[channel] ?? 0) + 1
    assigned += 1
    cursor += 1
  }

  for (const channel of activeChannels) {
    if ((targets[channel] ?? 0) === 0 && weeklyPostBudget >= activeChannels.length) {
      targets[channel] = 1
    }
  }

  return targets
}

function deriveSupportSlotBudget(
  supportSlots: ResolvedCalendarSlot[],
  weeklyPostBudget: number,
  activeSeasonality: Record<string, unknown> | null,
  structuredConfig: StructuredConfigSnapshot,
) {
  if (supportSlots.length === 0 || weeklyPostBudget <= 0) return 0

  const baselineAllowed = structuredConfig.campaignDefaults?.baseline_content_allowed
  if (baselineAllowed === false) {
    return Math.min(supportSlots.length, Math.max(1, weeklyPostBudget))
  }

  let budget = Math.max(1, Math.ceil(weeklyPostBudget * 0.34))
  if (activeSeasonality?.demand_level === 'high') {
    budget += 1
  }

  return Math.min(supportSlots.length, Math.min(3, budget))
}

function selectBaselineSlots(
  baselineSlots: ResolvedCalendarSlot[],
  channelTargets: Record<string, number>,
  maxBudget: number,
) {
  if (maxBudget <= 0) return []
  const remainingTargets = { ...channelTargets }
  const selected: ResolvedCalendarSlot[] = []
  const usedSlotIds = new Set<string>()
  const dailyCounts = new Map<string, number>()
  const slotsByDate = new Map<string, ResolvedCalendarSlot[]>()

  for (const slot of baselineSlots) {
    const existing = slotsByDate.get(slot.date) ?? []
    existing.push(slot)
    slotsByDate.set(slot.date, existing)
  }

  const dates = [...slotsByDate.keys()].sort((a, b) => a.localeCompare(b))
  let progress = true
  while (progress) {
    progress = false
    for (const date of dates) {
      const postsOnDate = dailyCounts.get(date) ?? 0
      if (postsOnDate >= 2) continue

      const candidates = (slotsByDate.get(date) ?? [])
        .filter((slot) => !usedSlotIds.has(slot.slot_id))
        .filter((slot) => (remainingTargets[slot.channel] ?? 0) > 0)
        .sort((a, b) => {
          const delta = (remainingTargets[b.channel] ?? 0) - (remainingTargets[a.channel] ?? 0)
          if (delta !== 0) return delta
          return a.channel.localeCompare(b.channel)
        })

      const next = candidates[0]
      if (!next) continue

      selected.push(next)
      if (selected.length >= maxBudget) {
        return selected.sort((a, b) => a.date.localeCompare(b.date) || a.channel.localeCompare(b.channel))
      }
      usedSlotIds.add(next.slot_id)
      remainingTargets[next.channel] = Math.max(0, (remainingTargets[next.channel] ?? 0) - 1)
      dailyCounts.set(date, postsOnDate + 1)
      progress = true
    }
  }

  return selected.sort((a, b) => a.date.localeCompare(b.date) || a.channel.localeCompare(b.channel))
}

function selectSupportSlots(
  supportSlots: ResolvedCalendarSlot[],
  remainingBudget: number,
) {
  if (remainingBudget <= 0) return []
  const selected: ResolvedCalendarSlot[] = []
  const usedDates = new Set<string>()
  const channelCounts = new Map<string, number>()

  for (const slot of [...supportSlots].sort((a, b) => a.date.localeCompare(b.date) || a.channel.localeCompare(b.channel))) {
    if (selected.length >= remainingBudget) break

    const currentChannelCount = channelCounts.get(slot.channel) ?? 0
    if (usedDates.has(slot.date) && currentChannelCount > 0) {
      continue
    }

    selected.push(slot)
    usedDates.add(slot.date)
    channelCounts.set(slot.channel, currentChannelCount + 1)
  }

  if (selected.length >= remainingBudget) {
    return selected
  }

  for (const slot of [...supportSlots].sort((a, b) => a.date.localeCompare(b.date) || a.channel.localeCompare(b.channel))) {
    if (selected.length >= remainingBudget) break
    if (selected.some((existing) => existing.slot_id === slot.slot_id)) continue
    selected.push(slot)
  }

  return selected
}

function isRetailProductOffer(primaryOffer: any) {
  const type = (primaryOffer?.type ?? '').toString().toLowerCase()
  const category = (primaryOffer?.category ?? '').toString().toLowerCase()
  return type === 'product' || category.includes('bundle') || category.includes('gift')
}

function assignBaselineContentTypes(
  slots: ResolvedCalendarSlot[],
  baselineMix: Record<BaselineContentCategory, number>,
) {
  const categories = Object.keys(baselineMix) as BaselineContentCategory[]
  const baselineCount = Math.max(slots.length, 1)
  const targetCounts: Record<BaselineContentCategory, number> = {
    education: 0,
    inspiration: 0,
    interactive: 0,
    trust: 0,
    promotional: 0,
  }

  let assigned = 0
  for (const category of categories) {
    const count = Math.floor((baselineMix[category] / 100) * baselineCount)
    targetCounts[category] = count
    assigned += count
  }

  const sortedCategories = [...categories].sort((a, b) => baselineMix[b] - baselineMix[a])
  let cursor = 0
  while (assigned < baselineCount) {
    targetCounts[sortedCategories[cursor % sortedCategories.length]] += 1
    assigned += 1
    cursor += 1
  }

  const remaining = { ...targetCounts }
  const assignments: Record<string, BaselineContentCategory> = {}

  for (const slot of slots) {
    const preference = getChannelCategoryPreference(slot.channel)
    const nextCategory = preference.find((category) => remaining[category] > 0)
      ?? sortedCategories.find((category) => remaining[category] > 0)
      ?? 'education'
    assignments[slot.slot_id] = nextCategory
    remaining[nextCategory] = Math.max(0, remaining[nextCategory] - 1)
  }

  return {
    assignments,
    targetCounts,
  }
}

function getChannelCategoryPreference(channel: string): BaselineContentCategory[] {
  switch (channel) {
    case 'facebook':
      return ['trust', 'inspiration', 'interactive', 'promotional', 'education']
    case 'whatsapp':
      return ['promotional', 'trust', 'interactive', 'education', 'inspiration']
    case 'youtube':
      return ['education', 'trust', 'inspiration', 'interactive', 'promotional']
    case 'email':
      return ['promotional', 'trust', 'education', 'inspiration', 'interactive']
    default:
      return ['education', 'trust', 'inspiration', 'interactive', 'promotional']
  }
}

function buildBaselineAngleConstraint(
  contentType: BaselineContentCategory,
  primaryOffer: any,
  primaryIcp: any,
  activeSeasonality: Record<string, unknown> | null,
) {
  const offerName = primaryOffer?.name ?? 'the primary offer'
  const audienceName = primaryIcp?.name ?? 'the primary audience'
  const seasonalityName = activeSeasonality?.period_name?.toString() ?? 'the current demand window'

  switch (contentType) {
    case 'promotional':
      return `Center the post on ${offerName} for ${audienceName}. Make the CTA explicit and concrete.`
    case 'trust':
      return `Build confidence in ${offerName} for ${audienceName} using proof, testimonials, or product-reality cues.`
    case 'inspiration':
      return `Frame ${offerName} around the aspirational use case that matters to ${audienceName} during ${seasonalityName}.`
    case 'interactive':
      return `Invite a simple response from ${audienceName} that still points back to ${offerName} or its use case.`
    case 'education':
    default:
      return `Teach something practical for ${audienceName} that naturally leads back to ${offerName} or ${seasonalityName}.`
  }
}

// ── ambassador update ─────────────────────────────────────────────────
async function runAmbassadorUpdate(
  supabase: any,
  anthropic: ReturnType<typeof createAnthropicClient>,
  context: PipelineContext,
  newContent: NewContent[],
  brandVoice: any
) {
  const { data: ambassadors } = await supabase
    .from('ambassador_registry')
    .select('*')
    .eq('org_id', context.orgId)
    .eq('status', 'active')

  if (!ambassadors || ambassadors.length === 0) {
    console.log('No active ambassadors to update')
    return
  }

  const response = await generateTextWithAnthropic(anthropic, {
    task: 'ambassador_writer',
    maxTokens: 200,
    system: `${buildSystemPrompt(brandVoice)}

Write a brief weekly update message for this brand's ambassadors or partner reps.
Keep it energetic, under 150 words. Include new content to share and remind them to report weekly reach numbers.`,
    messages: [{
      role: 'user',
      content: `New content this week:\n${newContent.map(c => `- ${c.title} (${c.subject})`).join('\n')}\n\nWrite the ambassador update message.`
    }]
  })

  const updateMessage = response.content[0].type === 'text'
    ? response.content[0].text.trim()
    : 'New content is live this week. Share it with your audience and report back on reach.'

  console.log(`Ambassador update drafted for ${ambassadors.length} ambassadors (mock send)`)

  await supabase.from('content_registry').insert({
    org_id: context.orgId,
    platform: getIntegrationDefinition('whatsapp').id,
    body: updateMessage,
    status: 'published',
    published_at: new Date().toISOString(),
    created_by: 'pipeline-b-ambassador-update'
  })

  for (const ambassador of ambassadors) {
    await supabase
      .from('ambassador_registry')
      .update({ last_content_sent: new Date().toISOString() })
      .eq('id', ambassador.id)
  }
}

// ── reporter ──────────────────────────────────────────────────────────
async function runReporter(
  supabase: any,
  anthropic: ReturnType<typeof createAnthropicClient>,
  context: PipelineContext,
  metrics: any[],
  pipelineResults: any,
  config: any
) {
  const response = await generateTextWithAnthropic(anthropic, {
    task: 'weekly_reporter',
    maxTokens: 500,
    system: `You write concise weekly marketing reports for the business owner or operator of this workspace.
Plain text, under 200 words. Cover: what was done, key numbers, what worked, what didn't, plan for next week.`,
    messages: [{
      role: 'user',
      content: `Week ending: ${context.today}
Posts drafted: ${pipelineResults.posts_drafted}
Drafts for approval: ${pipelineResults.drafts_sent_for_approval}
Published: ${pipelineResults.posts_published}
${areAmbassadorsEnabled(config) ? `Ambassador update sent: ${pipelineResults.ambassador_update_sent}
` : ''}Metrics:
${metrics.slice(0, 4).map((m: any) =>
  `${m.platform}: ${m.followers} followers, ${m.post_reach} reach, ${m.engagement} engagement, ${m.signups} sign-ups`
).join('\n')}

Write the weekly report.`
    }]
  })

  const reportText = response.content[0].type === 'text'
    ? response.content[0].text.trim()
    : 'Weekly report unavailable.'

  await supabase.from('human_inbox').insert({
    org_id: context.orgId,
    item_type: 'weekly_report',
    priority: 'fyi',
    payload: {
      report: reportText,
      week_ending: context.today,
      metrics_snapshot: metrics.slice(0, 4),
      pipeline_results: pipelineResults
    },
    created_by_pipeline: 'pipeline-b-weekly',
    created_by_agent: getAgentDefinition('reporter').id
  })

  console.log('Weekly report sent to human inbox')
}

// ── helpers ───────────────────────────────────────────────────────────
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function getScheduledTime(day: string, today: string): string {
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  const todayDate = new Date(today)
  const todayDay = todayDate.getDay()
  const targetDay = days.indexOf(day.toLowerCase())
  const daysUntil = (targetDay - todayDay + 7) % 7 || 7
  const scheduled = new Date(todayDate)
  scheduled.setDate(scheduled.getDate() + daysUntil)
  scheduled.setHours(9, 0, 0, 0)
  return scheduled.toISOString()
}












