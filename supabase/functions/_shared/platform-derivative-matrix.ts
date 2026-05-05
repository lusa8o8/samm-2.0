export type PlatformContentShape =
  | 'short_post'
  | 'caption'
  | 'message'
  | 'community_post'
  | 'email'
  | 'article'
  | 'short_video_script'
  | 'pin'

export type PlatformMediaRequirement = 'none' | 'optional' | 'recommended' | 'required'

export type PlatformDerivativeRule = {
  id: string
  label: string
  supported: boolean
  content_shape: PlatformContentShape
  base_instruction: string
  length_rule: string
  structure_rule: string
  cta_rule: string
  hashtag_rule: string
  media_requirement: PlatformMediaRequirement
  placement?: string | null
  dimensions?: string | null
  brand_voice_rule: string
  unsupported_reason?: string | null
}

export const PLATFORM_DERIVATIVE_MATRIX = {
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    supported: true,
    content_shape: 'short_post',
    base_instruction: 'short social caption, not an email or article; 2-3 sentences max, emoji ok, clear hook',
    length_rule: 'Keep the post concise: 2-3 short sentences max.',
    structure_rule: 'Use a direct hook, one useful point or proof cue, then the next action. Do not reuse email paragraph structure.',
    cta_rule: 'CTA can appear at the end when a next action is available, but keep it short.',
    hashtag_rule: 'Use no more than 2 approved hashtags only when they add context.',
    media_requirement: 'recommended',
    placement: 'feed',
    dimensions: '1080x1080',
    brand_voice_rule: 'Keep the brand voice conversational and specific; avoid generic hype.',
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    supported: true,
    content_shape: 'caption',
    base_instruction: 'caption-first, visual-friendly, strong opening line, concise body, approved hashtags only',
    length_rule: 'Lead with a strong first line, then keep the caption tight and skimmable.',
    structure_rule: 'Write for a visual-first feed: hook, practical payoff, then context that supports the image.',
    cta_rule: 'CTA belongs in the caption, not on the visual asset.',
    hashtag_rule: 'Use approved hashtags only; keep them focused and avoid tag stuffing.',
    media_requirement: 'required',
    placement: 'feed',
    dimensions: '1080x1350',
    brand_voice_rule: 'Preserve brand phrasing while making the caption feel native to a visual feed.',
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    supported: true,
    content_shape: 'short_post',
    base_instruction: 'professional and insight-led, 1-2 short paragraphs, no hype, end with a clear next step',
    length_rule: 'Use 1-2 short paragraphs; avoid long essay formatting unless explicitly requested.',
    structure_rule: 'Lead with the insight, explain the practical implication, then close with a clear next step.',
    cta_rule: 'CTA should be professional and low-friction.',
    hashtag_rule: 'Use 0-2 relevant hashtags; do not use consumer-style hashtag blocks.',
    media_requirement: 'optional',
    placement: 'feed',
    dimensions: '1200x627',
    brand_voice_rule: 'Keep authority and clarity; avoid hype, vague thought leadership, or generic AI tone.',
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp',
    supported: true,
    content_shape: 'message',
    base_instruction: 'one short WhatsApp message under 200 characters; no greeting, no subject line, no paragraphs',
    length_rule: 'Hard target: under 200 characters. If the canonical message is longer, compress it to one takeaway.',
    structure_rule: 'Write like a message someone can forward without editing. One or two short lines only. Do not reuse email copy.',
    cta_rule: 'Use one clear action only.',
    hashtag_rule: 'Do not use hashtags.',
    media_requirement: 'optional',
    placement: 'status_or_message',
    dimensions: '1080x1920',
    brand_voice_rule: 'Keep it human, direct, and low-friction.',
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    supported: true,
    content_shape: 'community_post',
    base_instruction: 'short YouTube community post, not a video script and not an email; invite comments',
    length_rule: 'Keep it to 2-4 short sentences.',
    structure_rule: 'Open with the point, add one helpful context line, then ask a simple question that invites comments. Do not reuse email paragraph structure.',
    cta_rule: 'CTA should invite discussion or direct viewers to the relevant destination.',
    hashtag_rule: 'Avoid hashtag blocks; use at most one highly relevant tag if needed.',
    media_requirement: 'recommended',
    placement: 'community',
    dimensions: '1080x1920',
    brand_voice_rule: 'Keep it helpful and discussion-oriented, not promotional.',
  },
  email: {
    id: 'email',
    label: 'Email',
    supported: true,
    content_shape: 'email',
    base_instruction: 'start first line with Subject: then write a concise email body; no long article',
    length_rule: 'Use a short subject and a body of 80-140 words for one-time posts unless asked for a newsletter.',
    structure_rule: 'First line must be Subject:, followed by a warm body with one main point and short paragraphs.',
    cta_rule: 'CTA should be clear and appear once near the end.',
    hashtag_rule: 'Do not use hashtags.',
    media_requirement: 'none',
    placement: 'newsletter',
    dimensions: '1200x628',
    brand_voice_rule: 'Keep it warm, useful, and specific to the audience.',
  },
  blog: {
    id: 'blog',
    label: 'Blog',
    supported: true,
    content_shape: 'article',
    base_instruction: '500-700 word article with a clear title, short intro, 2-4 useful sections, concise conclusion, and CTA; avoid hype and do not invent facts',
    length_rule: 'Target 500-700 words unless a shorter article is explicitly requested.',
    structure_rule: 'Use a clear title, short intro, practical sections, concise conclusion, and CTA.',
    cta_rule: 'CTA should sit near the conclusion and must not overpower the educational value.',
    hashtag_rule: 'Do not use hashtags.',
    media_requirement: 'optional',
    placement: 'article',
    dimensions: '1200x630',
    brand_voice_rule: 'Keep it useful, grounded, and fact-safe; do not invent claims.',
  },
  x: {
    id: 'x',
    label: 'X',
    supported: false,
    content_shape: 'short_post',
    base_instruction: 'short public post optimized for a fast-moving feed',
    length_rule: 'Keep it short and sharp.',
    structure_rule: 'Use one idea only.',
    cta_rule: 'CTA must be minimal.',
    hashtag_rule: 'Use no more than one hashtag.',
    media_requirement: 'optional',
    placement: 'feed',
    dimensions: '1600x900',
    brand_voice_rule: 'Keep it direct and specific.',
    unsupported_reason: 'X is not yet wired as a first-class publishing or adapter channel.',
  },
  twitter: {
    id: 'twitter',
    label: 'X',
    supported: false,
    content_shape: 'short_post',
    base_instruction: 'short public post optimized for a fast-moving feed',
    length_rule: 'Keep it short and sharp.',
    structure_rule: 'Use one idea only.',
    cta_rule: 'CTA must be minimal.',
    hashtag_rule: 'Use no more than one hashtag.',
    media_requirement: 'optional',
    placement: 'feed',
    dimensions: '1600x900',
    brand_voice_rule: 'Keep it direct and specific.',
    unsupported_reason: 'X is not yet wired as a first-class publishing or adapter channel.',
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    supported: false,
    content_shape: 'short_video_script',
    base_instruction: 'short-video script with a fast hook, simple beat sequence, and caption support',
    length_rule: 'Write for a 15-45 second video.',
    structure_rule: 'Hook, 2-3 beats, payoff, and caption.',
    cta_rule: 'CTA should be spoken or captioned lightly, not sales-heavy.',
    hashtag_rule: 'Use a small set of relevant approved hashtags.',
    media_requirement: 'required',
    placement: 'short_video',
    dimensions: '1080x1920',
    brand_voice_rule: 'Keep it natural and creator-native without losing the brand point of view.',
    unsupported_reason: 'TikTok is not yet wired as a first-class publishing or adapter channel.',
  },
  pinterest: {
    id: 'pinterest',
    label: 'Pinterest',
    supported: false,
    content_shape: 'pin',
    base_instruction: 'search-friendly pin title and description connected to a useful visual',
    length_rule: 'Use a concise title and a helpful description.',
    structure_rule: 'Title should be searchable; description should explain the saved value.',
    cta_rule: 'CTA should be destination-oriented and not urgent.',
    hashtag_rule: 'Avoid hashtag blocks.',
    media_requirement: 'required',
    placement: 'pin',
    dimensions: '1000x1500',
    brand_voice_rule: 'Keep it useful, evergreen, and concrete.',
    unsupported_reason: 'Pinterest is not yet wired as a first-class publishing or adapter channel.',
  },
} as const satisfies Record<string, PlatformDerivativeRule>

