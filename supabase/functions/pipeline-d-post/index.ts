// supabase/functions/pipeline-d-post/index.ts
// ---------------------------------------------------------------------
// Pipeline D - One-Off Post
// Lightweight utility for ad-hoc one-time posts.
// No research, no CEO gate, no monitor, no pipeline_runs row.
// Flow: topic -> canonical copy -> parallel platform adapters
//      -> optional asset brief spec -> Content Registry drafts
// Designed to complete in < 10 seconds.
// ---------------------------------------------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  ASSET_NEED,
  PLANNING_INTENT,
  buildDefaultExternalGeneration,
  getDefaultBriefType,
  normalizeAssetNeed,
  shouldGenerateDesignBrief,
  type AssetNeed,
  type AssetSlideSpec,
  type AssetStoryboardFrame,
  type AssetTarget,
  type CanonicalAssetSpec,
  type DraftAssetRequest,
} from '../_shared/asset-brief-contract.ts'
import { getIntegrationDefinition } from '../_shared/integration-registry.ts'
import { createAnthropicClient, generateJsonWithAnthropic, generateTextWithAnthropic } from '../_shared/llm-client.ts'

const DEFAULT_PLATFORMS = ['facebook', 'whatsapp', 'youtube', 'email']
const PLATFORM_DIMENSIONS: Record<string, string> = {
  facebook: '1080x1080',
  whatsapp: '1080x1920',
  youtube: '1080x1920',
  email: '1200x628',
}

