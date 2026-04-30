import { getAgentDefinition } from '../_shared/agent-registry.ts'
import { getIntegrationDefinition } from '../_shared/integration-registry.ts'
import {
  executePipelineSteps,
  runPipelineExecution,
  type PipelineExecutableStep,
} from '../_shared/pipeline-engine.ts'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  createAnthropicClient,
  generateTextWithAnthropic,
} from '../_shared/llm-client.ts'

interface Comment {
  id: string
  platform: 'facebook' | 'whatsapp' | 'youtube'
  author: string
  text: string
  post_id: string
  timestamp: string
}

type Intent = 'routine' | 'complaint' | 'boost' | 'spam'

interface ClassifiedComment extends Comment {
  intent: Intent
  reasoning: string
}

interface PipelineContext {
  orgId: string
  today: string
  useMockComments: boolean
}

interface PipelineAState {
  comments_processed: number
  reply_drafts_created: number
  escalations: number
  boosts_suggested: number
  spam_ignored: number
  errors: string[]
}

interface PipelineAEngineContext {
  supabase: any
  anthropic: ReturnType<typeof createAnthropicClient>
  context: PipelineContext
  config: any
  brandVoice: any
  comments: Comment[]
}

async function getOrgConfig(supabase: any, orgId: string) {
  const { data, error } = await supabase
    .from('org_config')
    .select('*')
    .eq('org_id', orgId)
    .single()
  if (error) throw new Error(`Failed to load org config: ${error.message}`)
  return data
}

function getMockComments(): Comment[] {
  return [
    {
      id: 'fb_001',
      platform: getIntegrationDefinition('facebook').id,
      author: 'Chanda Mwale',
      text: 'This is so helpful. I finally understand the difference now.',
      post_id: 'post_123',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'fb_002',
      platform: getIntegrationDefinition('facebook').id,
      author: 'Mutale Banda',
      text: 'How do I order this? I cannot find the link.',
      post_id: 'post_123',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'fb_003',
      platform: getIntegrationDefinition('facebook').id,
      author: 'Angry Student',
      text: 'This is a scam! I paid and got nothing. Terrible service!!',
      post_id: 'post_123',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'yt_001',
      platform: getIntegrationDefinition('youtube').id,
      author: 'Lombe Phiri',
      text: 'Please can you make a short video showing how this is harvested?',
      post_id: 'video_456',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'yt_002',
      platform: getIntegrationDefinition('youtube').id,
      author: 'Natasha K',
      text: 'I shared this with my family group. Everyone loved it.',
      post_id: 'video_456',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'wa_001',
      platform: getIntegrationDefinition('whatsapp').id,
      author: 'Brian Mwanza',
      text: 'When will the next batch be ready?',
      post_id: 'channel_789',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'wa_002',
      platform: getIntegrationDefinition('whatsapp').id,
      author: 'Spam Account',
      text: 'Make money online!! Click here bit.ly/scam123 🤑🤑🤑',
      post_id: 'channel_789',
      timestamp: new Date().toISOString(),
    },
  ]
}

function createInitialResults(): PipelineAState {
  return {
    comments_processed: 0,
    reply_drafts_created: 0,
    escalations: 0,
    boosts_suggested: 0,
    spam_ignored: 0,
    errors: [],
  }
}

function hasConnectorCredentials(connection: any) {
  if (!connection || typeof connection !== 'object') return false
  if (connection.connected === true) return true
  return Boolean(connection.access_token || connection.page_id || connection.account_id || connection.channel_id)
}

async function fetchEngagementComments(context: PipelineAEngineContext): Promise<Comment[]> {
  if (context.context.useMockComments) {
    console.log('Using explicit mock engagement comments for Pipeline A test run')
    return getMockComments()
  }

  const connections = context.config?.platform_connections ?? {}
  const connectedPlatforms = ['facebook', 'whatsapp', 'youtube']
    .filter((platform) => hasConnectorCredentials(connections[platform]))

  if (connectedPlatforms.length === 0) {
    console.log('No live engagement connectors configured; Pipeline A has no comments to process')
    return []
  }

  console.log(`Live engagement connectors detected (${connectedPlatforms.join(', ')}), but comment adapters are not wired yet`)
  return []
}