export type PlatformDerivativeId = keyof typeof PLATFORM_DERIVATIVE_MATRIX

export function getPlatformDerivativeRule(platform: string): PlatformDerivativeRule | null {
  const key = platform.trim().toLowerCase()
  return (PLATFORM_DERIVATIVE_MATRIX as Record<string, PlatformDerivativeRule>)[key] ?? null
}

export function getSupportedPlatformDerivativeRule(platform: string): PlatformDerivativeRule | null {
  const rule = getPlatformDerivativeRule(platform)
  return rule?.supported ? rule : null
}

export function buildPlatformDerivativeInstruction(platform: string): string | null {
  const rule = getSupportedPlatformDerivativeRule(platform)
  if (!rule) return null

  return [
    rule.base_instruction,
    `Content shape: ${rule.content_shape}.`,
    `Length: ${rule.length_rule}`,
    `Structure: ${rule.structure_rule}`,
    `CTA: ${rule.cta_rule}`,
    `Hashtags: ${rule.hashtag_rule}`,
    `Media: ${rule.media_requirement}${rule.placement ? `, ${rule.placement}` : ''}${rule.dimensions ? `, ${rule.dimensions}` : ''}.`,
    `Brand voice: ${rule.brand_voice_rule}`,
  ].join(' ')
}

export function getPlatformAssetDimensions(platform: string): string | null {
  return getPlatformDerivativeRule(platform)?.dimensions ?? null
}
