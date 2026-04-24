export const PLANNING_INTENT = {
  CAMPAIGN: 'campaign',
  ONE_TIME: 'one_time',
  RECURRING: 'recurring',
} as const

export type PlanningIntent = typeof PLANNING_INTENT[keyof typeof PLANNING_INTENT]

export const ASSET_NEED = {
  NONE: 'none',
  STATIC: 'static',
  CAROUSEL: 'carousel',
  VIDEO: 'video',
  DESIGN_BRIEF: 'design_brief',
} as const

export type AssetNeed = typeof ASSET_NEED[keyof typeof ASSET_NEED]

export const ASSET_BRIEF_TYPE = {
  CAMPAIGN_STATIC: 'campaign_static',
  ONE_TIME_STATIC: 'one_time_static',
  CAROUSEL: 'carousel',
  VIDEO_STORYBOARD: 'video_storyboard',
} as const

export type AssetBriefType = typeof ASSET_BRIEF_TYPE[keyof typeof ASSET_BRIEF_TYPE]

export const EXTERNAL_ASSET_PRODUCER = {
  MANUAL: 'manual',
  CANVA: 'canva',
  HIGGSFIELD: 'higgsfield',
  OTHER: 'other',
} as const

export type ExternalAssetProducer =
  typeof EXTERNAL_ASSET_PRODUCER[keyof typeof EXTERNAL_ASSET_PRODUCER]

export const EXTERNAL_ADAPTER = {
  NONE: 'none',
  COPY_PASTE: 'copy_paste',
  CANVA_PAYLOAD: 'canva_payload',
  HIGGSFIELD_PAYLOAD: 'higgsfield_payload',
} as const

export type ExternalAdapter = typeof EXTERNAL_ADAPTER[keyof typeof EXTERNAL_ADAPTER]

export const EXTERNAL_ASSET_STATUS = {
  NOT_REQUESTED: 'not_requested',
  BRIEF_READY: 'brief_ready',
  SUBMITTED: 'submitted',
  RENDERED: 'rendered',
  APPROVED: 'approved',
} as const

export type ExternalAssetStatus =
  typeof EXTERNAL_ASSET_STATUS[keyof typeof EXTERNAL_ASSET_STATUS]

export type SlideRole = 'cover' | 'hook' | 'detail' | 'proof' | 'cta' | 'outro'

export interface AssetTarget {
  platform: string
  placement?: string | null
  dimensions?: string | null
}

export interface BrandVisualRules {
  tone?: string | null
  palette?: string[] | null
  fonts?: string[] | null
  logo_rules?: string | null
  image_style?: string | null
  must_include?: string[] | null
  must_avoid?: string[] | null
}

export interface AssetSlideSpec {
  slide_number: number
  role: SlideRole
  headline: string
  supporting_copy?: string | null
  visual_direction?: string | null
}

export interface AssetStoryboardFrame {
  frame_number: number
  timestamp_hint?: string | null
  scene_prompt: string
  voiceover_line?: string | null
  on_screen_text?: string | null
}

export interface ExternalGenerationState {
  producer: ExternalAssetProducer
  adapter: ExternalAdapter
  status: ExternalAssetStatus
  source_job_id?: string | null
  source_url?: string | null
}

export interface CanonicalAssetSpec {
  version: 'v1'
  intent: PlanningIntent
  asset_need: AssetNeed
  brief_type: AssetBriefType | null
  objective: string
  audience: string
  message: string
  cta?: string | null
  scheduled_for?: string | null
  event_ref?: string | null
  campaign_label?: string | null
  targets: AssetTarget[]
  brand_rules?: BrandVisualRules | null
  notes_for_generation?: string | null
  slides?: AssetSlideSpec[] | null
  storyboard?: AssetStoryboardFrame[] | null
  external_generation: ExternalGenerationState
}

export interface DraftAssetRequest {
  intent: PlanningIntent
  topic: string
  scheduled_for?: string | null
  platforms?: string[] | null
  event_ref?: string | null
  campaign_label?: string | null
  asset_need: AssetNeed
}

function normalizeEnumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof value !== 'string') return fallback
  return allowed.includes(value as T) ? (value as T) : fallback
}

export function normalizePlanningIntent(value: unknown): PlanningIntent {
  return normalizeEnumValue(
    value,
    Object.values(PLANNING_INTENT),
    PLANNING_INTENT.ONE_TIME,
  )
}

export function normalizeAssetNeed(value: unknown): AssetNeed {
  return normalizeEnumValue(value, Object.values(ASSET_NEED), ASSET_NEED.NONE)
}

export function shouldGenerateDesignBrief(assetNeed: AssetNeed): boolean {
  return assetNeed !== ASSET_NEED.NONE
}

export function getDefaultBriefType(
  intent: PlanningIntent,
  assetNeed: AssetNeed,
): AssetBriefType | null {
  if (!shouldGenerateDesignBrief(assetNeed)) return null

  if (assetNeed === ASSET_NEED.CAROUSEL) {
    return ASSET_BRIEF_TYPE.CAROUSEL
  }

  if (assetNeed === ASSET_NEED.VIDEO) {
    return ASSET_BRIEF_TYPE.VIDEO_STORYBOARD
  }

  return intent === PLANNING_INTENT.CAMPAIGN
    ? ASSET_BRIEF_TYPE.CAMPAIGN_STATIC
    : ASSET_BRIEF_TYPE.ONE_TIME_STATIC
}

export function buildExternalGenerationState(
  producer: ExternalAssetProducer = EXTERNAL_ASSET_PRODUCER.MANUAL,
  adapter: ExternalAdapter = EXTERNAL_ADAPTER.COPY_PASTE,
): ExternalGenerationState {
  return {
    producer,
    adapter,
    status: EXTERNAL_ASSET_STATUS.NOT_REQUESTED,
    source_job_id: null,
    source_url: null,
  }
}

export function getDefaultExternalProducer(assetNeed: AssetNeed): ExternalAssetProducer {
  if (assetNeed === ASSET_NEED.VIDEO) {
    return EXTERNAL_ASSET_PRODUCER.HIGGSFIELD
  }

  if (assetNeed === ASSET_NEED.STATIC || assetNeed === ASSET_NEED.CAROUSEL || assetNeed === ASSET_NEED.DESIGN_BRIEF) {
    return EXTERNAL_ASSET_PRODUCER.CANVA
  }

  return EXTERNAL_ASSET_PRODUCER.MANUAL
}

export function buildDefaultExternalGeneration(assetNeed: AssetNeed): ExternalGenerationState {
  return buildExternalGenerationState(
    getDefaultExternalProducer(assetNeed),
    EXTERNAL_ADAPTER.COPY_PASTE,
  )
}
