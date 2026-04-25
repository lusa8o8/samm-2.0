import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  expireStaleRuns,
  invokePipeline,
  resolveExplicitSchedulerRequest,
  resolveModelPipelineAction,
  resolveNormalizedWritePostIntent,
  type CalendarEventContext,
  type ChatHistoryItem,
  type ChatResponse,
  type ConversationMode,
} from './scheduler.ts'
import {
  createAnthropicClient,
  generateJsonWithAnthropic,
  getErrorMessage,
  isTransientLlmError,
} from '../_shared/llm-client.ts'
import {
  ASSET_NEED,
  PLANNING_INTENT,
  normalizeAssetNeed,
  type AssetNeed,
} from '../_shared/asset-brief-contract.ts'
import { ensureDashboardMemoryContext } from '../_shared/samm-memory.ts'

type ChatRole = 'user' | 'coordinator'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const EXECUTION_SUGGESTIONS = [
  'Summarize this week',
  'What needs my approval?',
  'What is next on the calendar?',
  'Run the engagement pipeline',
]
const PLANNING_SUGGESTIONS = [
  'Help me plan this month',
  'Add an event or campaign',
  'Review in Calendar Studio',
  'What should this month focus on?',
]
const TRANSIENT_MODEL_ERROR_MESSAGE = 'samm is temporarily busy right now. Please try again in a moment.'

type PipelineDRequestIntent = {
  topic: string
  post_title?: string | null
  platforms: string[] | null
  event_ref: string | null
  scheduled_for?: string | null
  asset_need?: AssetNeed
}

type OneTimePostSummary = {
  title: string
  scheduled_for: string | null
  event_ref: string | null
  platforms: string[]
  draft_count: number
  pending_count: number
  scheduled_count: number
  published_count: number
  content_count: number
  sample_copy: string | null
}

function safeString(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeText(value: unknown) {
  return safeString(value)?.toLowerCase().replace(/\s+/g, ' ') ?? ''
}

function jsonResponse(body: ChatResponse | { error: string }, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function summarizeRuns(rows: any[]) {
  return rows.map((row) => ({
    pipeline: row.pipeline,
    status: row.status,
    started_at: row.started_at ?? row.created_at,
    summary: row.result_summary ?? row.error_message ?? row.result?.error ?? '-',
  }))
}

function summarizeMetrics(rows: any[]) {
  return rows.slice(0, 6).map((row) => ({
    platform: row.platform,
    snapshot_date: row.snapshot_date,
    followers: row.followers ?? 0,
    reach: row.post_reach ?? row.reach ?? 0,
    engagement: row.engagement_rate ?? row.engagement ?? 0,
    signups: row.signups ?? 0,
  }))
}

function summarizeEvents(rows: any[]) {
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    event_type: row.event_type,
    event_date: row.event_date,
    universities: row.universities ?? [],
    lead_days: row.lead_days ?? null,
    pipeline_trigger: row.pipeline_trigger ?? null,
  }))
}

function buildOneTimeGroupKey(row: any) {
  const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {}
  const draftGroupId = safeString(metadata.draft_group_id)
  if (draftGroupId) return `draft-group:${draftGroupId}`

  const scheduledFor = safeString(metadata.scheduled_for) ?? safeString(row?.scheduled_at)?.slice(0, 10) ?? ''
  const eventRef = safeString(metadata.event_ref) ?? ''
  const title = normalizeText(metadata.title ?? row?.subject_line ?? row?.body)
  if (!scheduledFor || !title) return null
  return `legacy:${scheduledFor}|${eventRef}|${title}`
}

function summarizeOneTimePosts(rows: any[]) {
  const grouped = new Map<string, any[]>()

  for (const row of rows) {
    if (row?.platform === 'design_brief') continue
    const groupKey = buildOneTimeGroupKey(row)
    if (!groupKey) continue
    const existing = grouped.get(groupKey) ?? []
    existing.push(row)
    grouped.set(groupKey, existing)
  }

  return Array.from(grouped.values())
    .map((groupRows) => {
      const firstRow = groupRows[0]
      const metadata = firstRow?.metadata && typeof firstRow.metadata === 'object' ? firstRow.metadata : {}
      const platforms = Array.from(
        new Set(
          groupRows
            .map((row) => safeString(row?.platform)?.toLowerCase())
            .filter((value): value is string => Boolean(value) && value !== 'design_brief'),
        ),
      )
      const statusCounts = groupRows.reduce(
        (acc, row) => {
          const status = safeString(row?.status)?.toLowerCase()
          if (status === 'pending') acc.pending_count += 1
          else if (status === 'scheduled') acc.scheduled_count += 1
          else if (status === 'published') acc.published_count += 1
          else acc.draft_count += 1
          return acc
        },
        { draft_count: 0, pending_count: 0, scheduled_count: 0, published_count: 0 },
      )
      const sampleCopy = safeString(firstRow?.body)?.slice(0, 180) ?? null

      return {
        title: safeString(metadata.title) ?? safeString(firstRow?.subject_line) ?? 'One-time post',
        scheduled_for: safeString(metadata.scheduled_for) ?? safeString(firstRow?.scheduled_at)?.slice(0, 10) ?? null,
        event_ref: safeString(metadata.event_ref),
        platforms,
        ...statusCounts,
        content_count: groupRows.length,
        sample_copy: sampleCopy,
      }
    })
    .sort((a, b) => (a.scheduled_for ?? '').localeCompare(b.scheduled_for ?? ''))
}

