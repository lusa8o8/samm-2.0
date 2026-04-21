export interface StructuredConfigSnapshot {
  icpCategories: any[]
  offerCatalog: any[]
  seasonalityProfiles: any[]
  discountPolicies: any[]
  outreachPolicies: any[]
  campaignDefaults: any | null
  approvalPolicy: any | null
}

export async function loadStructuredConfigSnapshot(
  supabase: any,
  orgId: string,
): Promise<StructuredConfigSnapshot> {
  const [
    icpResult,
    offerResult,
    seasonalityResult,
    discountResult,
    outreachResult,
    campaignDefaultsResult,
    approvalPolicyResult,
  ] = await Promise.all([
    supabase
      .from('icp_categories')
      .select('*')
      .eq('org_id', orgId)
      .eq('active', true)
      .order('priority_score', { ascending: false, nullsFirst: false }),
    supabase
      .from('offer_catalog')
      .select('*')
      .eq('org_id', orgId)
      .eq('active', true)
      .order('priority_score', { ascending: false, nullsFirst: false }),
    supabase
      .from('seasonality_profile')
      .select('*, seasonality_periods(*)')
      .eq('org_id', orgId)
      .eq('active', true),
    supabase
      .from('discount_policies')
      .select('*')
      .eq('org_id', orgId),
    supabase
      .from('outreach_policy')
      .select('*')
      .eq('org_id', orgId),
    supabase
      .from('campaign_defaults')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle(),
    supabase
      .from('approval_policy')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle(),
  ])

  const failures = [
    icpResult.error,
    offerResult.error,
    seasonalityResult.error,
    discountResult.error,
    outreachResult.error,
    campaignDefaultsResult.error,
    approvalPolicyResult.error,
  ].filter(Boolean)

  if (failures.length > 0) {
    const message = failures
      .map((error: any) => error?.message)
      .filter(Boolean)
      .join('; ')
    throw new Error(`Failed to load structured config: ${message}`)
  }

  return {
    icpCategories: icpResult.data ?? [],
    offerCatalog: offerResult.data ?? [],
    seasonalityProfiles: seasonalityResult.data ?? [],
    discountPolicies: discountResult.data ?? [],
    outreachPolicies: outreachResult.data ?? [],
    campaignDefaults: campaignDefaultsResult.data ?? null,
    approvalPolicy: approvalPolicyResult.data ?? null,
  }
}

export function getPrimaryIcpCategory(config: StructuredConfigSnapshot) {
  const preferredId = config.campaignDefaults?.default_icp_category_id ?? null
  return config.icpCategories.find((item) => item.id === preferredId) ?? config.icpCategories[0] ?? null
}

export function getPrimaryOffer(config: StructuredConfigSnapshot) {
  const preferredId = config.campaignDefaults?.default_offer_id ?? null
  return config.offerCatalog.find((item) => item.id === preferredId) ?? config.offerCatalog[0] ?? null
}

export function getCurrentSeasonalityPeriod(config: StructuredConfigSnapshot, today: string) {
  for (const profile of config.seasonalityProfiles) {
    const periods = Array.isArray(profile?.seasonality_periods) ? profile.seasonality_periods : []
    const activePeriod = periods.find((period: any) => {
      const start = period.starts_on ?? null
      const end = period.ends_on ?? null
      if (!start || !end) return false
      return today >= start && today <= end
    })

    if (activePeriod) {
      return {
        profile_name: profile.name,
        ...activePeriod,
      }
    }
  }

  return null
}

export function buildStructuredConfigSummary(
  config: StructuredConfigSnapshot,
  today: string,
): string {
  const primaryIcp = getPrimaryIcpCategory(config)
  const primaryOffer = getPrimaryOffer(config)
  const seasonality = getCurrentSeasonalityPeriod(config, today)

  const segments = config.icpCategories.slice(0, 3).map((item) => ({
    name: item.name,
    description: item.description ?? '',
    channels: item.default_channels ?? [],
    cta_style: item.default_cta_style ?? null,
  }))

  const offers = config.offerCatalog.slice(0, 3).map((item) => ({
    name: item.name,
    type: item.type ?? null,
    price: item.base_price ?? null,
    currency: item.currency ?? null,
    default_cta: item.default_cta ?? null,
  }))

  return JSON.stringify({
    primary_icp_category: primaryIcp
      ? {
          name: primaryIcp.name,
          description: primaryIcp.description ?? '',
          channels: primaryIcp.default_channels ?? [],
          cta_style: primaryIcp.default_cta_style ?? null,
        }
      : null,
    primary_offer: primaryOffer
      ? {
          name: primaryOffer.name,
          type: primaryOffer.type ?? null,
          price: primaryOffer.base_price ?? null,
          currency: primaryOffer.currency ?? null,
          default_cta: primaryOffer.default_cta ?? null,
        }
      : null,
    active_seasonality: seasonality
      ? {
          profile_name: seasonality.profile_name,
          period_name: seasonality.name,
          demand_level: seasonality.demand_level ?? null,
          campaign_priority: seasonality.campaign_priority ?? null,
          outreach_intensity: seasonality.outreach_intensity ?? null,
          allow_discounts: seasonality.allow_discounts ?? null,
        }
      : null,
    campaign_defaults: config.campaignDefaults
      ? {
          default_channels: config.campaignDefaults.default_channels ?? [],
          default_objective: config.campaignDefaults.default_objective ?? null,
          posting_intensity: config.campaignDefaults.posting_intensity ?? null,
          baseline_content_allowed: config.campaignDefaults.baseline_content_allowed ?? null,
          exclusive_campaigns: config.campaignDefaults.exclusive_campaigns ?? null,
        }
      : null,
    approval_policy: config.approvalPolicy
      ? {
          require_campaign_approval: config.approvalPolicy.require_campaign_approval ?? null,
          require_outbound_message_approval: config.approvalPolicy.require_outbound_message_approval ?? null,
          discount_threshold_percent: config.approvalPolicy.discount_threshold_percent ?? null,
        }
      : null,
    sample_segments: segments,
    sample_offers: offers,
    outreach_policies: config.outreachPolicies.slice(0, 2).map((item) => ({
      name: item.name,
      min_icp_fit_score: item.min_icp_fit_score ?? null,
      min_trigger_confidence: item.min_trigger_confidence ?? null,
      quiet_hours: item.quiet_hours ?? null,
    })),
    discount_policies: config.discountPolicies.slice(0, 2).map((item) => ({
      name: item.name,
      max_discount_percent: item.max_discount_percent ?? null,
      approval_required: item.approval_required ?? null,
    })),
  }, null, 2)
}
