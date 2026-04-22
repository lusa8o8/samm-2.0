import { getOrgId, supabase } from "../../../../src/lib/supabase";

export interface OperationsSettingsSummary {
  organization: {
    orgName: string;
    fullName: string;
    timezone: string;
    country: string;
    contactEmail: string;
  };
  brand: {
    tone: string;
    targetAudience: string;
    preferredCta: string;
    hashtags: string[];
  };
  visuals: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    headingFont: string;
    bodyFont: string;
  };
  connections: {
    connectedChannels: string[];
    availableHandles: string[];
  };
  strategy: {
    activeIcpCount: number;
    activeOfferCount: number;
    activeSeasonalityCount: number;
    configuredSeasonalityPeriods: number;
  };
  defaults: {
    defaultDurationDays: number;
    defaultChannels: string[];
    defaultObjective: string;
    defaultCtaStyle: string;
  };
  approval: {
    briefApprovalRequired: boolean;
    copyApprovalRequired: boolean;
    discountApprovalRequired: boolean;
    outreachApprovalRequired: boolean;
    notes: string;
  };
}

function isActiveRecord(value: unknown) {
  return value === true || value === undefined || value === null || value === 1 || value === "true";
}

export async function getOperationsSettingsSummary(): Promise<OperationsSettingsSummary> {
  const orgId = getOrgId();

  const [
    orgConfigResult,
    icpResult,
    offerResult,
    seasonalityResult,
    campaignDefaultsResult,
    approvalPolicyResult,
  ] = await Promise.all([
    supabase.from("org_config").select("*").eq("org_id", orgId).maybeSingle(),
    supabase.from("icp_categories").select("id,active").eq("org_id", orgId),
    supabase.from("offer_catalog").select("id,active").eq("org_id", orgId),
    supabase.from("seasonality_profile").select("id,active,seasonality_periods(id)").eq("org_id", orgId),
    supabase.from("campaign_defaults").select("*").eq("org_id", orgId).maybeSingle(),
    supabase.from("approval_policy").select("*").eq("org_id", orgId).maybeSingle(),
  ]);

  if (orgConfigResult.error) throw orgConfigResult.error;
  if (icpResult.error) throw icpResult.error;
  if (offerResult.error) throw offerResult.error;
  if (seasonalityResult.error) throw seasonalityResult.error;
  if (campaignDefaultsResult.error) throw campaignDefaultsResult.error;
  if (approvalPolicyResult.error) throw approvalPolicyResult.error;

  const org = orgConfigResult.data ?? {};
  const brandVoice = org.brand_voice ?? {};
  const brandVisual = org.brand_visual ?? {};
  const platformConnections = org.platform_connections ?? {};
  const socialHandles = org.social_handles ?? {};
  const campaignDefaults = campaignDefaultsResult.data ?? {};
  const approvalPolicy = approvalPolicyResult.data ?? {};

  const connectedChannels = Object.entries(platformConnections)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key)
    .sort();

  const availableHandles = Object.entries(socialHandles)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key]) => key)
    .sort();

  const activeIcpCount = (icpResult.data ?? []).filter((item) => isActiveRecord(item.active)).length;
  const activeOfferCount = (offerResult.data ?? []).filter((item) => isActiveRecord(item.active)).length;
  const activeSeasonalityCount = (seasonalityResult.data ?? []).filter((item) => isActiveRecord(item.active)).length;
  const configuredSeasonalityPeriods = (seasonalityResult.data ?? []).reduce(
    (total, item) => total + ((item.seasonality_periods ?? []).length || 0),
    0
  );

  return {
    organization: {
      orgName: org.org_name ?? org.short_name ?? "",
      fullName: org.full_name ?? org.legal_name ?? "",
      timezone: org.timezone ?? "",
      country: org.country ?? "",
      contactEmail: org.contact_email ?? "",
    },
    brand: {
      tone: brandVoice.tone ?? "",
      targetAudience: brandVoice.target_audience ?? "",
      preferredCta: brandVoice.preferred_cta ?? brandVoice.cta_preference ?? "",
      hashtags: brandVoice.hashtags ?? [],
    },
    visuals: {
      primaryColor: brandVisual.primary_color ?? "",
      secondaryColor: brandVisual.secondary_color ?? "",
      accentColor: brandVisual.accent_color ?? "",
      headingFont: brandVisual.font_heading ?? "",
      bodyFont: brandVisual.font_body ?? "",
    },
    connections: {
      connectedChannels,
      availableHandles,
    },
    strategy: {
      activeIcpCount,
      activeOfferCount,
      activeSeasonalityCount,
      configuredSeasonalityPeriods,
    },
    defaults: {
      defaultDurationDays: campaignDefaults.default_duration_days ?? 14,
      defaultChannels: campaignDefaults.default_channels ?? ["facebook", "whatsapp", "youtube", "email"],
      defaultObjective: campaignDefaults.default_objective ?? "engagement",
      defaultCtaStyle: campaignDefaults.default_cta_style ?? "educational",
    },
    approval: {
      briefApprovalRequired: approvalPolicy.brief_approval_required ?? true,
      copyApprovalRequired: approvalPolicy.copy_approval_required ?? true,
      discountApprovalRequired: approvalPolicy.discount_approval_required ?? true,
      outreachApprovalRequired: approvalPolicy.outreach_approval_required ?? true,
      notes: approvalPolicy.notes ?? "",
    },
  };
}