function isContentGenerationRequest(message: string) {
  return /\b(generate|create|draft|write|make|produce|revise|rewrite|improve|refresh)\b/i.test(message)
    && /\b(content|copy|post|caption|carousel|graphic|visual|variation|version|asset|it|that|this)\b/i.test(message)
}

function referencesExistingPost(message: string) {
  return /\b(it|that|this|that post|this post|that one|this one)\b/i.test(message)
}

function countExistingOneTimeDrafts(post: OneTimePostSummary) {
  return post.draft_count + post.pending_count + post.scheduled_count + post.published_count
}

function extractHistoryText(history: ChatHistoryItem[]) {
  return history
    .slice(-8)
    .map((item) => (typeof item?.content === 'string' ? item.content.toLowerCase() : ''))
    .join('\n')
}

function pickRelevantOneTimePost(
  message: string,
  history: ChatHistoryItem[],
  upcomingOneTimePosts: OneTimePostSummary[],
) {
  const normalizedMessage = normalizeText(message)
  const historyText = extractHistoryText(history)
  const combinedContext = `${historyText}\n${normalizedMessage}`
  const postsWithDrafts = upcomingOneTimePosts.filter((post) => countExistingOneTimeDrafts(post) > 0)

  const directMatch = postsWithDrafts.find((post) => {
    const title = normalizeText(post.title)
    return title.length > 0 && combinedContext.includes(title)
  })
  if (directMatch) return directMatch

  const datedMatch = postsWithDrafts.find((post) => {
    if (!post.scheduled_for) return false
    const iso = post.scheduled_for.toLowerCase()
    const friendly = post.scheduled_for.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3/$1').toLowerCase()
    return combinedContext.includes(iso) || combinedContext.includes(friendly)
  })
  if (datedMatch) return datedMatch

  if (postsWithDrafts.length === 1 && referencesExistingPost(message)) {
    return postsWithDrafts[0]
  }

  if (postsWithDrafts.length > 0 && referencesExistingPost(message)) {
    return postsWithDrafts[0]
  }

  return null
}

function buildExistingOneTimePostPlanningResponse(post: OneTimePostSummary): ChatResponse {
  const platformLabel = post.platforms.length > 0 ? post.platforms.join(', ') : 'the planned channels'
  const pieces = [
    post.draft_count > 0 ? `${post.draft_count} draft${post.draft_count === 1 ? '' : 's'}` : null,
    post.pending_count > 0 ? `${post.pending_count} pending` : null,
    post.scheduled_count > 0 ? `${post.scheduled_count} scheduled` : null,
    post.published_count > 0 ? `${post.published_count} published` : null,
  ].filter((value): value is string => Boolean(value))
  const stateLabel = pieces.length > 0 ? pieces.join(', ') : `${post.content_count} content item${post.content_count === 1 ? '' : 's'}`
  const sampleNote = post.sample_copy ? ` Current copy starts: "${post.sample_copy}${post.sample_copy.length >= 180 ? '…' : ''}"` : ''

  return {
    message: `I can already see the one-time post "${post.title}" on ${post.scheduled_for ?? 'the calendar'} with ${stateLabel} across ${platformLabel}. Since you are in Planning mode, I will not generate a second batch from scratch here.${sampleNote} I can help you review what exists, sharpen the angle, improve the hook, or decide whether this needs a revision rather than a new draft set.`,
    suggestions: ['Review the current draft', 'Improve the hook', 'Tighten the CTA', 'Switch to Execution mode'],
  }
}

function summarizeInbox(rows: any[]) {
  return rows.map((row) => ({
    title: row.payload?.title ?? row.item_type,
    item_type: row.item_type,
    priority: row.priority,
    created_at: row.created_at,
  }))
}

function isGreeting(message: string) {
  const normalized = message.toLowerCase().trim()
  return /^(hi|hello|hey|yo)\b/.test(normalized)
}

