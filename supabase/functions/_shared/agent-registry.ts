export type AgentDefinition = {
  id: string
  purpose: string
  allowed_tools: string[]
  required_inputs: string[]
  produced_outputs: string[]
  supports_human_gate_handoff: boolean
  enabled_by_capability?: string | null
}

export const AGENT_REGISTRY = {
  classifier: {
    id: 'classifier',
    purpose: 'Classifies inbound engagement into routine, complaint, boost, or spam.',
    allowed_tools: ['classify_intent', 'write_state'],
    required_inputs: ['comment', 'brand_voice'],
    produced_outputs: ['intent', 'reasoning', 'escalation_payload'],
    supports_human_gate_handoff: false,
    enabled_by_capability: 'engagement_enabled',
  },
  reply_writer: {
    id: 'reply-writer',
    purpose: 'Drafts bounded platform replies from classified engagement context.',
    allowed_tools: ['write_reply'],
    required_inputs: ['classified_comment', 'brand_voice'],
    produced_outputs: ['reply_text'],
    supports_human_gate_handoff: false,
    enabled_by_capability: 'engagement_enabled',
  },
  poll_poster: {
    id: 'poll-poster',
    purpose: 'Generates and posts the daily engagement poll.',
    allowed_tools: ['post_poll', 'write_state'],
    required_inputs: ['brand_voice', 'org_context'],
    produced_outputs: ['poll_posts'],
    supports_human_gate_handoff: false,
    enabled_by_capability: 'engagement_enabled',
  },
  ambassador_checker: {
    id: 'ambassador-checker',
    purpose: 'Checks ambassador responsiveness and flags overdue check-ins.',
    allowed_tools: ['read_state', 'write_state'],
    required_inputs: ['ambassador_registry', 'kpi_targets'],
    produced_outputs: ['ambassador_flags'],
    supports_human_gate_handoff: true,
    enabled_by_capability: 'ambassadors_enabled',
  },
  plan_agent: {
    id: 'plan-agent',
    purpose: 'Builds the weekly publishing plan from metrics, calendar, and content.',
    allowed_tools: ['draft_plan'],
    required_inputs: ['platform_metrics', 'campaign_calendar', 'content_feed', 'posting_limits', 'structured_config'],
    produced_outputs: ['weekly_plan'],
    supports_human_gate_handoff: false,
    enabled_by_capability: 'publishing_enabled',
  },
  copy_writer: {
    id: 'copy-writer',
    purpose: 'Drafts content assets and campaign copy for review or publication.',
    allowed_tools: ['write_captions', 'write_email', 'write_whatsapp'],
    required_inputs: ['plan_item_or_brief', 'brand_voice'],
    produced_outputs: ['draft_assets'],
    supports_human_gate_handoff: true,
    enabled_by_capability: 'publishing_enabled',
  },
  ambassador_updater: {
    id: 'ambassador-updater',
    purpose: 'Prepares ambassador-facing weekly updates and tracks distribution.',
    allowed_tools: ['send_whatsapp_message', 'write_state'],
    required_inputs: ['ambassador_registry', 'content_registry', 'brand_voice'],
    produced_outputs: ['ambassador_updates'],
    supports_human_gate_handoff: false,
    enabled_by_capability: 'ambassadors_enabled',
  },
  reporter: {
    id: 'reporter',
    purpose: 'Compiles operational and weekly reporting outputs for inbox review.',
    allowed_tools: ['compile_report', 'write_state'],
    required_inputs: ['platform_metrics', 'pipeline_results'],
    produced_outputs: ['report'],
    supports_human_gate_handoff: false,
    enabled_by_capability: null,
  },
  performance_analyser: {
    id: 'performance-analyser',
    purpose: 'Summarizes campaign performance context for planning decisions.',
    allowed_tools: ['analyse_metrics'],
    required_inputs: ['platform_metrics', 'content_registry'],
    produced_outputs: ['performance_summary'],
    supports_human_gate_handoff: false,
    enabled_by_capability: 'campaigns_enabled',
  },
  competitor_researcher: {
    id: 'competitor-researcher',
    purpose: 'Produces research insight for competitive campaign positioning.',
    allowed_tools: ['research_competitors'],
    required_inputs: ['calendar_event'],
    produced_outputs: ['competitor_insights'],
    supports_human_gate_handoff: false,
    enabled_by_capability: 'campaigns_enabled',
  },
  ambassador_reporter: {
    id: 'ambassador-reporter',
    purpose: 'Summarizes ambassador coverage and readiness for campaigns.',
    allowed_tools: ['read_state'],
    required_inputs: ['ambassador_registry'],
    produced_outputs: ['ambassador_summary'],
    supports_human_gate_handoff: false,
    enabled_by_capability: 'ambassadors_enabled',
  },
  campaign_planner: {
    id: 'campaign-planner',
    purpose: 'Builds campaign briefs from event, performance, research, and ambassador context.',
    allowed_tools: ['draft_campaign_brief'],
    required_inputs: ['campaign_calendar_event', 'performance_summary', 'competitor_insights', 'ambassador_summary', 'structured_config'],
    produced_outputs: ['campaign_brief'],
    supports_human_gate_handoff: true,
    enabled_by_capability: 'campaigns_enabled',
  },
  canonical_copy_writer: {
    id: 'canonical-copy-writer',
    purpose: 'Produces the verbatim source-of-truth message (headline, core body, CTA, key fact) that all platform adapters must reproduce exactly.',
    allowed_tools: ['write_canonical_copy'],
    required_inputs: ['campaign_brief', 'brand_voice', 'calendar_event'],
    produced_outputs: ['canonical_copy'],
    supports_human_gate_handoff: false,
    enabled_by_capability: 'campaigns_enabled',
  },
  design_brief_agent: {
    id: 'design-brief-agent',
    purpose: 'Produces concise design briefs for campaign asset creation.',
    allowed_tools: ['draft_design_brief'],
    required_inputs: ['campaign_brief', 'calendar_event'],
    produced_outputs: ['design_brief'],
    supports_human_gate_handoff: true,
    enabled_by_capability: 'campaigns_enabled',
  },
  monitor: {
    id: 'monitor',
    purpose: 'Checks campaign performance against KPI targets and flags interventions.',
    allowed_tools: ['check_campaign_performance', 'write_state'],
    required_inputs: ['platform_metrics', 'content_registry', 'kpi_targets'],
    produced_outputs: ['monitor_status'],
    supports_human_gate_handoff: true,
    enabled_by_capability: 'campaigns_enabled',
  },
  post_campaign_reporter: {
    id: 'post-campaign-reporter',
    purpose: 'Compiles post-campaign reporting and closes the campaign workflow.',
    allowed_tools: ['compile_campaign_report', 'write_state'],
    required_inputs: ['platform_metrics', 'content_registry', 'campaign_brief'],
    produced_outputs: ['campaign_report'],
    supports_human_gate_handoff: false,
    enabled_by_capability: 'campaigns_enabled',
  },
} as const satisfies Record<string, AgentDefinition>

export function getAgentDefinition(agentKey: keyof typeof AGENT_REGISTRY) {
  return AGENT_REGISTRY[agentKey]
}