type CanonicalCopy = {
  headline: string
  core_body: string
  exact_cta: string
  key_fact: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
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

function buildSystemPrompt(brandVoice: any): string {
  const hashtagLine = Array.isArray(brandVoice.hashtags) && brandVoice.hashtags.length > 0
    ? `\nApproved hashtags (use only these - do not invent others): ${brandVoice.hashtags.join(' ')}`
    : ''
  const formatLine = brandVoice.post_format_preference
    ? `\nPost format preference: ${brandVoice.post_format_preference}`
    : ''

  return `You are the social media voice for ${brandVoice.full_name ?? brandVoice.name ?? 'this organisation'}.
Target audience: ${brandVoice.target_audience ?? ''}
Tone: ${brandVoice.tone ?? ''}
Always: ${(brandVoice.always_say ?? []).join(', ')}
Never: ${(brandVoice.never_say ?? []).join(', ')}
Preferred CTA: ${brandVoice.cta_preference ?? brandVoice.preferred_cta ?? ''}
Good post example: "${brandVoice.example_good_post ?? brandVoice.good_post_example ?? ''}"
Bad post example: "${brandVoice.example_bad_post ?? brandVoice.bad_post_example ?? ''}"${hashtagLine}${formatLine}`
}

function normalizeScheduledFor(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null

  const parsed = new Date(`${trimmed}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) ? null : trimmed
}

function toScheduledAt(date: string | null): string | null {
  return date ? `${date}T09:00:00.000Z` : null
}

function buildAssetTargets(platforms: string[]): AssetTarget[] {
  return platforms.map((platform) => ({
    platform,
    dimensions: PLATFORM_DIMENSIONS[platform] ?? null,
  }))
}

function buildCarouselSlides(canonical: CanonicalCopy, topic: string): AssetSlideSpec[] {
  return [
    {
      slide_number: 1,
      role: 'hook',
      headline: canonical.headline,
      supporting_copy: topic,
      visual_direction: 'Use the strongest opening visual to establish context immediately.',
    },
    {
      slide_number: 2,
      role: 'detail',
      headline: 'What matters most',
      supporting_copy: canonical.core_body,
      visual_direction: 'Keep the middle slide informative and easy to scan.',
    },
    {
      slide_number: 3,
      role: 'proof',
      headline: 'Key takeaway',
      supporting_copy: canonical.key_fact,
      visual_direction: 'Highlight the single most useful or credible detail.',
    },
    {
      slide_number: 4,
      role: 'cta',
      headline: canonical.exact_cta,
      supporting_copy: 'End with a clear instruction or next step.',
      visual_direction: 'Close with a decisive CTA and clean spacing.',
    },
  ]
}

function buildVideoStoryboard(
  canonical: CanonicalCopy,
  topic: string,
  scheduledFor: string | null,
): AssetStoryboardFrame[] {
  return [
    {
      frame_number: 1,
      timestamp_hint: '0-3s',
      scene_prompt: `Open with a strong scene that immediately communicates ${topic}.`,
      on_screen_text: canonical.headline,
    },
    {
      frame_number: 2,
      timestamp_hint: '3-7s',
      scene_prompt: 'Show the core detail or benefit in motion with simple, readable composition.',
      voiceover_line: canonical.core_body,
      on_screen_text: canonical.key_fact,
    },
    {
      frame_number: 3,
      timestamp_hint: '7-10s',
      scene_prompt: 'Close with the clearest possible call to action and a final branded frame.',
      on_screen_text: `${canonical.exact_cta}${scheduledFor ? ` - ${scheduledFor}` : ''}`,
    },
  ]
}

function buildOneTimeAssetSpec(
  request: DraftAssetRequest,
  canonical: CanonicalCopy,
  brandVoice: any,
): CanonicalAssetSpec {
  const briefType = getDefaultBriefType(request.intent, request.asset_need)
  const slides = request.asset_need === ASSET_NEED.CAROUSEL
    ? buildCarouselSlides(canonical, request.topic)
    : null
  const storyboard = request.asset_need === ASSET_NEED.VIDEO
    ? buildVideoStoryboard(canonical, request.topic, request.scheduled_for ?? null)
    : null
  const neverSay = Array.isArray(brandVoice.never_say)
    ? brandVoice.never_say.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
    : null

  return {
    version: 'v1',
    intent: request.intent,
    asset_need: request.asset_need,
    brief_type: briefType,
    post_title: request.post_title ?? canonical.headline,
    objective: request.topic,
    audience: String(brandVoice.target_audience ?? 'the audience defined in brand voice'),
    message: canonical.core_body,
    cta: canonical.exact_cta,
    scheduled_for: request.scheduled_for ?? null,
    event_ref: request.event_ref ?? null,
    campaign_label: request.campaign_label ?? null,
    targets: buildAssetTargets(request.platforms ?? DEFAULT_PLATFORMS),
    brand_rules: {
      tone: brandVoice.tone ?? null,
      must_include: [canonical.key_fact, canonical.exact_cta].filter(Boolean),
      must_avoid: neverSay,
    },
    notes_for_generation: 'Rendering remains external. Produce the asset in Canva, Higgsfield, or another external tool, then return the finished asset to the content workflow.',
    slides,
    storyboard,
    external_generation: buildDefaultExternalGeneration(request.asset_need),
  }
}

function renderAssetBrief(spec: CanonicalAssetSpec): string {
  const lines = [
    `One-time asset brief (${spec.asset_need})`,
    spec.post_title ? `Title: ${spec.post_title}` : null,
    `Objective: ${spec.objective}`,
    `Audience: ${spec.audience}`,
    `Message: ${spec.message}`,
    spec.cta ? `CTA: ${spec.cta}` : null,
    spec.scheduled_for ? `Scheduled for: ${spec.scheduled_for}` : null,
    spec.event_ref ? `Related event: ${spec.event_ref}` : null,
    `Targets: ${spec.targets.map((target) => `${target.platform}${target.dimensions ? ` (${target.dimensions})` : ''}`).join(', ')}`,
  ]

  if (spec.slides?.length) {
    lines.push('', 'Carousel slide plan:')
    for (const slide of spec.slides) {
      lines.push(`- Slide ${slide.slide_number} [${slide.role}]: ${slide.headline}${slide.supporting_copy ? ` -- ${slide.supporting_copy}` : ''}`)
    }
  }

  if (spec.storyboard?.length) {
    lines.push('', 'Video storyboard:')
    for (const frame of spec.storyboard) {
      lines.push(`- Frame ${frame.frame_number}${frame.timestamp_hint ? ` (${frame.timestamp_hint})` : ''}: ${frame.scene_prompt}`)
    }
  }

  lines.push('', 'This brief is intended for external rendering, not internal generation.')

  return lines.filter((line): line is string => Boolean(line)).join('\n')
}

async function runCanonicalCopy(
  anthropic: ReturnType<typeof createAnthropicClient>,
  topic: string,
  scheduledFor: string | null,
  eventRef: string | null,
  brandVoice: any,
): Promise<CanonicalCopy> {
  return await generateJsonWithAnthropic<CanonicalCopy>(anthropic, {
    task: 'one_off_writer',
    maxTokens: 300,
    system: `${buildSystemPrompt(brandVoice)}

Distil the single most important message for this topic into its purest form.
Respond with JSON only:
{
  "headline": "hook line to use verbatim across all platforms",
  "core_body": "1-2 sentences that explain the point and why it matters",
  "exact_cta": "the exact call-to-action text to use verbatim on every platform",
  "key_fact": "the single most important detail to include everywhere"
}`,
    messages: [{
      role: 'user',
      content: `Topic: ${topic}${scheduledFor ? `\nScheduled for: ${scheduledFor}` : ''}${eventRef ? `\nRelated event: ${eventRef}` : ''}

Write the canonical message now.`,
    }],
  })
}

async function runPlatformAdapters(
  anthropic: ReturnType<typeof createAnthropicClient>,
  topic: string,
  canonical: CanonicalCopy,
  platforms: string[],
  scheduledFor: string | null,
  brandVoice: any,
): Promise<Array<{ platform: string; body: string; subject_line?: string }>> {
  const PLATFORM_INSTRUCTIONS: Record<string, string> = {
    [getIntegrationDefinition('facebook').id]: '2-3 sentences, emoji ok, end with the CTA or primary link if one is available',
    [getIntegrationDefinition('whatsapp').id]: 'under 200 characters, conversational, one clear call to action',
    [getIntegrationDefinition('youtube').id]: 'short community post, ask a question to drive comments',
    [getIntegrationDefinition('email').id]: 'start first line with Subject: then write email body, warm and helpful',
  }

  const requests = platforms
    .filter((platform) => PLATFORM_INSTRUCTIONS[platform])
    .map(async (platform) => {
      try {
        const response = await generateTextWithAnthropic(anthropic, {
          task: 'one_off_writer',
          maxTokens: 200,
          system: `${buildSystemPrompt(brandVoice)}

Write ONLY the post copy - no JSON, no quotes, no preamble.

You MUST include these elements verbatim:
- Opening headline: "${canonical.headline}"
- Call to action: "${canonical.exact_cta}"
- Key fact: "${canonical.key_fact}"

Adapt format, length, and tone for the platform only.`,
          messages: [{
            role: 'user',
            content: `Topic: ${topic}
${scheduledFor ? `Scheduled for: ${scheduledFor}\n` : ''}Core message: ${canonical.core_body}
Platform: ${platform}
Instructions: ${PLATFORM_INSTRUCTIONS[platform]}

Write the copy now.`,
          }],
        })

        const body = response.content[0].type === 'text'
          ? response.content[0].text.trim()
          : ''

        let subject_line: string | undefined
        let postBody = body

        if (platform === 'email' && body.startsWith('Subject:')) {
          const lines = body.split('\n')
          subject_line = lines[0].replace('Subject:', '').trim()
          postBody = lines.slice(1).join('\n').trim()
        }

        return { platform, body: postBody, subject_line }
      } catch (err) {
        console.error(`Pipeline D adapter failed for ${platform}:`, err instanceof Error ? err.message : String(err))
        return null
      }
    })

  const results = await Promise.all(requests)
  return results.filter((result): result is NonNullable<typeof result> => result !== null)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const anthropic = createAnthropicClient(Deno.env.get('ANTHROPIC_API_KEY')!)

    const payload = await req.json().catch(() => ({}))
    const orgId = payload?.org_id ?? payload?.orgId
    const topic: string = String(payload?.topic ?? '').trim()
    const platforms: string[] = Array.isArray(payload?.platforms) && payload.platforms.length > 0
      ? payload.platforms
      : DEFAULT_PLATFORMS
    const eventRef: string | null = payload?.event_ref ? String(payload.event_ref) : null
    const postTitle = payload?.post_title ? String(payload.post_title).trim() : null
    const scheduledForInput = payload?.scheduled_for ?? payload?.scheduledFor ?? null
    const scheduledFor = normalizeScheduledFor(scheduledForInput)
    const providedAssetNeed = payload?.asset_need ?? payload?.assetNeed ?? null
    const assetNeed: AssetNeed = normalizeAssetNeed(providedAssetNeed)

    if (!orgId || typeof orgId !== 'string') {
      return jsonResponse({ ok: false, error: 'orgId is required' }, 400)
    }

    if (!topic) {
      return jsonResponse({ ok: false, error: 'topic is required' }, 400)
    }

    if (scheduledForInput && !scheduledFor) {
      return jsonResponse({ ok: false, error: 'scheduled_for must be a valid YYYY-MM-DD date' }, 400)
    }

    if (providedAssetNeed && assetNeed !== providedAssetNeed) {
      return jsonResponse({ ok: false, error: `asset_need must be one of: ${Object.values(ASSET_NEED).join(', ')}` }, 400)
    }

    const config = await getOrgConfig(supabase, orgId)
    const brandVoice = config?.brand_voice ?? {}
    const request: DraftAssetRequest = {
      intent: PLANNING_INTENT.ONE_TIME,
      topic,
      post_title: postTitle,
      scheduled_for: scheduledFor,
      platforms,
      event_ref: eventRef,
      asset_need: assetNeed,
    }
    const scheduledAt = toScheduledAt(scheduledFor)

    console.log(`Pipeline D: writing one-time post about "${topic}" for platforms: ${platforms.join(', ')}${scheduledFor ? ` on ${scheduledFor}` : ''}${assetNeed !== ASSET_NEED.NONE ? ` with ${assetNeed} asset brief` : ''}`)

    const canonical = await runCanonicalCopy(anthropic, topic, scheduledFor, eventRef, brandVoice)
    console.log(`Canonical headline locked: "${canonical.headline}"`)
    const workingTitle = postTitle || canonical.headline

    const assets = await runPlatformAdapters(anthropic, topic, canonical, platforms, scheduledFor, brandVoice)
    console.log(`${assets.length} platform drafts produced`)

    let inserted = 0
    for (const asset of assets) {
      const { error } = await supabase
        .from('content_registry')
        .insert({
          org_id: orgId,
          platform: asset.platform,
          body: asset.body,
          subject_line: asset.subject_line ?? null,
          status: 'draft',
          scheduled_at: scheduledAt,
          is_campaign_post: false,
          created_by: 'pipeline-d-post',
          metadata: {
            owner_pipeline: 'pipeline-d-post',
            purpose: 'one_time',
            content_type: 'one_time_post',
            title: workingTitle,
            scheduled_for: scheduledFor,
            event_ref: eventRef,
            asset_need: assetNeed,
          },
        })
      if (!error) {
        inserted++
      } else {
        console.error(`Failed to insert draft for ${asset.platform}:`, error.message)
      }
    }

    let briefCreated = false
    if (shouldGenerateDesignBrief(assetNeed)) {
      const assetSpec = buildOneTimeAssetSpec(request, canonical, brandVoice)
      const designBrief = renderAssetBrief(assetSpec)
      const { error: briefInsertError } = await supabase
        .from('content_registry')
        .insert({
          org_id: orgId,
          platform: 'design_brief',
          body: designBrief,
          status: 'draft',
          is_campaign_post: false,
          created_by: 'pipeline-d-post',
          metadata: {
            owner_pipeline: 'pipeline-d-post',
            purpose: 'one_time',
            content_type: 'design_brief',
            title: workingTitle,
            scheduled_for: scheduledFor,
            event_ref: eventRef,
            asset_need: assetNeed,
            brief_type: assetSpec.brief_type,
            asset_spec: assetSpec,
          },
        })

      if (briefInsertError) {
        console.error('Pipeline D design brief insert failed:', briefInsertError.message)
      } else {
        briefCreated = true
      }
    }

    console.log(`Pipeline D complete: ${inserted} drafts in Content Registry`)

    return jsonResponse({
      ok: true,
      drafts_created: inserted,
      brief_created: briefCreated,
      platforms_written: assets.map((asset) => asset.platform),
      scheduled_for: scheduledFor,
      asset_need: assetNeed,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Pipeline D failed:', err)
    return jsonResponse({ ok: false, error: message }, 500)
  }
})
