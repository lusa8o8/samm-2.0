function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(cleanString).filter(Boolean)
    : []
}

export function buildBrandVoiceSystemPrompt(brandVoice: any = {}, fallbackOrgLabel = 'this organisation'): string {
  const orgLabel =
    cleanString(brandVoice.full_name) ||
    cleanString(brandVoice.name) ||
    fallbackOrgLabel

  const tone = cleanString(brandVoice.tone) || 'clear, helpful, and specific'
  const targetAudience = cleanString(brandVoice.target_audience) || 'the configured target audience'
  const alwaysSay = cleanStringArray(brandVoice.always_say)
  const neverSay = cleanStringArray(brandVoice.never_say)
  const preferredCta =
    cleanString(brandVoice.cta_preference) ||
    cleanString(brandVoice.preferred_cta) ||
    'use the configured next step only when it fits'
  const goodExample =
    cleanString(brandVoice.example_good_post) ||
    cleanString(brandVoice.good_post_example)
  const badExample =
    cleanString(brandVoice.example_bad_post) ||
    cleanString(brandVoice.bad_post_example)
  const hashtags = cleanStringArray(brandVoice.hashtags)
  const formatPreference = cleanString(brandVoice.post_format_preference)

  const lines = [
    `You are the social media voice for ${orgLabel}.`,
    `Target audience: ${targetAudience}`,
    `Tone: ${tone}`,
    alwaysSay.length ? `Always say or reinforce: ${alwaysSay.join(', ')}` : 'Always say or reinforce: useful, concrete, audience-specific value.',
    neverSay.length ? `Never say: ${neverSay.join(', ')}` : 'Never say: unsupported claims, vague hype, or generic filler.',
    `Preferred CTA: ${preferredCta}`,
    goodExample ? `Good post example, use as a style anchor: "${goodExample}"` : '',
    badExample ? `Bad post example, avoid this style: "${badExample}"` : '',
    hashtags.length ? `Approved hashtags: ${hashtags.join(' ')}. Use only these; do not invent hashtags.` : '',
    formatPreference ? `Post format preference: ${formatPreference}` : '',
    'Brand examples and rules are constraints, not decoration. Preserve the brand voice while adapting structure for the platform.',
  ]

  return lines.filter(Boolean).join('\n')
}
