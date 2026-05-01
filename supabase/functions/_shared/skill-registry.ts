export type SkillKey =
  | 'campaign-planning'
  | 'content-calendar'
  | 'copywriting'
  | 'asset-brief'
  | 'brand-governance'
  | 'review-qa'
  | 'universal-config-guide'
  | 'blog-content'
  | 'local-seasonality'

export type SkillDefinition = {
  id: SkillKey
  purpose: string
  use_when: string[]
  required_context: string[]
  pipeline_handoff?: string | null
}

export const SKILL_REGISTRY = {
  'campaign-planning': {
    id: 'campaign-planning',
    purpose: 'Shape campaign goals, schedule, content roles, countdown logic, and approval-ready brief requirements.',
    use_when: ['new campaign planning', 'campaign schedule design', 'campaign brief review', 'campaign date/content role decisions'],
    required_context: ['calendar events', 'campaign defaults', 'offer catalog', 'ICP categories', 'seasonality', 'approval policy'],
    pipeline_handoff: 'pipeline-c-campaign after campaign truth is approved or execution is explicitly requested',
  },
  'content-calendar': {
    id: 'content-calendar',
    purpose: 'Plan monthly or weekly content rhythm using configured channels, open slots, campaign windows, and content balance.',
    use_when: ['monthly planning', 'weekly planning', 'content mix decisions', 'calendar density review'],
    required_context: ['calendar events', 'one-time posts', 'campaign defaults', 'active channels', 'content registry state'],
    pipeline_handoff: 'coordinator calendar writes only after user approval',
  },
  copywriting: {
    id: 'copywriting',
    purpose: 'Prepare platform-ready copy from approved intent and deterministic workspace context.',
    use_when: ['captions', 'messages', 'emails', 'short scripts', 'channel adaptations'],
    required_context: ['brand voice', 'offer catalog', 'ICP categories', 'CTA rules', 'content objective'],
    pipeline_handoff: 'pipeline-c-campaign for campaign copy or pipeline-d-post for one-time/on-demand copy',
  },
  'asset-brief': {
    id: 'asset-brief',
    purpose: 'Prepare external-rendering visual briefs for Canva, Higgsfield, or other design tools.',
    use_when: ['visual brief', 'poster brief', 'carousel brief', 'video storyboard', 'image prompt'],
    required_context: ['visual brand', 'brand voice', 'platform', 'asset need', 'approved message', 'CTA rules'],
    pipeline_handoff: 'pipeline-c-campaign or pipeline-d-post creates the content registry brief',
  },
  'brand-governance': {
    id: 'brand-governance',
    purpose: 'Check voice, claims, CTA fit, approved links, offer accuracy, and visual-brand constraints.',
    use_when: ['brand-sensitive content', 'claims', 'offers', 'visual direction', 'final readiness checks'],
    required_context: ['brand voice', 'visual brand', 'offer catalog', 'approval policy', 'CTA rules'],
    pipeline_handoff: null,
  },
  'review-qa': {
    id: 'review-qa',
    purpose: 'Flag missing details, unsupported claims, duplicate work, schedule mismatch, and publishing readiness issues.',
    use_when: ['final review', 'approval readiness', 'before triggering generation', 'before committing calendar changes'],
    required_context: ['calendar truth', 'content registry state', 'inbox approvals', 'structured config'],
    pipeline_handoff: null,
  },
  'universal-config-guide': {
    id: 'universal-config-guide',
    purpose: 'Help users set up or improve universal config and translate natural language into structured config suggestions.',
    use_when: ['workspace setup', 'offer setup', 'audience setup', 'brand setup', 'seasonality setup', 'channel policy setup'],
    required_context: ['current structured config snapshot', 'missing setup fields'],
    pipeline_handoff: null,
  },
  'blog-content': {
    id: 'blog-content',
    purpose: 'Plan or write long-form articles as a channel lane, not as a visual asset type.',
    use_when: ['blog post', 'article', 'long-form content', 'SEO-style source asset'],
    required_context: ['ICP categories', 'offer catalog', 'brand voice', 'CTA rules', 'topic or campaign objective'],
    pipeline_handoff: 'pipeline-c-campaign for campaign blog content or pipeline-d-post for one-time blog content',
  },
  'local-seasonality': {
    id: 'local-seasonality',
    purpose: 'Reason about local school cycles, holidays, exam pressure, demand cycles, and timing-sensitive campaigns.',
    use_when: ['holiday timing', 'school cycle', 'exam season', 'seasonality', 'local calendar moment'],
    required_context: ['seasonality profiles', 'calendar events', 'campaign defaults'],
    pipeline_handoff: null,
  },
} as const satisfies Record<SkillKey, SkillDefinition>

export function renderSkillDirectory() {
  return Object.values(SKILL_REGISTRY)
    .map((skill) => {
      const handoff = skill.pipeline_handoff ? ` Handoff: ${skill.pipeline_handoff}.` : ''
      return `- Use ${skill.id} when ${skill.use_when.join(', ')}. It needs: ${skill.required_context.join(', ')}.${handoff}`
    })
    .join('\n')
}