function createPipelineASteps(): PipelineExecutableStep<PipelineAState, PipelineAEngineContext>[] {
  return [
    {
      kind: 'task',
      id: 'fetch-comments',
      run: async ({ context }) => {
        context.comments = await fetchEngagementComments(context)
        console.log(`Fetched ${context.comments.length} comments for engagement review`)
      },
    },
    {
      kind: 'for_each',
      id: 'process-comments',
      getItems: ({ context }) => context.comments,
      runItem: async ({ state, context, item }) => {
        await processComment(item as Comment, state, context)
      },
    },
  ]
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const anthropic = createAnthropicClient(Deno.env.get('ANTHROPIC_API_KEY')!)

  const payload = await req.json().catch(() => ({}))
  const orgId = payload?.orgId ?? payload?.org_id
  const coordinatorTaskId = typeof payload?.coordinator_task_id === 'string'
    ? payload.coordinator_task_id
    : null
  if (!orgId || typeof orgId !== 'string') {
    return new Response(
      JSON.stringify({ ok: false, error: 'orgId is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }
  const context: PipelineContext = {
    orgId,
    today: payload?.today ?? new Date().toISOString().split('T')[0],
    useMockComments: payload?.use_mock_comments === true || payload?.useMockComments === true,
  }

  const config = await getOrgConfig(supabase, context.orgId)
  const brandVoice = config.brand_voice
  const state = createInitialResults()
  const engineContext: PipelineAEngineContext = {
    supabase,
    anthropic,
    context,
    config,
    brandVoice,
    comments: [],
  }

  const execution = await runPipelineExecution({
    supabase,
    orgId: context.orgId,
    pipeline: 'pipeline-a-engagement',
    state,
    coordinatorTaskId,
    execute: async (results) => {
      await executePipelineSteps(createPipelineASteps(), {
        state: results,
        context: engineContext,
      })
    },
  })

  if (!execution.ok) {
    console.error('Pipeline A failed:', execution.error)
    return new Response(
      JSON.stringify({ ok: false, error: execution.error.message, ...execution.state }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({ ok: true, ...execution.state }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})

async function processComment(
  comment: Comment,
  results: PipelineAState,
  engineContext: PipelineAEngineContext,
) {
  results.comments_processed += 1

  try {
    const classified = await classifyComment(engineContext.anthropic, comment, engineContext.brandVoice)
    console.log(`[${comment.platform}] ${comment.author}: ${classified.intent}`)

    if (classified.intent === 'spam') {
      results.spam_ignored += 1
      return
    }

    if (classified.intent === 'routine') {
      const reply = await draftReply(engineContext.anthropic, classified, engineContext.brandVoice)
      const { error: routineError } = await engineContext.supabase.from('human_inbox').insert({
        org_id: engineContext.context.orgId,
        item_type: 'suggestion',
        priority: 'normal',
        payload: {
          type: 'Reply suggestion',
          platform: comment.platform,
          author: comment.author,
          comment_text: comment.text,
          post_id: comment.post_id,
          reasoning: classified.reasoning,
          suggested_response: reply,
          suggestion: reply,
          title: `Reply suggestion for ${comment.author}`,
        },
        created_by_pipeline: 'pipeline-a-engagement',
        created_by_agent: getAgentDefinition('reply_writer').id,
      })
      if (routineError) throw new Error(`Failed to queue routine reply suggestion: ${routineError.message}`)
      results.reply_drafts_created += 1
      console.log(`  -> Reply queued for human review: "${reply.slice(0, 60)}..."`)
    }

    if (classified.intent === 'complaint') {
      const suggestedResponse = await draftReply(engineContext.anthropic, classified, engineContext.brandVoice)
      const { error: inboxError } = await engineContext.supabase.from('human_inbox').insert({
        org_id: engineContext.context.orgId,
        item_type: 'escalation',
        priority: 'urgent',
        payload: {
          platform: comment.platform,
          author: comment.author,
          comment_text: comment.text,
          post_id: comment.post_id,
          reasoning: classified.reasoning,
          suggested_response: suggestedResponse,
          suggestion: suggestedResponse,
          title: `Escalated reply needed for ${comment.author}`,
        },
        created_by_pipeline: 'pipeline-a-engagement',
        created_by_agent: getAgentDefinition('reply_writer').id,
      })
      if (inboxError) throw new Error(`Failed to insert escalation: ${inboxError.message}`)
      results.escalations += 1
      results.reply_drafts_created += 1
      console.log('  -> Escalated to human inbox (complaint)')
    }

    if (classified.intent === 'boost') {
      const reply = await draftReply(engineContext.anthropic, classified, engineContext.brandVoice)
      const { error: boostInboxError } = await engineContext.supabase.from('human_inbox').insert({
        org_id: engineContext.context.orgId,
        item_type: 'suggestion',
        priority: 'normal',
        payload: {
          type: 'Boost opportunity',
          platform: comment.platform,
          author: comment.author,
          comment_text: comment.text,
          reasoning: classified.reasoning,
          suggested_response: reply,
          title: `Boost opportunity from ${comment.author}`,
          preview: 'This comment has high engagement potential - consider pinning it or responding publicly.',
          rationale: classified.reasoning,
          suggestion: 'This comment has high engagement potential — consider pinning or responding publicly',
        },
        created_by_pipeline: 'pipeline-a-engagement',
        created_by_agent: getAgentDefinition('reply_writer').id,
      })
      if (boostInboxError) throw new Error(`Failed to insert boost suggestion: ${boostInboxError.message}`)

      results.boosts_suggested += 1
      results.reply_drafts_created += 1
      console.log('  -> Boost suggestion queued for human review')
    }
  } catch (commentErr) {
    results.errors.push(`${comment.id}: ${(commentErr as Error).message}`)
    console.error(`Error processing comment ${comment.id}:`, commentErr)
  }
}

async function classifyComment(
  anthropic: ReturnType<typeof createAnthropicClient>,
  comment: Comment,
  brandVoice: any,
): Promise<ClassifiedComment> {
  const response = await generateTextWithAnthropic(anthropic, {
    task: 'classifier',
    maxTokens: 128,
    system: `Classify social media comments. Reply with JSON only ??? no markdown, no explanation.

Intent options:
- spam: bot, promo link, fake account, unsolicited ad (any shortened URL = spam)
- complaint: real customer upset about THIS org's service, payment, or product
- boost: testimonial, success story, or brand advocacy worth amplifying
- routine: question, neutral feedback, general engagement

Audience: ${brandVoice.target_audience ?? 'customers and prospects'} | Tone: ${brandVoice.tone ?? 'professional'}

JSON format: {"intent":"spam|complaint|boost|routine","reasoning":"one sentence"}`,
    messages: [
      {
        role: 'user',
        content: `Platform: ${comment.platform}
Author: ${comment.author}
Comment: ${comment.text}`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  // Strip markdown code fences ??? model sometimes wraps JSON in ```json ... ``` despite instructions
  const jsonStr = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  try {
    const parsed = JSON.parse(jsonStr) as { intent: Intent; reasoning: string }
    if (!['spam', 'complaint', 'boost', 'routine'].includes(parsed.intent)) {
      throw new Error(`Unexpected intent value: ${parsed.intent}`)
    }
    return { ...comment, intent: parsed.intent, reasoning: parsed.reasoning }
  } catch {
    console.warn('classifyComment parse failed, defaulting to routine. Raw:', raw)
    return { ...comment, intent: 'routine', reasoning: 'Classification parse error ??? treated as routine.' }
  }
}

async function draftReply(
  anthropic: ReturnType<typeof createAnthropicClient>,
  comment: ClassifiedComment,
  brandVoice: any,
): Promise<string> {
  const intentGuidance: Record<Intent, string> = {
    complaint: 'Acknowledge their frustration with genuine empathy. Invite them to DM for a resolution. Do not be defensive.',
    boost: 'Express sincere appreciation for their advocacy. Reinforce the brand mission. Encourage sharing.',
    routine: `Answer helpfully and warmly. End with the preferred CTA: "${brandVoice.preferred_cta ?? 'Learn more'}".`,
    spam: '',
  }

  const response = await generateTextWithAnthropic(anthropic, {
    task: 'reply_writer',
    maxTokens: 200,
    system: `You are a community manager replying to social media comments on behalf of this organisation.

Brand voice:
- Tone: ${brandVoice.tone ?? 'warm, professional'}
- Audience: ${brandVoice.target_audience ?? 'customers and prospects'}
- Always say: ${(brandVoice.always_say ?? []).join(', ') || 'nothing specific'}
- Never say: ${(brandVoice.never_say ?? []).join(', ') || 'nothing specific'}
${brandVoice.good_post_example ? `
Good example post: "${brandVoice.good_post_example}"` : ''}

Rules:
- The commenter's name is "${comment.author}". If it looks like a real given name (e.g. "Chanda Mwale" ??? address as "Chanda"), use the first name. If the name appears to be a handle or descriptor (e.g. "Angry Student", "User123"), open with "Hi there" or another warm neutral greeting instead.
- Maximum 2 sentences
- No hashtags
- Plain conversational text only`,
    messages: [
      {
        role: 'user',
        content: `Comment intent: ${comment.intent}
Guidance: ${intentGuidance[comment.intent]}

Platform: ${comment.platform}
Comment: "${comment.text}"

Write the reply:`,
      },
    ],
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text.trim() : `Hi there, thanks for reaching out ??? please DM us for more details.`
  return reply
}
