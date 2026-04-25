import type { BrandVisualRules } from './asset-brief-contract.ts'

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function collectPalette(visual: Record<string, unknown>): string[] | null {
  const palette = [
    cleanString(visual.primary_color),
    cleanString(visual.secondary_color),
    cleanString(visual.accent_color),
    cleanString(visual.background_color),
  ].filter((value): value is string => Boolean(value))

  return palette.length > 0 ? palette : null
}

function collectFonts(visual: Record<string, unknown>): string[] | null {
  const fonts = [
    cleanString(visual.font_heading),
    cleanString(visual.font_body),
  ].filter((value): value is string => Boolean(value))

  return fonts.length > 0 ? fonts : null
}

function collectSocialHandles(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== 'object') return null

  const entries = Object.entries(raw as Record<string, unknown>)
    .map(([key, value]) => [key, cleanString(value)] as const)
    .filter((entry): entry is readonly [string, string] => Boolean(entry[1]))

  return entries.length > 0 ? Object.fromEntries(entries) : null
}

export function buildBrandVisualRules(
  config: {
    brand_visual?: Record<string, unknown> | null
    markdown_design_spec?: string | null
    social_handles?: Record<string, unknown> | null
    primary_cta_url?: string | null
  } | null | undefined,
  extras?: {
    tone?: string | null
    must_include?: string[] | null
    must_avoid?: string[] | null
    strict_mode?: boolean | null
  },
): BrandVisualRules | null {
  const visual = (config?.brand_visual ?? {}) as Record<string, unknown>
  const socialHandles = collectSocialHandles(config?.social_handles ?? null)
  const landingUrl = cleanString(config?.primary_cta_url)
    ?? socialHandles?.custom_app_url
    ?? socialHandles?.studyhub_url
    ?? null

  const rules: BrandVisualRules = {
    tone: cleanString(extras?.tone),
    palette: collectPalette(visual),
    colors: {
      primary: cleanString(visual.primary_color),
      secondary: cleanString(visual.secondary_color),
      accent: cleanString(visual.accent_color),
      background: cleanString(visual.background_color),
    },
    fonts: collectFonts(visual),
    font_heading: cleanString(visual.font_heading),
    font_body: cleanString(visual.font_body),
    logo_rules: cleanString(visual.logo_usage_rules),
    logo_file: cleanString(visual.logo_file_note),
    image_style: cleanString(visual.visual_style),
    photography_style: cleanString(visual.photography_style),
    layout_preference: cleanString(visual.layout_preference),
    social_handles: socialHandles,
    landing_url: landingUrl,
    design_spec: cleanString(config?.markdown_design_spec),
    strict_mode: extras?.strict_mode ?? true,
    must_include: extras?.must_include?.filter((value): value is string => typeof value === 'string' && value.trim().length > 0) ?? null,
    must_avoid: extras?.must_avoid?.filter((value): value is string => typeof value === 'string' && value.trim().length > 0) ?? null,
  }

  const hasValue = Object.values(rules).some((value) => {
    if (Array.isArray(value)) return value.length > 0
    if (value && typeof value === 'object') return Object.values(value).some(Boolean)
    return Boolean(value)
  })

  return hasValue ? rules : null
}

export function renderBrandVisualRules(rules: BrandVisualRules | null | undefined): string[] {
  if (!rules) return []

  const lines: string[] = []

  if (rules.colors?.primary || rules.colors?.secondary || rules.colors?.accent || rules.colors?.background) {
    lines.push(
      `Brand colors: primary ${rules.colors?.primary ?? 'omit'}, secondary ${rules.colors?.secondary ?? 'omit'}, accent ${rules.colors?.accent ?? 'omit'}, background ${rules.colors?.background ?? 'omit'}.`,
    )
  }

  if (rules.font_heading || rules.font_body) {
    lines.push(`Fonts: heading ${rules.font_heading ?? 'omit'}, body ${rules.font_body ?? 'omit'}.`)
  } else if (rules.fonts?.length) {
    lines.push(`Fonts: ${rules.fonts.join(', ')}.`)
  }

  if (rules.logo_rules) {
    lines.push(`Logo usage: ${rules.logo_rules}`)
  }

  if (rules.logo_file) {
    lines.push(`Logo source note: ${rules.logo_file}`)
  }

  if (rules.image_style) {
    lines.push(`Visual style: ${rules.image_style}`)
  }

  if (rules.photography_style) {
    lines.push(`Photography style: ${rules.photography_style}`)
  }

  if (rules.layout_preference) {
    lines.push(`Layout preference: ${rules.layout_preference}`)
  }

  if (rules.social_handles && Object.keys(rules.social_handles).length > 0) {
    const socialSummary = Object.entries(rules.social_handles)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
    lines.push(`Approved handles and destinations: ${socialSummary}.`)
  }

  if (rules.landing_url) {
    lines.push(`Approved landing URL / footer destination: ${rules.landing_url}`)
  }

  if (rules.must_include?.length) {
    lines.push(`Must include exactly: ${rules.must_include.join(' | ')}`)
  }

  if (rules.must_avoid?.length) {
    lines.push(`Never include: ${rules.must_avoid.join(' | ')}`)
  }

  lines.push(
    `Do not invent substitute colors, fonts, logos, social handles, QR links, domains, or placeholder footer text such as "reallygreatsite.com" or "example.com". If a value is missing, omit it rather than guessing.`,
  )

  if (rules.strict_mode !== false) {
    lines.push('Treat the visual brand rules above as strict. Do not creatively drift away from them.')
  }

  if (rules.design_spec) {
    lines.push(`Additional brand spec: ${rules.design_spec}`)
  }

  return lines
}
