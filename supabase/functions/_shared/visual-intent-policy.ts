export type VisualConversionAllowance = 'none' | 'subtle' | 'strong'
export type VisualCtaAllowance = 'none' | 'soft' | 'hard'
export type VisualFooterAllowance = 'brand_only' | 'handle_or_site' | 'conversion_destination'
export type VisualBriefVerbosity = 'minimal' | 'standard' | 'full'
export type CarouselEnding = 'recap' | 'save_share' | 'conversion'

export type VisualIntentPolicy = {
  conversion_allowance: VisualConversionAllowance
  cta_allowance: VisualCtaAllowance
  footer_allowance: VisualFooterAllowance
  qr_allowed: boolean
  brief_verbosity: VisualBriefVerbosity
  carousel_ending: CarouselEnding
  guidance: string
}

type VisualIntentInput = {
  contentType?: string | null
  role?: string | null
  visualNeed?: string | null
  assetNeed?: string | null
  intent?: string | null
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term))
}

export function resolveVisualIntentPolicy(input: VisualIntentInput = {}): VisualIntentPolicy {
  const contentType = String(input.contentType ?? '').toLowerCase()
  const role = String(input.role ?? '').toLowerCase()
  const visualNeed = String(input.visualNeed ?? input.assetNeed ?? '').toLowerCase()
  const intent = String(input.intent ?? '').toLowerCase()
  const joined = [contentType, role, visualNeed, intent].join(' ')

  const isCarousel = visualNeed.includes('carousel')
  const isConversion = includesAny(joined, ['conversion', 'offer', 'promo', 'last call', 'deadline', 'registration', 'signup', 'sign up'])
  const isReminder = includesAny(joined, ['countdown', 'reminder', 'announcement', 'launch'])
  const isTrust = includesAny(joined, ['proof', 'trust', 'testimonial', 'case study'])
  const isValue = isCarousel || includesAny(joined, ['value', 'education', 'educational', 'tip', 'teach', 'motivation', 'awareness'])

  if (isConversion) {
    return {
      conversion_allowance: 'strong',
      cta_allowance: 'hard',
      footer_allowance: 'conversion_destination',
      qr_allowed: true,
      brief_verbosity: 'full',
      carousel_ending: 'conversion',
      guidance: 'This is a conversion visual. A clear CTA, offer/deadline, approved destination, or QR code may be included when available and useful. Keep it readable and do not crowd the layout.',
    }
  }

  if (isReminder) {
    return {
      conversion_allowance: 'subtle',
      cta_allowance: 'soft',
      footer_allowance: 'handle_or_site',
      qr_allowed: false,
      brief_verbosity: 'standard',
      carousel_ending: isCarousel ? 'save_share' : 'recap',
      guidance: 'This is a reminder or announcement visual. It may include a short date, deadline, or soft next step, but avoid QR codes, pricing, signup blocks, and heavy conversion copy.',
    }
  }

  if (isTrust) {
    return {
      conversion_allowance: 'subtle',
      cta_allowance: 'soft',
      footer_allowance: 'brand_only',
      qr_allowed: false,
      brief_verbosity: 'standard',
      carousel_ending: 'recap',
      guidance: 'This is a trust-building visual. Keep proof or reassurance central. Use only small brand presence; avoid sales-heavy CTAs, QR codes, pricing, and landing-page blocks.',
    }
  }

  if (isValue) {
    return {
      conversion_allowance: 'none',
      cta_allowance: 'none',
      footer_allowance: 'brand_only',
      qr_allowed: false,
      brief_verbosity: 'minimal',
      carousel_ending: isCarousel ? 'save_share' : 'recap',
      guidance: 'This is a value/education visual. Teach one useful idea. Use deterministic branding, but do not include CTA, QR code, signup/subscription instruction, pricing, promo code, or landing URL. A small logo, handle, or unobtrusive site footer is acceptable only if it does not crowd the teaching content.',
    }
  }

  return {
    conversion_allowance: 'none',
    cta_allowance: 'none',
    footer_allowance: 'brand_only',
    qr_allowed: false,
    brief_verbosity: 'minimal',
    carousel_ending: 'recap',
    guidance: 'Default to a clean awareness visual. Keep the graphic focused on one message with deterministic branding. Do not include conversion content unless the content type explicitly calls for it.',
  }
}

export function renderVisualIntentPolicy(policy: VisualIntentPolicy): string {
  return [
    `Visual intent policy: conversion ${policy.conversion_allowance}, CTA ${policy.cta_allowance}, footer ${policy.footer_allowance}, QR ${policy.qr_allowed ? 'allowed' : 'not allowed'}, brief detail ${policy.brief_verbosity}, carousel ending ${policy.carousel_ending}.`,
    policy.guidance,
  ].join('\n')
}