function isPipelineDCommand(message: string) {
  return /^(run|start|trigger)\s+pipeline\s*d\b/i.test(message.trim())
}

function buildPlanningModeMutationBlockedResponse(target: string): ChatResponse {
  return {
    message: `You are in Planning mode, so I will not ${target} yet. I can help you shape the plan, explain the tradeoffs, teach the relevant marketing logic, and hand you off to Calendar Studio for review before anything becomes live.`,
    suggestions: PLANNING_SUGGESTIONS,
  }
}

function buildPipelineDGuidanceResponse(): ChatResponse {
  return {
    message: 'Pipeline D writes one-off posts, but it needs a topic. Tell me what to write about, for example: "write a post about discounts" or "draft a Facebook post about our grand opening".',
    suggestions: ['Write a post about discounts', 'Draft a Facebook post about our grand opening', 'Check Content Registry'],
    invoked_action: {
      type: 'run_pipeline',
      pipeline: 'pipeline-d-post',
      status: 'queued',
      run_id: null,
    },
  }
}

function buildGreetingResponse(
  orgName: string,
  upcomingEvents: Array<{ label?: string; event_date?: string }>,
  upcomingOneTimePosts: Array<{ title?: string; scheduled_for?: string | null; content_count?: number; pending_count?: number; scheduled_count?: number }>,
  pendingCount: number,
  mode: ConversationMode,
): ChatResponse {
  const nextEvent = upcomingEvents[0]
  const nextOneTimePost = upcomingOneTimePosts[0]
  const eventNote = nextEvent?.label && nextEvent?.event_date
    ? ` I see you have ${nextEvent.label} coming up on ${nextEvent.event_date}.`
    : nextOneTimePost?.title && nextOneTimePost?.scheduled_for
      ? ` I also see a one-time post, ${nextOneTimePost.title}, scheduled for ${nextOneTimePost.scheduled_for}${nextOneTimePost.pending_count || nextOneTimePost.scheduled_count ? ` with existing drafts already in progress` : ''}.`
      : ''
  if (mode === 'planning') {
    return {
      message: `Hello! I'm samm, your planning collaborator for ${orgName}. We can map the month, define campaigns, clarify what belongs in baseline versus campaign work, and tighten asset needs before anything becomes live.${eventNote}`,
      suggestions: PLANNING_SUGGESTIONS,
    }
  }
  const approvalNote = pendingCount > 0
    ? ` There ${pendingCount === 1 ? 'is' : 'are'} ${pendingCount} item${pendingCount === 1 ? '' : 's'} waiting for approval.`
    : ' There is nothing waiting for approval right now.'

  return {
    message: `Hello! I'm samm, your coordinating intelligence for ${orgName}.${approvalNote}${eventNote}`,
    suggestions: EXECUTION_SUGGESTIONS,
  }
}

function buildWritePostResponse(
  supabase: any,
  orgId: string,
  intent: PipelineDRequestIntent,
  message?: string,
): ChatResponse {
  const postBody: Record<string, unknown> = {
    intent: PLANNING_INTENT.ONE_TIME,
    topic: intent.topic,
  }
  if (intent.post_title) {
    postBody.post_title = intent.post_title
  }
  if (Array.isArray(intent.platforms) && intent.platforms.length > 0) {
    postBody.platforms = intent.platforms
  }
  if (intent.event_ref) {
    postBody.event_ref = String(intent.event_ref)
  }
  if (intent.scheduled_for) {
    postBody.scheduled_for = intent.scheduled_for
  }
  if (intent.asset_need && intent.asset_need !== ASSET_NEED.NONE) {
    postBody.asset_need = intent.asset_need
  }

  const postTask = invokePipeline(supabase, 'pipeline-d-post', orgId, postBody)
    .catch((err: unknown) => {
      console.error('Pipeline D background invocation failed:', err instanceof Error ? err.message : String(err))
    })

  try {
    EdgeRuntime.waitUntil(postTask)
  } catch {
    // EdgeRuntime not available outside Supabase - promise still runs
  }

  const platformNote = Array.isArray(intent.platforms) && intent.platforms.length > 0
    ? ` for ${intent.platforms.join(', ')}`
    : ''
  const scheduleNote = intent.scheduled_for ? ` scheduled for ${intent.scheduled_for}` : ''
  const assetNote = intent.asset_need && intent.asset_need !== ASSET_NEED.NONE
    ? ` with a ${intent.asset_need} asset brief`
    : ''

  return {
    message: message || `Writing a post about "${intent.topic}"${platformNote}${scheduleNote}${assetNote} now - drafts will appear in Content Registry in a few seconds.`,
    suggestions: ['Check Content Registry', 'What needs my approval?', 'Summarize this week'],
    invoked_action: {
      type: 'run_pipeline',
      pipeline: 'pipeline-d-post',
      status: 'running',
      run_id: null,
    },
  }
}

async function buildOneTimePostResponse(
  supabase: any,
  orgId: string,
  intent: PipelineDRequestIntent,
  message?: string,
): Promise<ChatResponse> {
  const postBody: Record<string, unknown> = {
    intent: PLANNING_INTENT.ONE_TIME,
    topic: intent.topic,
  }
  if (intent.post_title) {
    postBody.post_title = intent.post_title
  }
  if (Array.isArray(intent.platforms) && intent.platforms.length > 0) {
    postBody.platforms = intent.platforms
  }
  if (intent.event_ref) {
    postBody.event_ref = String(intent.event_ref)
  }
  if (intent.scheduled_for) {
    postBody.scheduled_for = intent.scheduled_for
  }
  if (intent.asset_need && intent.asset_need !== ASSET_NEED.NONE) {
    postBody.asset_need = intent.asset_need
  }

  const result = await invokePipeline(supabase, 'pipeline-d-post', orgId, postBody)
  const platformNote = Array.isArray(intent.platforms) && intent.platforms.length > 0
    ? ` for ${intent.platforms.join(', ')}`
    : ''
  const scheduleNote = intent.scheduled_for ? ` scheduled for ${intent.scheduled_for}` : ''
  const assetNote = intent.asset_need && intent.asset_need !== ASSET_NEED.NONE
    ? ` with a ${intent.asset_need} asset brief`
    : ''

  const draftsCreated =
    typeof result?.drafts_created === 'number' ? result.drafts_created : null

  return {
    message:
      message ||
      `Created ${draftsCreated ?? 'new'} one-time draft${draftsCreated === 1 ? '' : 's'} about "${intent.topic}"${platformNote}${scheduleNote}${assetNote}.`,
    suggestions: ['Check Content Registry', 'What needs my approval?', 'Summarize this week'],
    invoked_action: {
      type: 'run_pipeline',
      pipeline: 'pipeline-d-post',
      status: 'completed',
      run_id: null,
    },
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase service credentials in function environment')
    }

    if (!anthropicApiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY in function environment')
    }

    const authHeader = req.headers.get('Authorization')
    const accessToken = authHeader?.replace(/^Bearer\s+/i, '')

    if (!accessToken) {
      return jsonResponse({ error: 'Missing bearer token' }, 401)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const anthropic = createAnthropicClient(anthropicApiKey)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return jsonResponse({ error: userError?.message ?? 'Unauthorized' }, 401)
    }

    const body = await req.json().catch(() => ({}))
    const message = String(body?.message ?? '').trim()
    const history = Array.isArray(body?.history) ? (body.history as ChatHistoryItem[]) : []
    const mode: ConversationMode = body?.mode === 'planning' ? 'planning' : 'execution'
    const confirmationAction = body?.confirmationAction ? String(body.confirmationAction) : null
    const explicitAction =
      body?.action && typeof body.action === 'object' && !Array.isArray(body.action)
        ? (body.action as Record<string, unknown>)
        : null
    const orgId = user.app_metadata?.org_id ?? body?.orgId

    if (!orgId || typeof orgId !== 'string') {
      return jsonResponse({ error: 'Missing org context' }, 400)
    }

    if (!message && !explicitAction) {
      return jsonResponse({ error: 'Message is required' }, 400)
    }

    // Fast-path: calendar delete confirmation.
    // When the frontend Confirm button is clicked on a delete card, it sends
    // confirmationAction = 'calendar_delete:{event_id}'. Execute the delete
    // directly without invoking the LLM — no hallucination possible.
    if (confirmationAction?.startsWith('calendar_delete:')) {
      if (mode === 'planning') {
        return jsonResponse(buildPlanningModeMutationBlockedResponse('change the live calendar'))
      }
      const eventId = confirmationAction.replace('calendar_delete:', '').trim()
      if (!eventId) {
        return jsonResponse({ error: 'Invalid delete confirmation: missing event id' }, 400)
      }
      const supabaseEarly = createClient(supabaseUrl, serviceRoleKey)
      const { error: fastDeleteError } = await supabaseEarly
        .from('academic_calendar')
        .delete()
        .eq('id', eventId)
        .eq('org_id', orgId)
      if (fastDeleteError) {
        return jsonResponse({ error: `Failed to delete calendar event: ${fastDeleteError.message}` }, 500)
      }
      return jsonResponse({
        message: 'Done. The event has been removed from the calendar.',
        suggestions: EXECUTION_SUGGESTIONS,
      })
    }

    if (explicitAction?.type === 'create_one_time_post') {
      if (mode === 'planning') {
        return jsonResponse(buildPlanningModeMutationBlockedResponse('create one-time post drafts directly'))
      }

      const topic = String(explicitAction.topic ?? '').trim()
      if (!topic) {
        return jsonResponse({ error: 'The one-time post needs a topic.' }, 400)
      }

      const scheduledForRaw = explicitAction.scheduled_for ? String(explicitAction.scheduled_for).trim() : null
      if (scheduledForRaw && !/^\d{4}-\d{2}-\d{2}$/.test(scheduledForRaw)) {
        return jsonResponse({ error: 'The one-time post date must be in YYYY-MM-DD format.' }, 400)
      }

      const assetNeed = normalizeAssetNeed(explicitAction.asset_need)
      const postTitle = explicitAction.post_title ? String(explicitAction.post_title).trim() : null
        return jsonResponse(
          await buildOneTimePostResponse(
            supabase,
            orgId,
            {
            topic,
            post_title: postTitle,
            platforms: Array.isArray(explicitAction.platforms)
              ? explicitAction.platforms.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
              : null,
            event_ref: explicitAction.event_ref ? String(explicitAction.event_ref) : null,
            scheduled_for: scheduledForRaw,
            asset_need: assetNeed,
          },
          message || topic,
        ),
      )
    }

    const today = new Date().toISOString().slice(0, 10)

    const [orgConfigResult, metricsResult, runsResult, eventsResult, oneTimePostsResult, inboxCountResult, inboxResult] = await Promise.all([
      supabase.from('org_config').select('*').eq('org_id', orgId).single(),
      supabase.from('platform_metrics').select('*').eq('org_id', orgId).order('snapshot_date', { ascending: false }).limit(8),
      supabase.from('pipeline_runs').select('*').eq('org_id', orgId).order('started_at', { ascending: false }).limit(8),
      supabase.from('academic_calendar').select('*').eq('org_id', orgId).gte('event_date', today).order('event_date', { ascending: true }).limit(5),
      supabase
        .from('content_registry')
        .select('id, platform, subject_line, body, status, scheduled_at, metadata')
        .eq('org_id', orgId)
        .eq('created_by', 'pipeline-d-post')
        .eq('is_campaign_post', false)
        .not('scheduled_at', 'is', null)
        .gte('scheduled_at', `${today}T00:00:00`)
        .order('scheduled_at', { ascending: true })
        .limit(40),
      supabase.from('human_inbox').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'pending'),
      supabase.from('human_inbox').select('*').eq('org_id', orgId).eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    ])

    if (orgConfigResult.error) throw new Error(`Failed to load org config: ${orgConfigResult.error.message}`)
    if (metricsResult.error) throw new Error(`Failed to load metrics: ${metricsResult.error.message}`)
    if (runsResult.error) throw new Error(`Failed to load pipeline runs: ${runsResult.error.message}`)
    if (eventsResult.error) throw new Error(`Failed to load calendar events: ${eventsResult.error.message}`)
    if (oneTimePostsResult.error) throw new Error(`Failed to load one-time posts: ${oneTimePostsResult.error.message}`)
    if (inboxCountResult.error) throw new Error(`Failed to load inbox summary: ${inboxCountResult.error.message}`)
    if (inboxResult.error) throw new Error(`Failed to load inbox items: ${inboxResult.error.message}`)

    const activeRuns = await expireStaleRuns(supabase, runsResult.data ?? [])
    const memoryContext = await ensureDashboardMemoryContext(supabase, {
      orgId,
      userId: user.id,
      message,
    })

    const orgConfig = orgConfigResult.data
      const metrics = summarizeMetrics(metricsResult.data ?? [])
      const recentRuns = summarizeRuns(activeRuns)
      const upcomingEvents = summarizeEvents(eventsResult.data ?? [])
      const upcomingOneTimePosts = summarizeOneTimePosts(oneTimePostsResult.data ?? []).slice(0, 5)
      const pendingInbox = summarizeInbox(inboxResult.data ?? [])
      const pendingCount = inboxCountResult.count ?? 0

    const explicitSchedulerResult = await resolveExplicitSchedulerRequest({
      supabase,
      orgId,
      userId: user.id,
      message,
      mode,
      confirmationAction,
      runs: activeRuns,
      memoryContext,
    })

    if (explicitSchedulerResult) {
      return jsonResponse(explicitSchedulerResult)
    }


    const normalizedWritePost = resolveNormalizedWritePostIntent(message)
    if (normalizedWritePost) {
      if (mode === 'planning') {
        return jsonResponse(buildPlanningModeMutationBlockedResponse('create drafts directly'))
      }
      return jsonResponse(buildWritePostResponse(supabase, orgId, normalizedWritePost))
    }

    if (isPipelineDCommand(message)) {
      if (mode === 'planning') {
        return jsonResponse(buildPlanningModeMutationBlockedResponse('run Pipeline D'))
      }
      return jsonResponse(buildPipelineDGuidanceResponse())
    }

    const relevantOneTimePost =
      isContentGenerationRequest(message) && mode === 'planning'
        ? pickRelevantOneTimePost(message, history, upcomingOneTimePosts)
        : null

    if (relevantOneTimePost) {
      return jsonResponse(buildExistingOneTimePostPlanningResponse(relevantOneTimePost))
    }

      if (isGreeting(message)) {
        return jsonResponse(buildGreetingResponse(orgConfig?.org_name ?? 'this workspace', upcomingEvents, upcomingOneTimePosts, pendingCount, mode))
      }
      const prompt = {
        workspace: {
        org_name: orgConfig?.org_name ?? 'this workspace',
        full_name: orgConfig?.full_name ?? '',
        timezone: orgConfig?.timezone ?? '',
          pending_inbox_count: pendingCount,
          pending_inbox: pendingInbox,
          recent_runs: recentRuns,
          upcoming_events: upcomingEvents,
          upcoming_one_time_posts: upcomingOneTimePosts,
          latest_metrics: metrics,
        },
      conversation: [...history.slice(-8), { role: 'user', content: message }],
      instruction: `You are samm, the coordinating intelligence for this workspace. The current conversation mode is ${mode.toUpperCase()}. Decide whether to answer directly or prepare an action. Return JSON only with this shape:
{"message": string, "suggestions": string[], "action": null | ActionObject}

ActionObject is one of:
- {"type":"run_pipeline","pipeline":"pipeline-a-engagement"|"pipeline-b-weekly"|"pipeline-c-campaign"|"coordinator","needs_confirmation": boolean, "title": string, "description": string}
- {"type":"write_post","topic": string, "platforms": string[]|null, "event_ref": string|null, "title": string, "description": string}
- {"type":"create_one_time_post","topic": string, "post_title"?: string|null, "scheduled_for": "YYYY-MM-DD"|null, "platforms": string[]|null, "event_ref": string|null, "asset_need": "none"|"static"|"carousel"|"video"|"design_brief", "title": string, "description": string}
- {"type":"create_calendar_event","label": string, "event_date": "YYYY-MM-DD", "event_type": "launch"|"promotion"|"seasonal"|"community"|"deadline"|"other", "universities": string[], "run_pipeline_c": boolean, "needs_confirmation": boolean, "title": string, "description": string}
- {"type":"edit_calendar_event","event_id": string, "label"?: string, "event_date"?: string, "event_type"?: string, "needs_confirmation": boolean, "title": string, "description": string}
- {"type":"delete_calendar_event","event_id": string, "label": string, "needs_confirmation": boolean, "title": string, "description": string}

Rules:
- Planning mode is draft-only. In planning mode, do not propose any action object that mutates live state or triggers execution. Keep action null and explain the recommendation instead.
- In planning mode, behave like a helpful expert guide:
  - ask clarifying questions when goals, campaigns, or timing are ambiguous
  - explain why you recommend a content mix, campaign shape, or calendar move
  - teach briefly when the user seems unfamiliar with concepts like campaigns, baseline content, or support content
  - do not offer to run pipelines, create drafts, or write posts unless the user explicitly switches to Execution mode
- If the user mentions a pipeline in planning mode, explain what that pipeline is for and when it would be appropriate to use it later; do not suggest triggering it now.
- In planning mode, prefer guidance about month goals, campaign structure, asset readiness, audience fit, and content mix over operational next steps.
- Execution mode can propose actions when the user is clearly asking for a live change.
- Only propose run_pipeline when the user is clearly asking to run or trigger a full pipeline with no event creation involved.
- Use write_post when the user asks to write, draft, or create a single post or message about a topic. This is NOT a campaign — no brief, no CEO gate, no research. Extract the topic from the user message. platforms defaults to null (all platforms). event_ref is optional context. write_post never requires confirmation — it is fast and reversible.
- Use create_one_time_post when the user asks for a standalone non-campaign post that should land on a specific date, appear in the calendar, or include a visual asset brief. Infer the date relative to today ${today} when needed. Set scheduled_for to null if no date is given. Set asset_need to one of none, static, carousel, video, or design_brief. Do not create an academic_calendar event for a one-time post.
  - If the user provides a clear working title or theme, pass it as post_title. Otherwise omit it.
- Use create_calendar_event when the user asks to schedule, add, or create a calendar event.
  - Infer the date from the user message (e.g. "next Friday" relative to today ${today}).
  - Preserve the user's event label as closely as possible. Do not rewrite it into a campus, university, or student-themed event unless the user explicitly asked for that.
  - If the user says "schedule a campaign for [event] on [date] and run the pipeline" — use create_calendar_event with run_pipeline_c: true. Do NOT use run_pipeline for this; the event must be created first.
  - Set run_pipeline_c to true only if the user also asks to draft, create, or run a campaign for that event.
  - universities is the existing storage field for audience tags or segments. Use an empty array if the user does not specify any. Never invent universities, campuses, or institutions.
- Use edit_calendar_event when the user asks to update, change, rename, or reschedule an existing event. Match the event by label or date from the upcoming_events list and use its id. Always set needs_confirmation: false for edits — they are reversible.
- Use delete_calendar_event when the user asks to remove or delete an existing event. Match from upcoming_events and use its id. Always set needs_confirmation: true for deletes — they are permanent.
  - For status questions, summaries, metrics, approvals, and calendar reads, answer directly.
  - Treat upcoming_events as campaign windows or dated academic_calendar events.
  - Treat upcoming_one_time_posts as standalone dated posts that still belong on the calendar, but are not campaign windows.
  - upcoming_one_time_posts also tell you whether drafts already exist. If draft_count, pending_count, scheduled_count, or published_count is greater than 0, do not talk about that post like a blank slate.
  - If the user asks to generate content for an existing one-time post that already has drafts, acknowledge the existing content state first. In planning mode, explain that drafts already exist and offer refinement/review guidance instead of asking generic strategy questions. In execution mode, offer to regenerate, revise, or add another variation rather than pretending nothing exists.
  - When the user refers to "it", "that post", or "this post" right after discussing a specific one-time post, resolve the reference to the most relevant upcoming_one_time_post in context.
  - If the user asks what is on the calendar, mention both upcoming_events and upcoming_one_time_posts when relevant.
  - Keep suggestions short and actionable.`
      }

    const parsed = await generateJsonWithAnthropic<any>(anthropic, {
      task: 'coordinator',
      system: 'You are samm. Be concise, operational, and clear. Return JSON only.',
      messages: [
        {
          role: 'user',
          content: JSON.stringify(prompt),
        },
      ],
      fallback: '{"message":"I reviewed the workspace state.","suggestions":[]}',
    })

    const suggestions = Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0
      ? parsed.suggestions.slice(0, 4)
      : mode === 'planning'
        ? PLANNING_SUGGESTIONS
        : EXECUTION_SUGGESTIONS

    const action = parsed.action && typeof parsed.action === 'object' ? parsed.action : null

    if (action?.type === 'create_calendar_event') {
      if (mode === 'planning') {
        return jsonResponse(buildPlanningModeMutationBlockedResponse('write to the live calendar'))
      }
      if (action.needs_confirmation && !confirmationAction) {
        return jsonResponse({
          message: parsed.message || action.description || `Create "${action.label}" on ${action.event_date}?`,
          suggestions,
          action,
        })
      }

      if (confirmationAction === 'cancel') {
        return jsonResponse({ message: 'Cancelled.', suggestions })
      }

      const calendarPayload = {
        org_id: orgId,
        label: action.label,
        event_date: action.event_date,
        event_type: action.event_type ?? 'other',
        universities: action.universities ?? [],
        triggered: false,
        lead_days: 21,
        pipeline_trigger: 'pipeline_c',
      }

      const { error: calInsertError } = await supabase
        .from('academic_calendar')
        .insert(calendarPayload)

      if (calInsertError) {
        return jsonResponse({ error: `Failed to create calendar event: ${calInsertError.message}` }, 500)
      }

      if (action.run_pipeline_c) {
        const pipelineAction = {
          type: 'run_pipeline',
          pipeline: 'pipeline-c-campaign',
          needs_confirmation: false,
          title: `Campaign for ${action.label}`,
          description: `Triggered by calendar event creation for "${action.label}" on ${action.event_date}.`,
        }
        const calendarContext: CalendarEventContext = {
          label: action.label,
          event_date: action.event_date,
          event_type: action.event_type ?? 'other',
          universities: action.universities ?? [],
        }
        const pipelineResult = await resolveModelPipelineAction({
          supabase,
          orgId,
          userId: user.id,
          runs: activeRuns,
          action: pipelineAction,
          fallbackMessage: `Added "${action.label}" to the calendar and queued a campaign for it.`,
          suggestions,
          eventContext: calendarContext,
          memoryContext,
          message,
        })
        if (pipelineResult) return jsonResponse(pipelineResult)
      }

      return jsonResponse({
        message: `Added "${action.label}" on ${action.event_date} to the calendar.`,
        suggestions,
      })
    }

    if (action?.type === 'edit_calendar_event') {
      if (mode === 'planning') {
        return jsonResponse(buildPlanningModeMutationBlockedResponse('edit the live calendar'))
      }
      if (!action.event_id) {
        return jsonResponse({ message: "I couldn't identify which event to edit. Please specify the event name and date.", suggestions })
      }

      if (action.needs_confirmation && !confirmationAction) {
        return jsonResponse({ message: parsed.message || action.description || `Update "${action.label}"?`, suggestions, action })
      }

      const patch: Record<string, unknown> = {}
      if (action.label) patch.label = action.label
      if (action.event_date) patch.event_date = action.event_date
      if (action.event_type) patch.event_type = action.event_type

      const { error: editError } = await supabase
        .from('academic_calendar')
        .update(patch)
        .eq('id', action.event_id)
        .eq('org_id', orgId)

      if (editError) {
        return jsonResponse({ error: `Failed to update calendar event: ${editError.message}` }, 500)
      }

      return jsonResponse({ message: parsed.message || `Updated the event.`, suggestions })
    }

    if (action?.type === 'delete_calendar_event') {
      if (mode === 'planning') {
        return jsonResponse(buildPlanningModeMutationBlockedResponse('delete from the live calendar'))
      }
      if (!action.event_id) {
        return jsonResponse({ message: "I couldn't identify which event to delete. Please specify the event name and date.", suggestions })
      }

      // Return a confirmation card. The action string 'calendar_delete:{id}' is
      // sent back as confirmationAction when the user clicks Confirm — handled by
      // the fast-path above, which executes the delete without a second LLM call.
      return jsonResponse({
        message: parsed.message || `Delete "${action.label}" on ${action.event_date ?? 'that date'}? This cannot be undone.`,
        suggestions,
        confirmation: {
          title: `Delete "${action.label}"`,
          description: `Permanently removes this event from the calendar. Any pipeline schedules tied to it will no longer fire.`,
          action: `calendar_delete:${action.event_id}`,
        },
      })
    }

    if (action?.type === 'write_post') {
      if (mode === 'planning') {
        return jsonResponse(buildPlanningModeMutationBlockedResponse('create drafts directly'))
      }
      const topic = String(action.topic ?? '').trim()
      if (!topic) {
        return jsonResponse({ message: "I couldn't work out what to write about. Could you be more specific?", suggestions })
      }

        return jsonResponse(
          await buildOneTimePostResponse(
            supabase,
            orgId,
            {
            type: 'write_post',
            topic,
            platforms: Array.isArray(action.platforms) ? action.platforms : null,
            event_ref: action.event_ref ? String(action.event_ref) : null,
          },
          parsed.message,
        ),
      )
    }

    if (action?.type === 'create_one_time_post') {
      if (mode === 'planning') {
        return jsonResponse(buildPlanningModeMutationBlockedResponse('create one-time post drafts directly'))
      }

      const topic = String(action.topic ?? '').trim()
      if (!topic) {
        return jsonResponse({ message: "I couldn't work out what the one-time post should be about. Please be more specific.", suggestions })
      }

      const scheduledForRaw = action.scheduled_for ? String(action.scheduled_for).trim() : null
      if (scheduledForRaw && !/^\d{4}-\d{2}-\d{2}$/.test(scheduledForRaw)) {
        return jsonResponse({ message: 'The one-time post date must be in YYYY-MM-DD format.', suggestions })
      }

      return jsonResponse(
        buildWritePostResponse(
          supabase,
          orgId,
          {
            topic,
            post_title: action.post_title ? String(action.post_title).trim() : null,
            platforms: Array.isArray(action.platforms) ? action.platforms : null,
            event_ref: action.event_ref ? String(action.event_ref) : null,
            scheduled_for: scheduledForRaw,
            asset_need: normalizeAssetNeed(action.asset_need),
          },
          parsed.message,
        ),
      )
    }

    const modelSchedulerResult = await resolveModelPipelineAction({
      supabase,
      orgId,
      userId: user.id,
      runs: activeRuns,
      mode,
      action,
      fallbackMessage: parsed.message || '',
      suggestions,
      memoryContext,
      message,
    })

    if (modelSchedulerResult) {
      return jsonResponse(modelSchedulerResult)
    }

    return jsonResponse({
      message: parsed.message || 'I reviewed the latest workspace state and prepared the next steps.',
      suggestions,
    })
  } catch (error) {
    if (isTransientLlmError(error)) {
      return jsonResponse({ error: TRANSIENT_MODEL_ERROR_MESSAGE }, 503)
    }

    const message = getErrorMessage(error)
    return jsonResponse({ error: message }, 500)
  }
})





