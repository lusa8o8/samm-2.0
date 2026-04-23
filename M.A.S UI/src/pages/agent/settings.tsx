import { useState, useEffect, useRef, useMemo } from "react";
import {
  useGetOrgConfig,
  useUpdateOrgConfig,
  useTriggerPipeline,
  getGetOrgConfigQueryKey,
  useListIcpCategories,
  useListOfferCatalog,
  useListSeasonalityProfiles,
  useListDiscountPolicies,
  useListOutreachPolicies,
  useGetCampaignDefaults,
  useUpdateCampaignDefaults,
  getGetCampaignDefaultsQueryKey,
  useGetApprovalPolicy,
  useUpdateApprovalPolicy,
  getGetApprovalPolicyQueryKey,
  getListIcpCategoriesQueryKey,
  getListOfferCatalogQueryKey,
  getListSeasonalityProfilesQueryKey,
  getListDiscountPoliciesQueryKey,
  getListOutreachPoliciesQueryKey,
  useUpsertIcpCategory,
  useUpsertOfferCatalogItem,
  useUpsertSeasonalityProfile,
  useUpsertDiscountPolicy,
  useUpsertOutreachPolicy,
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Building,
  MessageSquare,
  Share2,
  GitBranch,
  Target,
  Check,
  AlertCircle,
  Play,
  Palette,
  Users,
  Package,
  CalendarRange,
  ShieldCheck,
  PencilLine,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SiFacebook, SiWhatsapp, SiYoutube } from "react-icons/si";
import { Mail, Monitor, Linkedin, Music2, Hash, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INTEGRATIONS = [
  { id: "facebook",  name: "Facebook Pages",            Icon: SiFacebook,  color: "#1877F2", live: true },
  { id: "whatsapp",  name: "WhatsApp Business",         Icon: SiWhatsapp,  color: "#25D366", live: true },
  { id: "youtube",   name: "YouTube Channel",           Icon: SiYoutube,   color: "#FF0000", live: true },
  { id: "email",     name: "Email (SendGrid)",           Icon: Mail,        color: "#000",    live: true },
  { id: "studyhub",  name: "Custom App / Private Tool",   Icon: Building,    color: "#000",    live: true },
  { id: "linkedin",  name: "LinkedIn Page",             Icon: Linkedin,    color: "#0A66C2", live: false },
  { id: "tiktok",    name: "TikTok Account",            Icon: Music2,      color: "#010101", live: false },
  { id: "slack",     name: "Slack Workspace",           Icon: Hash,        color: "#4A154B", live: false },
  { id: "teams",     name: "Microsoft Teams",           Icon: Monitor,     color: "#6264A7", live: false },
  { id: "telegram",  name: "Telegram Channel",          Icon: Send,        color: "#26A5E4", live: false },
];

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID ?? "1944340656223346";
const FACEBOOK_API_VERSION = "v25.0";

type FacebookPageOption = {
  id: string;
  name: string;
  access_token: string;
  tasks?: string[];
};

export default function AgentSettings() {
  const { data: config, isLoading } = useGetOrgConfig();
  const updateMutation = useUpdateOrgConfig();
  const triggerPipeline = useTriggerPipeline();
  const { data: icpCategories = [] } = useListIcpCategories();
  const { data: offerCatalog = [] } = useListOfferCatalog();
  const { data: seasonalityProfiles = [] } = useListSeasonalityProfiles();
  const { data: discountPolicies = [] } = useListDiscountPolicies();
  const { data: outreachPolicies = [] } = useListOutreachPolicies();
  const { data: campaignDefaults } = useGetCampaignDefaults();
  const { data: approvalPolicy } = useGetApprovalPolicy();
  const updateCampaignDefaults = useUpdateCampaignDefaults();
  const updateApprovalPolicy = useUpdateApprovalPolicy();
  const upsertIcpCategory = useUpsertIcpCategory();
  const upsertOfferCatalogItem = useUpsertOfferCatalogItem();
  const upsertSeasonalityProfile = useUpsertSeasonalityProfile();
  const upsertDiscountPolicy = useUpsertDiscountPolicy();
  const upsertOutreachPolicy = useUpsertOutreachPolicy();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isActiveRecord = (value: unknown) =>
    value === true || value === undefined || value === null || value === 1 || value === "true";

  const activeIcpCount = useMemo(
    () => icpCategories.filter((item) => isActiveRecord(item.active)).length,
    [icpCategories]
  );

  const activeOfferCount = useMemo(
    () => offerCatalog.filter((item) => isActiveRecord(item.active)).length,
    [offerCatalog]
  );

  const displaySeasonalityProfiles = useMemo(() => {
    const byName = new Map<string, (typeof seasonalityProfiles)[number]>();

    for (const profile of seasonalityProfiles) {
      const key = (profile.name ?? "").trim().toLowerCase() || profile.id;
      const existing = byName.get(key);

      if (!existing) {
        byName.set(key, profile);
        continue;
      }

      const existingScore =
        ((existing.seasonality_periods ?? []).length * 10000) +
        (isActiveRecord(existing.active) ? 1000 : 0) +
        new Date(existing.updated_at ?? existing.created_at ?? 0).getTime();
      const nextScore =
        ((profile.seasonality_periods ?? []).length * 10000) +
        (isActiveRecord(profile.active) ? 1000 : 0) +
        new Date(profile.updated_at ?? profile.created_at ?? 0).getTime();

      if (nextScore >= existingScore) {
        byName.set(key, profile);
      }
    }

    return Array.from(byName.values()).sort((a, b) => {
      const aScore =
        ((a.seasonality_periods ?? []).length * 10000) +
        (isActiveRecord(a.active) ? 1000 : 0) +
        new Date(a.updated_at ?? a.created_at ?? 0).getTime();
      const bScore =
        ((b.seasonality_periods ?? []).length * 10000) +
        (isActiveRecord(b.active) ? 1000 : 0) +
        new Date(b.updated_at ?? b.created_at ?? 0).getTime();

      return bScore - aScore;
    });
  }, [seasonalityProfiles]);

  const activeSeasonalityProfileCount = useMemo(
    () => displaySeasonalityProfiles.filter((profile) => isActiveRecord(profile.active)).length,
    [displaySeasonalityProfiles]
  );

  const configuredSeasonalityPeriods = useMemo(
    () => displaySeasonalityProfiles.reduce((total, profile) => total + (profile.seasonality_periods?.length ?? 0), 0),
    [displaySeasonalityProfiles]
  );

  const [orgData, setOrgData] = useState<any>({});
  const [brandData, setBrandData] = useState<any>({});
  const [visualData, setVisualData] = useState<any>({});
  const [kpiData, setKpiData] = useState<any>({});
  const [pipelineData, setPipelineData] = useState<any>({});
  const [campaignDefaultsData, setCampaignDefaultsData] = useState<any>({});
  const [approvalPolicyData, setApprovalPolicyData] = useState<any>({});
  const [icpEditor, setIcpEditor] = useState<any>({});
  const [offerEditor, setOfferEditor] = useState<any>({});
  const [seasonalityEditor, setSeasonalityEditor] = useState<any>({});
  const [discountEditor, setDiscountEditor] = useState<any>({});
  const [outreachEditor, setOutreachEditor] = useState<any>({});
  const [facebookCredentials, setFacebookCredentials] = useState({ page_id: "", access_token: "" });
  const [facebookPages, setFacebookPages] = useState<FacebookPageOption[]>([]);
  const [selectedFacebookPageId, setSelectedFacebookPageId] = useState("");
  const [isConnectingFacebook, setIsConnectingFacebook] = useState(false);

  const initialized = useRef(false);
  const campaignDefaultsInitialized = useRef(false);
  const approvalPolicyInitialized = useRef(false);
  const icpInitialized = useRef(false);
  const offerInitialized = useRef(false);
  const seasonalityInitialized = useRef(false);
  const discountInitialized = useRef(false);
  const outreachInitialized = useRef(false);
  const facebookConnectHandled = useRef(false);

  useEffect(() => {
    if (config && !initialized.current) {
      setOrgData({
        org_name: config.org_name,
        full_name: config.full_name,
        country: config.country,
        timezone: config.timezone,
        contact_email: config.contact_email
      });
      setBrandData(config.brand_voice);
      setVisualData({
        ...(config.brand_visual ?? {}),
        markdown_design_spec: config.markdown_design_spec ?? "",
        social_handles: config.social_handles ?? {},
        primary_cta_url: config.primary_cta_url ?? "",
      });
      setKpiData(config.kpi_targets);
      setFacebookCredentials({
        page_id: String((config.platform_connections as Record<string, any>)?.facebook?.page_id ?? ""),
        access_token: String((config.platform_connections as Record<string, any>)?.facebook?.access_token ?? ""),
      });
      setPipelineData(config.pipeline_config);
      initialized.current = true;
    }
  }, [config]);

  useEffect(() => {
    if (campaignDefaults && !campaignDefaultsInitialized.current) {
      setCampaignDefaultsData(campaignDefaults);
      campaignDefaultsInitialized.current = true;
    }
  }, [campaignDefaults]);

  useEffect(() => {
    if (approvalPolicy && !approvalPolicyInitialized.current) {
      setApprovalPolicyData(approvalPolicy);
      approvalPolicyInitialized.current = true;
    }
  }, [approvalPolicy]);

  useEffect(() => {
    if (icpCategories.length && !icpInitialized.current) {
      resetIcpEditor({
        ...icpCategories[0],
        hard_filters_json: toJsonText(icpCategories[0].hard_filters),
        soft_signals_json: toJsonText(icpCategories[0].soft_signals),
        exclusion_rules_json: toJsonText(icpCategories[0].exclusion_rules),
        default_channels_csv: (icpCategories[0].default_channels ?? []).join(", "),
        custom_fields_json: toJsonText(icpCategories[0].custom_fields),
      });
      icpInitialized.current = true;
    }
  }, [icpCategories]);

  useEffect(() => {
    if (offerCatalog.length && !offerInitialized.current) {
      resetOfferEditor({
        ...offerCatalog[0],
        base_price: offerCatalog[0].base_price ?? "",
        applicable_channels_csv: (offerCatalog[0].applicable_channels ?? []).join(", "),
      });
      offerInitialized.current = true;
    }
  }, [offerCatalog]);

  useEffect(() => {
    if (displaySeasonalityProfiles.length && !seasonalityInitialized.current) {
      setSeasonalityEditor({
        ...displaySeasonalityProfiles[0],
        seasonality_periods_json: JSON.stringify(displaySeasonalityProfiles[0].seasonality_periods ?? [], null, 2),
      });
      seasonalityInitialized.current = true;
    }
  }, [displaySeasonalityProfiles]);

  useEffect(() => {
    if (discountPolicies.length && !discountInitialized.current) {
      resetDiscountEditor({
        ...discountPolicies[0],
        allowed_discount_types_csv: (discountPolicies[0].allowed_discount_types ?? []).join(", "),
        allowed_conditions_json: toJsonText(discountPolicies[0].allowed_conditions),
        forbidden_conditions_json: toJsonText(discountPolicies[0].forbidden_conditions),
      });
      discountInitialized.current = true;
    }
  }, [discountPolicies]);

  useEffect(() => {
    if (outreachPolicies.length && !outreachInitialized.current) {
      resetOutreachEditor({
        ...outreachPolicies[0],
        channel_rules_json: toJsonText(outreachPolicies[0].channel_rules),
      });
      outreachInitialized.current = true;
    }
  }, [outreachPolicies]);

  const [triggeringPipeline, setTriggeringPipeline] = useState<string | null>(null);
  const platformConnections = ((config?.platform_connections ?? {}) as Record<string, any>);
  const moduleSettings = (platformConnections.modules ?? {}) as Record<string, { enabled?: boolean }>;
  const isModuleEnabled = (moduleId: string) => moduleSettings[moduleId]?.enabled !== false;

  async function handleTriggerPipeline(pipeline: "a" | "b" | "c", label: string) {
    setTriggeringPipeline(pipeline);
    try {
      await triggerPipeline.mutateAsync({ pipeline });
      toast({ title: "Pipeline triggered", description: `${label} run queued.` });
    } catch (err) {
      toast({ title: "Trigger failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setTriggeringPipeline(null);
    }
  }

  function handleToggleConnection(platformId: string, currentlyConnected: boolean) {
    const updated = { ...(config?.platform_connections ?? {}) };
    if (currentlyConnected) {
      delete updated[platformId];
    } else {
      updated[platformId] = { connected: true, connected_at: new Date().toISOString() };
    }
    updateMutation.mutate(
      { data: { platform_connections: updated } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrgConfigQueryKey() });
          toast({
            title: currentlyConnected ? "Integration disabled" : "Integration enabled",
            description: `${platformId} connection ${currentlyConnected ? "removed" : "saved"}.`,
          });
        },
      }
    );
  }

  function handleToggleModule(moduleId: string, currentlyEnabled: boolean) {
    const updated = {
      ...platformConnections,
      modules: {
        ...moduleSettings,
        [moduleId]: {
          ...(moduleSettings[moduleId] ?? {}),
          enabled: !currentlyEnabled,
          updated_at: new Date().toISOString(),
        },
      },
    };

    updateMutation.mutate(
      { data: { platform_connections: updated } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrgConfigQueryKey() });
          toast({
            title: !currentlyEnabled ? "Module enabled" : "Module disabled",
            description: `${moduleId} is now ${!currentlyEnabled ? "active" : "hidden"} in this workspace.`,
          });
        },
      }
    );
  }

  async function persistFacebookConnection(nextFacebook: Record<string, any>, successTitle: string, successDescription: string) {
    const existing = (config?.platform_connections ?? {}) as Record<string, any>;
    const updated = {
      ...existing,
      facebook: {
        ...(existing.facebook ?? {}),
        connected: nextFacebook.connected ?? true,
        connected_at: existing.facebook?.connected_at ?? new Date().toISOString(),
        ...nextFacebook,
      },
    };

    await updateMutation.mutateAsync({ data: { platform_connections: updated } });
    queryClient.invalidateQueries({ queryKey: getGetOrgConfigQueryKey() });
    toast({ title: successTitle, description: successDescription });
  }

  async function handleSaveFacebookCredentials() {
    try {
      await persistFacebookConnection(
        {
          connected: true,
          page_id: facebookCredentials.page_id.trim(),
          access_token: facebookCredentials.access_token.trim(),
        },
        "Facebook credentials saved",
        "Page publishing credentials updated."
      );
    } catch (err) {
      toast({
        title: "Save failed",
        description: (err as Error).message ?? "Could not save Facebook credentials.",
        variant: "destructive",
      });
    }
  }

  function getFacebookRedirectUri() {
    return `${window.location.origin}/operations/settings?facebook_connect=1`;
  }

  function clearFacebookConnectUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete("facebook_connect");
    url.hash = "";
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  }

  function handleStartFacebookConnect() {
    if (!FACEBOOK_APP_ID) {
      toast({
        title: "Facebook app missing",
        description: "Set VITE_FACEBOOK_APP_ID before using the official Facebook connect flow.",
        variant: "destructive",
      });
      return;
    }

    const params = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      redirect_uri: getFacebookRedirectUri(),
      scope: "pages_show_list,pages_read_engagement,pages_manage_posts",
      response_type: "token",
      auth_type: "rerequest",
    });

    window.location.assign(`https://www.facebook.com/${FACEBOOK_API_VERSION}/dialog/oauth?${params.toString()}`);
  }

  async function handleUseSelectedFacebookPage() {
    const page = facebookPages.find((entry) => entry.id === selectedFacebookPageId);
    if (!page) return;

    try {
      setFacebookCredentials({ page_id: page.id, access_token: page.access_token });
      await persistFacebookConnection(
        {
          connected: true,
          page_id: page.id,
          page_name: page.name,
          access_token: page.access_token,
          tasks: page.tasks ?? [],
          connected_via: "meta_app",
        },
        "Facebook page connected",
        `${page.name} is now connected through the official samm app.`
      );
      setFacebookPages([]);
      setSelectedFacebookPageId("");
    } catch (err) {
      toast({
        title: "Facebook connect failed",
        description: (err as Error).message ?? "Could not save the selected Facebook page.",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    if (facebookConnectHandled.current) return;

    const url = new URL(window.location.href);
    if (url.searchParams.get("facebook_connect") !== "1") return;

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const errorDescription =
      hashParams.get("error_description") ??
      url.searchParams.get("error_description") ??
      hashParams.get("error_reason");

    facebookConnectHandled.current = true;

    if (!accessToken) {
      clearFacebookConnectUrl();
      if (errorDescription) {
        toast({
          title: "Facebook connect cancelled",
          description: decodeURIComponent(errorDescription),
          variant: "destructive",
        });
      }
      return;
    }

    const controller = new AbortController();

    (async () => {
      setIsConnectingFacebook(true);
      try {
        const params = new URLSearchParams({
          fields: "id,name,access_token,tasks",
          access_token: accessToken,
        });
        const response = await fetch(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/me/accounts?${params.toString()}`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok || payload.error) {
          throw new Error(payload.error?.message ?? "Could not fetch Facebook Pages.");
        }

        const pages = (payload.data ?? []) as FacebookPageOption[];
        if (!pages.length) {
          throw new Error("No manageable Facebook Pages were returned for this account.");
        }

        if (pages.length === 1) {
          const [page] = pages;
          setFacebookCredentials({ page_id: page.id, access_token: page.access_token });
          await persistFacebookConnection(
            {
              connected: true,
              page_id: page.id,
              page_name: page.name,
              access_token: page.access_token,
              tasks: page.tasks ?? [],
              connected_via: "meta_app",
            },
            "Facebook page connected",
            `${page.name} is now connected through the official samm app.`
          );
        } else {
          setFacebookPages(pages);
          setSelectedFacebookPageId(pages[0]?.id ?? "");
          toast({
            title: "Choose a Facebook page",
            description: "Select which connected Page samm should use for publishing.",
          });
        }
      } catch (err) {
        toast({
          title: "Facebook connect failed",
          description: (err as Error).message ?? "Could not complete Facebook connection.",
          variant: "destructive",
        });
      } finally {
        setIsConnectingFacebook(false);
        clearFacebookConnectUrl();
      }
    })();

    return () => controller.abort();
  }, [queryClient, toast, updateMutation]);


  const handleSave = (sectionKey: string, data: any) => {
    const payload = { [sectionKey]: data };
    if (sectionKey === "org") {
      Object.assign(payload, data);
      delete payload.org;
    }

    updateMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrgConfigQueryKey() });
          toast({
            title: "Settings saved",
            description: "Configuration has been updated successfully.",
          });
        },
        onError: (err) => {
          toast({
            title: "Save failed",
            description: (err as Error).message ?? "Could not save settings.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSaveVisualBrand = () => {
    const { markdown_design_spec, social_handles, primary_cta_url, ...brandVisualFields } = visualData;
    const customAppUrl = social_handles?.custom_app_url ?? social_handles?.studyhub_url ?? "";
    updateMutation.mutate(
      {
        data: {
          brand_visual: brandVisualFields,
          markdown_design_spec: markdown_design_spec ?? "",
          social_handles: { ...(social_handles ?? {}), custom_app_url: customAppUrl, studyhub_url: customAppUrl },
          primary_cta_url: primary_cta_url ?? "",
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrgConfigQueryKey() });
          toast({ title: "Settings saved", description: "Visual brand updated successfully." });
        },
        onError: (err) => {
          toast({ title: "Save failed", description: (err as Error).message ?? "Could not save visual brand.", variant: "destructive" });
        },
      }
    );
  };

  const handleSaveCampaignDefaults = () => {
    updateCampaignDefaults.mutate(
      { data: campaignDefaultsData },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCampaignDefaultsQueryKey() });
          toast({ title: "Campaign defaults saved", description: "Default campaign rules updated successfully." });
        },
        onError: (err) => {
          toast({
            title: "Save failed",
            description: (err as Error).message ?? "Could not save campaign defaults.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSaveApprovalPolicy = () => {
    updateApprovalPolicy.mutate(
      { data: approvalPolicyData },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetApprovalPolicyQueryKey() });
          toast({ title: "Approval policy saved", description: "Approval rules updated successfully." });
        },
        onError: (err) => {
          toast({
            title: "Save failed",
            description: (err as Error).message ?? "Could not save approval policy.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const parseJsonInput = (value: string, fieldLabel: string) => {
    if (!value.trim()) return {};
    try {
      return JSON.parse(value);
    } catch (_error) {
      throw new Error(`${fieldLabel} must be valid JSON.`);
    }
  };

  const parseJsonArrayInput = (value: string, fieldLabel: string) => {
    if (!value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) throw new Error("not-array");
      return parsed;
    } catch (_error) {
      throw new Error(`${fieldLabel} must be a valid JSON array.`);
    }
  };

  const toJsonText = (value: unknown, fallback: unknown = {}) => JSON.stringify(value ?? fallback, null, 2);

  const resetIcpEditor = (next?: any) =>
    setIcpEditor(
      next ?? {
        name: "",
        active: true,
        description: "",
        hard_filters_json: "{}",
        soft_signals_json: "{}",
        exclusion_rules_json: "{}",
        default_channels_csv: "",
        default_cta_style: "",
        priority_score: 0,
        custom_fields_json: "{}",
      }
    );

  const resetOfferEditor = (next?: any) =>
    setOfferEditor(
      next ?? {
        name: "",
        type: "product",
        active: true,
        category: "",
        description: "",
        base_price: "",
        currency: "",
        pricing_model: "",
        applicable_channels_csv: "",
        default_cta: "",
        delivery_method: "",
        landing_url: "",
        discount_allowed: false,
        approval_required: false,
        priority_score: 0,
        }
      );

  const hydrateOfferEditor = (next?: any) =>
    resetOfferEditor(
      next
        ? {
            ...next,
            active: next.active ?? true,
            base_price: next.base_price ?? "",
            applicable_channels_csv: Array.isArray(next.applicable_channels)
              ? next.applicable_channels.join(", ")
              : "",
          }
        : undefined
    );

  const resetSeasonalityEditor = (next?: any) =>
    setSeasonalityEditor(
      next ?? {
        name: "",
        description: "",
        active: true,
        seasonality_periods_json: "[]",
      }
    );

  const hydrateSeasonalityEditor = (next?: any) =>
    resetSeasonalityEditor(
      next
        ? {
            ...next,
            active: next.active ?? true,
            seasonality_periods_json: JSON.stringify(next.seasonality_periods ?? [], null, 2),
          }
        : undefined
    );

  const resetDiscountEditor = (next?: any) =>
    setDiscountEditor(
      next ?? {
        name: "",
        max_discount_percent: 0,
        allowed_discount_types_csv: "",
        cooldown_days: 0,
        stacking_allowed: false,
        approval_required: true,
        allowed_conditions_json: "{}",
        forbidden_conditions_json: "{}",
      }
    );

  const resetOutreachEditor = (next?: any) =>
    setOutreachEditor(
      next ?? {
        name: "",
        min_icp_fit_score: 0,
        min_trigger_confidence: 0,
        negative_signal_suppression_days: 7,
        max_contacts_per_7d: 3,
        max_contacts_per_30d: 8,
        channel_rules_json: "{}",
      }
    );

  const handleSaveIcp = async () => {
    try {
      await upsertIcpCategory.mutateAsync({
        data: {
          id: icpEditor.id,
          name: icpEditor.name?.trim(),
          active: Boolean(icpEditor.active),
          description: icpEditor.description ?? "",
          hard_filters: parseJsonInput(icpEditor.hard_filters_json ?? "{}", "Hard filters"),
          soft_signals: parseJsonInput(icpEditor.soft_signals_json ?? "{}", "Soft signals"),
          exclusion_rules: parseJsonInput(icpEditor.exclusion_rules_json ?? "{}", "Exclusion rules"),
          default_channels: (icpEditor.default_channels_csv ?? "")
            .split(",")
            .map((item: string) => item.trim())
            .filter(Boolean),
          default_cta_style: icpEditor.default_cta_style ?? "",
          priority_score: Number(icpEditor.priority_score ?? 0),
          custom_fields: parseJsonInput(icpEditor.custom_fields_json ?? "{}", "Custom fields"),
        },
      });
      queryClient.invalidateQueries({ queryKey: getListIcpCategoriesQueryKey() });
      toast({ title: "ICP category saved", description: "Audience segment updated successfully." });
    } catch (err) {
      toast({ title: "Save failed", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleSaveOffer = async () => {
    try {
      const saved = await upsertOfferCatalogItem.mutateAsync({
        data: {
          id: offerEditor.id,
          name: offerEditor.name?.trim(),
          type: offerEditor.type ?? "product",
          active: Boolean(offerEditor.active),
          category: offerEditor.category ?? "",
          description: offerEditor.description ?? "",
          base_price: offerEditor.base_price === "" ? null : Number(offerEditor.base_price),
          currency: offerEditor.currency ?? "",
          pricing_model: offerEditor.pricing_model ?? "",
          applicable_channels: (offerEditor.applicable_channels_csv ?? "")
            .split(",")
            .map((item: string) => item.trim())
            .filter(Boolean),
          default_cta: offerEditor.default_cta ?? "",
          delivery_method: offerEditor.delivery_method ?? "",
          landing_url: offerEditor.landing_url ?? "",
          discount_allowed: Boolean(offerEditor.discount_allowed),
          approval_required: Boolean(offerEditor.approval_required),
          priority_score: Number(offerEditor.priority_score ?? 0),
        },
      });
      hydrateOfferEditor(saved);
      await queryClient.invalidateQueries({ queryKey: getListOfferCatalogQueryKey() });
      toast({ title: "Offer saved", description: "Offer catalog item updated successfully." });
    } catch (err) {
      toast({ title: "Save failed", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleSaveSeasonality = async () => {
    try {
      const saved = await upsertSeasonalityProfile.mutateAsync({
        data: {
          id: seasonalityEditor.id,
          name: seasonalityEditor.name?.trim(),
          description: seasonalityEditor.description ?? "",
          active: Boolean(seasonalityEditor.active),
          seasonality_periods: parseJsonArrayInput(
            seasonalityEditor.seasonality_periods_json ?? "[]",
            "Seasonality periods"
          ),
        },
      });
      hydrateSeasonalityEditor(saved);
      await queryClient.invalidateQueries({ queryKey: getListSeasonalityProfilesQueryKey() });
      toast({ title: "Seasonality saved", description: "Demand profile updated successfully." });
    } catch (err) {
      toast({ title: "Save failed", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleSaveDiscount = async () => {
    try {
      await upsertDiscountPolicy.mutateAsync({
        data: {
          id: discountEditor.id,
          name: discountEditor.name?.trim(),
          max_discount_percent: Number(discountEditor.max_discount_percent ?? 0),
          allowed_discount_types: (discountEditor.allowed_discount_types_csv ?? "")
            .split(",")
            .map((item: string) => item.trim())
            .filter(Boolean),
          cooldown_days: Number(discountEditor.cooldown_days ?? 0),
          stacking_allowed: Boolean(discountEditor.stacking_allowed),
          approval_required: Boolean(discountEditor.approval_required),
          allowed_conditions: parseJsonInput(discountEditor.allowed_conditions_json ?? "{}", "Allowed conditions"),
          forbidden_conditions: parseJsonInput(discountEditor.forbidden_conditions_json ?? "{}", "Forbidden conditions"),
        },
      });
      queryClient.invalidateQueries({ queryKey: getListDiscountPoliciesQueryKey() });
      toast({ title: "Discount policy saved", description: "Pricing rules updated successfully." });
    } catch (err) {
      toast({ title: "Save failed", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleSaveOutreach = async () => {
    try {
      await upsertOutreachPolicy.mutateAsync({
        data: {
          id: outreachEditor.id,
          name: outreachEditor.name?.trim(),
          min_icp_fit_score: Number(outreachEditor.min_icp_fit_score ?? 0),
          min_trigger_confidence: Number(outreachEditor.min_trigger_confidence ?? 0),
          negative_signal_suppression_days: Number(outreachEditor.negative_signal_suppression_days ?? 0),
          max_contacts_per_7d: Number(outreachEditor.max_contacts_per_7d ?? 0),
          max_contacts_per_30d: Number(outreachEditor.max_contacts_per_30d ?? 0),
          channel_rules: parseJsonInput(outreachEditor.channel_rules_json ?? "{}", "Channel rules"),
        },
      });
      queryClient.invalidateQueries({ queryKey: getListOutreachPoliciesQueryKey() });
      toast({ title: "Outreach policy saved", description: "Outreach rules updated successfully." });
    } catch (err) {
      toast({ title: "Save failed", description: (err as Error).message, variant: "destructive" });
    }
  };

  if (isLoading || !initialized.current) {
    return <div className="space-y-4 p-8"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  const TagInput = ({ value, onChange }: { value: string[], onChange: (v: string[]) => void }) => {
    const [input, setInput] = useState("");
    return (
      <div className="space-y-2">
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((tag, i) => (
            <Badge key={i} variant="secondary" className="flex items-center gap-1 bg-muted">
              {tag}
              <span className="ml-1 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => onChange(value.filter((_, idx) => idx !== i))}>�</span>
            </Badge>
          ))}
        </div>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              e.preventDefault();
              onChange([...value, input.trim()]);
              setInput("");
            }
          }}
          placeholder="Type and press enter..."
          className="h-9 text-sm"
        />
      </div>
    );
  };

  const toggleDefaultChannel = (channel: string, enabled: boolean) => {
    const currentChannels = Array.isArray(campaignDefaultsData.default_channels)
      ? campaignDefaultsData.default_channels
      : [];
    const nextChannels = enabled
      ? Array.from(new Set([...currentChannels, channel]))
      : currentChannels.filter((value: string) => value !== channel);

    setCampaignDefaultsData({ ...campaignDefaultsData, default_channels: nextChannels });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-border px-6 pb-4 pt-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span>Operations</span>
            <span>/</span>
            <span className="text-foreground">Settings</span>
          </div>
          <h1 className="mt-2 text-xl font-semibold text-foreground">Operational settings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage workspace configuration, brand voice, publishing connections, and automation rules.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-3">
            <AccordionItem value="item-1" className="overflow-hidden rounded-xl border border-border bg-card px-0 shadow-none">
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2 text-foreground/70"><Building className="h-4 w-4" /></div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold">Organisation Details</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">Basic profile and contact information</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-6 pt-2">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Short Name</Label>
                    <Input value={orgData.org_name} onChange={(e) => setOrgData({ ...orgData, org_name: e.target.value })} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Full Legal Name</Label>
                    <Input value={orgData.full_name} onChange={(e) => setOrgData({ ...orgData, full_name: e.target.value })} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Country</Label>
                    <Input value={orgData.country} onChange={(e) => setOrgData({ ...orgData, country: e.target.value })} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Timezone</Label>
                    <Input value={orgData.timezone} onChange={(e) => setOrgData({ ...orgData, timezone: e.target.value })} className="h-9" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs">Contact Email</Label>
                    <Input value={orgData.contact_email} onChange={(e) => setOrgData({ ...orgData, contact_email: e.target.value })} className="h-9" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button size="sm" onClick={() => handleSave("org", orgData)} disabled={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" /> Save Organisation
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-1b" className="overflow-hidden rounded-xl border border-border bg-card px-0 shadow-none">
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2 text-foreground/70"><Users className="h-4 w-4" /></div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold">Audience, Offers &amp; Seasonality</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">Universal config state for ICP, products, outreach, pricing, and demand cycles</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-1">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border bg-background p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> ICP Categories
                    </div>
                    <div className="mt-3 text-2xl font-semibold">{icpCategories.length}</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {icpCategories.length ? `${activeIcpCount} active audience segments configured.` : "No audience segments configured yet."}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Package className="h-3.5 w-3.5" /> Offer Catalog
                    </div>
                    <div className="mt-3 text-2xl font-semibold">{offerCatalog.length}</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {offerCatalog.length ? `${activeOfferCount} active offers available for campaigns.` : "No offers configured yet."}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <CalendarRange className="h-3.5 w-3.5" /> Seasonality
                    </div>
                    <div className="mt-3 text-2xl font-semibold">
                      {configuredSeasonalityPeriods}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {displaySeasonalityProfiles.length
                        ? `${activeSeasonalityProfileCount} active profiles controlling demand and campaign intensity.`
                        : "No seasonality profiles configured yet."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border bg-background p-4">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audience segments</div>
                    {icpCategories.length ? (
                      <div className="space-y-3">
                        {icpCategories.slice(0, 4).map((item) => (
                          <div key={item.id} className="rounded-md border p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-medium">{item.name}</div>
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                Priority {item.priority_score}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{item.description || "No description yet."}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Create ICP categories next to define who samm should target by default.</p>
                    )}
                  </div>

                  <div className="rounded-lg border bg-background p-4">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Offers &amp; pricing controls</div>
                    {offerCatalog.length ? (
                      <div className="space-y-3">
                        {offerCatalog.slice(0, 4).map((item) => (
                          <div key={item.id} className="rounded-md border p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-medium">{item.name}</div>
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">{item.type}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.base_price != null && item.currency ? `${item.currency} ${item.base_price}` : "Price not set"} · {item.discount_allowed ? "Discountable" : "No discounts"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No offers yet. Campaigns will stay generic until the offer catalog is populated.</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{discountPolicies.length} discount policies</span>
                      <span>·</span>
                      <span>{outreachPolicies.length} outreach policies</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-lg border bg-background p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seasonality &amp; outreach overview</div>
                  {displaySeasonalityProfiles.length || outreachPolicies.length ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        {displaySeasonalityProfiles.slice(0, 2).map((profile) => (
                          <div key={profile.id} className="rounded-md border p-3">
                            <div className="text-sm font-medium">{profile.name}</div>
                            <p className="mt-1 text-xs text-muted-foreground">{profile.description || "No description yet."}</p>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              {(profile.seasonality_periods ?? []).length} periods configured
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        {outreachPolicies.slice(0, 2).map((policy) => (
                          <div key={policy.id} className="rounded-md border p-3">
                            <div className="text-sm font-medium">{policy.name}</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Min ICP fit {policy.min_icp_fit_score} · Trigger confidence {policy.min_trigger_confidence}
                            </p>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              7d cap {policy.max_contacts_per_7d} · 30d cap {policy.max_contacts_per_30d}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Seasonality and outreach policy defaults are present, but no custom profiles have been added yet.</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-1c" className="overflow-hidden rounded-xl border border-border bg-card px-0 shadow-none">
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2 text-foreground/70"><PencilLine className="h-4 w-4" /></div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold">Universal Config Editor</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">Create and update ICP, offers, seasonality, discounts, and outreach rules without waiting for the new workspace shell</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 px-4 pb-6 pt-2">
                <div className="rounded-lg border bg-background p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-medium">ICP categories</h4>
                      <p className="text-xs text-muted-foreground">Audience segments remain first-class targeting truth.</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => resetIcpEditor()}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> New ICP
                    </Button>
                  </div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {icpCategories.map((item) => (
                      <Button
                        key={item.id}
                        size="sm"
                        variant={icpEditor.id === item.id ? "default" : "outline"}
                        className="h-7 text-[11px]"
                        onClick={() =>
                          resetIcpEditor({
                            ...item,
                            hard_filters_json: toJsonText(item.hard_filters),
                            soft_signals_json: toJsonText(item.soft_signals),
                            exclusion_rules_json: toJsonText(item.exclusion_rules),
                            default_channels_csv: (item.default_channels ?? []).join(", "),
                            custom_fields_json: toJsonText(item.custom_fields),
                          })
                        }
                      >
                        {item.name}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Name</Label>
                      <Input value={icpEditor.name ?? ""} onChange={(e) => setIcpEditor({ ...icpEditor, name: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Default CTA style</Label>
                      <Input value={icpEditor.default_cta_style ?? ""} onChange={(e) => setIcpEditor({ ...icpEditor, default_cta_style: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs">Description</Label>
                      <Textarea value={icpEditor.description ?? ""} onChange={(e) => setIcpEditor({ ...icpEditor, description: e.target.value })} className="h-20 resize-none text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Default channels (comma separated)</Label>
                      <Input value={icpEditor.default_channels_csv ?? ""} onChange={(e) => setIcpEditor({ ...icpEditor, default_channels_csv: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Priority score</Label>
                      <Input type="number" value={icpEditor.priority_score ?? 0} onChange={(e) => setIcpEditor({ ...icpEditor, priority_score: Number(e.target.value || 0) })} className="h-9" />
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
                      <div className="text-sm">Active segment</div>
                      <Switch checked={Boolean(icpEditor.active ?? true)} onCheckedChange={(checked) => setIcpEditor({ ...icpEditor, active: checked })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Hard filters (JSON)</Label>
                      <Textarea value={icpEditor.hard_filters_json ?? "{}"} onChange={(e) => setIcpEditor({ ...icpEditor, hard_filters_json: e.target.value })} className="h-28 resize-none font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Soft signals (JSON)</Label>
                      <Textarea value={icpEditor.soft_signals_json ?? "{}"} onChange={(e) => setIcpEditor({ ...icpEditor, soft_signals_json: e.target.value })} className="h-28 resize-none font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Exclusion rules (JSON)</Label>
                      <Textarea value={icpEditor.exclusion_rules_json ?? "{}"} onChange={(e) => setIcpEditor({ ...icpEditor, exclusion_rules_json: e.target.value })} className="h-28 resize-none font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Custom fields (JSON)</Label>
                      <Textarea value={icpEditor.custom_fields_json ?? "{}"} onChange={(e) => setIcpEditor({ ...icpEditor, custom_fields_json: e.target.value })} className="h-28 resize-none font-mono text-xs" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button size="sm" onClick={handleSaveIcp} disabled={upsertIcpCategory.isPending}>
                      <Save className="mr-2 h-4 w-4" /> Save ICP Category
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border bg-background p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-medium">Offer catalog</h4>
                      <p className="text-xs text-muted-foreground">Products and services must stay explicit and never be invented in prompts.</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => resetOfferEditor()}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> New Offer
                    </Button>
                  </div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {offerCatalog.map((item) => (
                      <Button
                        key={item.id}
                        size="sm"
                        variant={offerEditor.id === item.id ? "default" : "outline"}
                        className="h-7 text-[11px]"
                        onClick={() =>
                          resetOfferEditor({
                            ...item,
                            base_price: item.base_price ?? "",
                            applicable_channels_csv: (item.applicable_channels ?? []).join(", "),
                          })
                        }
                      >
                        {item.name}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Name</Label>
                      <Input value={offerEditor.name ?? ""} onChange={(e) => setOfferEditor({ ...offerEditor, name: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Type</Label>
                      <select className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" value={offerEditor.type ?? "product"} onChange={(e) => setOfferEditor({ ...offerEditor, type: e.target.value })}>
                        <option value="product">Product</option>
                        <option value="service">Service</option>
                        <option value="subscription">Subscription</option>
                        <option value="bundle">Bundle</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Category</Label>
                      <Input value={offerEditor.category ?? ""} onChange={(e) => setOfferEditor({ ...offerEditor, category: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Pricing model</Label>
                      <Input value={offerEditor.pricing_model ?? ""} onChange={(e) => setOfferEditor({ ...offerEditor, pricing_model: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Base price</Label>
                      <Input value={offerEditor.base_price ?? ""} onChange={(e) => setOfferEditor({ ...offerEditor, base_price: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Currency</Label>
                      <Input value={offerEditor.currency ?? ""} onChange={(e) => setOfferEditor({ ...offerEditor, currency: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs">Description</Label>
                      <Textarea value={offerEditor.description ?? ""} onChange={(e) => setOfferEditor({ ...offerEditor, description: e.target.value })} className="h-20 resize-none text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Applicable channels (comma separated)</Label>
                      <Input value={offerEditor.applicable_channels_csv ?? ""} onChange={(e) => setOfferEditor({ ...offerEditor, applicable_channels_csv: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Default CTA</Label>
                      <Input value={offerEditor.default_cta ?? ""} onChange={(e) => setOfferEditor({ ...offerEditor, default_cta: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Delivery method</Label>
                      <Input value={offerEditor.delivery_method ?? ""} onChange={(e) => setOfferEditor({ ...offerEditor, delivery_method: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Landing URL</Label>
                      <Input value={offerEditor.landing_url ?? ""} onChange={(e) => setOfferEditor({ ...offerEditor, landing_url: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Priority score</Label>
                      <Input type="number" value={offerEditor.priority_score ?? 0} onChange={(e) => setOfferEditor({ ...offerEditor, priority_score: Number(e.target.value || 0) })} className="h-9" />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="text-sm">Active offer</div>
                        <Switch checked={Boolean(offerEditor.active ?? true)} onCheckedChange={(checked) => setOfferEditor({ ...offerEditor, active: checked })} />
                      </div>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="text-sm">Discount allowed</div>
                        <Switch checked={Boolean(offerEditor.discount_allowed)} onCheckedChange={(checked) => setOfferEditor({ ...offerEditor, discount_allowed: checked })} />
                      </div>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="text-sm">Approval required</div>
                        <Switch checked={Boolean(offerEditor.approval_required)} onCheckedChange={(checked) => setOfferEditor({ ...offerEditor, approval_required: checked })} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button size="sm" onClick={handleSaveOffer} disabled={upsertOfferCatalogItem.isPending}>
                      <Save className="mr-2 h-4 w-4" /> Save Offer
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border bg-background p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-medium">Seasonality profiles</h4>
                      <p className="text-xs text-muted-foreground">Demand truth must come from config, not model intuition.</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => resetSeasonalityEditor()}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> New Profile
                    </Button>
                  </div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {displaySeasonalityProfiles.map((profile) => (
                      <Button
                        key={profile.id}
                        size="sm"
                        variant={seasonalityEditor.id === profile.id ? "default" : "outline"}
                        className="h-7 text-[11px]"
                        onClick={() =>
                          resetSeasonalityEditor({
                            ...profile,
                            seasonality_periods_json: JSON.stringify(profile.seasonality_periods ?? [], null, 2),
                          })
                        }
                      >
                        {profile.name}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Profile name</Label>
                      <Input value={seasonalityEditor.name ?? ""} onChange={(e) => setSeasonalityEditor({ ...seasonalityEditor, name: e.target.value })} className="h-9" />
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div className="text-sm">Active profile</div>
                      <Switch checked={Boolean(seasonalityEditor.active ?? true)} onCheckedChange={(checked) => setSeasonalityEditor({ ...seasonalityEditor, active: checked })} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs">Description</Label>
                      <Textarea value={seasonalityEditor.description ?? ""} onChange={(e) => setSeasonalityEditor({ ...seasonalityEditor, description: e.target.value })} className="h-20 resize-none text-sm" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs">Seasonality periods (JSON array)</Label>
                      <Textarea value={seasonalityEditor.seasonality_periods_json ?? "[]"} onChange={(e) => setSeasonalityEditor({ ...seasonalityEditor, seasonality_periods_json: e.target.value })} className="h-40 resize-none font-mono text-xs" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button size="sm" onClick={handleSaveSeasonality} disabled={upsertSeasonalityProfile.isPending}>
                      <Save className="mr-2 h-4 w-4" /> Save Seasonality
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-lg border bg-background p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-medium">Discount policies</h4>
                        <p className="text-xs text-muted-foreground">Discount rules stay explicit and bounded.</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => resetDiscountEditor()}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> New Policy
                      </Button>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {discountPolicies.map((policy) => (
                        <Button
                          key={policy.id}
                          size="sm"
                          variant={discountEditor.id === policy.id ? "default" : "outline"}
                          className="h-7 text-[11px]"
                          onClick={() =>
                            resetDiscountEditor({
                              ...policy,
                              allowed_discount_types_csv: (policy.allowed_discount_types ?? []).join(", "),
                              allowed_conditions_json: toJsonText(policy.allowed_conditions),
                              forbidden_conditions_json: toJsonText(policy.forbidden_conditions),
                            })
                          }
                        >
                          {policy.name}
                        </Button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Policy name</Label>
                        <Input value={discountEditor.name ?? ""} onChange={(e) => setDiscountEditor({ ...discountEditor, name: e.target.value })} className="h-9" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Max discount %</Label>
                          <Input type="number" value={discountEditor.max_discount_percent ?? 0} onChange={(e) => setDiscountEditor({ ...discountEditor, max_discount_percent: Number(e.target.value || 0) })} className="h-9" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Cooldown days</Label>
                          <Input type="number" value={discountEditor.cooldown_days ?? 0} onChange={(e) => setDiscountEditor({ ...discountEditor, cooldown_days: Number(e.target.value || 0) })} className="h-9" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Allowed discount types (comma separated)</Label>
                        <Input value={discountEditor.allowed_discount_types_csv ?? ""} onChange={(e) => setDiscountEditor({ ...discountEditor, allowed_discount_types_csv: e.target.value })} className="h-9" />
                      </div>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="text-sm">Stacking allowed</div>
                        <Switch checked={Boolean(discountEditor.stacking_allowed)} onCheckedChange={(checked) => setDiscountEditor({ ...discountEditor, stacking_allowed: checked })} />
                      </div>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="text-sm">Approval required</div>
                        <Switch checked={Boolean(discountEditor.approval_required ?? true)} onCheckedChange={(checked) => setDiscountEditor({ ...discountEditor, approval_required: checked })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Allowed conditions (JSON)</Label>
                        <Textarea value={discountEditor.allowed_conditions_json ?? "{}"} onChange={(e) => setDiscountEditor({ ...discountEditor, allowed_conditions_json: e.target.value })} className="h-24 resize-none font-mono text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Forbidden conditions (JSON)</Label>
                        <Textarea value={discountEditor.forbidden_conditions_json ?? "{}"} onChange={(e) => setDiscountEditor({ ...discountEditor, forbidden_conditions_json: e.target.value })} className="h-24 resize-none font-mono text-xs" />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button size="sm" onClick={handleSaveDiscount} disabled={upsertDiscountPolicy.isPending}>
                        <Save className="mr-2 h-4 w-4" /> Save Discount Policy
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-background p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-medium">Outreach policies</h4>
                        <p className="text-xs text-muted-foreground">Contact cadence and channel rules stay policy-driven.</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => resetOutreachEditor()}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> New Policy
                      </Button>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {outreachPolicies.map((policy) => (
                        <Button
                          key={policy.id}
                          size="sm"
                          variant={outreachEditor.id === policy.id ? "default" : "outline"}
                          className="h-7 text-[11px]"
                          onClick={() =>
                            resetOutreachEditor({
                              ...policy,
                              channel_rules_json: toJsonText(policy.channel_rules),
                            })
                          }
                        >
                          {policy.name}
                        </Button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Policy name</Label>
                        <Input value={outreachEditor.name ?? ""} onChange={(e) => setOutreachEditor({ ...outreachEditor, name: e.target.value })} className="h-9" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Min ICP fit</Label>
                          <Input type="number" value={outreachEditor.min_icp_fit_score ?? 0} onChange={(e) => setOutreachEditor({ ...outreachEditor, min_icp_fit_score: Number(e.target.value || 0) })} className="h-9" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Min trigger confidence</Label>
                          <Input type="number" value={outreachEditor.min_trigger_confidence ?? 0} onChange={(e) => setOutreachEditor({ ...outreachEditor, min_trigger_confidence: Number(e.target.value || 0) })} className="h-9" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Negative signal suppression (days)</Label>
                          <Input type="number" value={outreachEditor.negative_signal_suppression_days ?? 7} onChange={(e) => setOutreachEditor({ ...outreachEditor, negative_signal_suppression_days: Number(e.target.value || 0) })} className="h-9" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">7-day contact cap</Label>
                          <Input type="number" value={outreachEditor.max_contacts_per_7d ?? 0} onChange={(e) => setOutreachEditor({ ...outreachEditor, max_contacts_per_7d: Number(e.target.value || 0) })} className="h-9" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs">30-day contact cap</Label>
                          <Input type="number" value={outreachEditor.max_contacts_per_30d ?? 0} onChange={(e) => setOutreachEditor({ ...outreachEditor, max_contacts_per_30d: Number(e.target.value || 0) })} className="h-9" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Channel rules (JSON)</Label>
                        <Textarea value={outreachEditor.channel_rules_json ?? "{}"} onChange={(e) => setOutreachEditor({ ...outreachEditor, channel_rules_json: e.target.value })} className="h-32 resize-none font-mono text-xs" />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button size="sm" onClick={handleSaveOutreach} disabled={upsertOutreachPolicy.isPending}>
                        <Save className="mr-2 h-4 w-4" /> Save Outreach Policy
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="overflow-hidden rounded-xl border border-border bg-card px-0 shadow-none">
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2 text-foreground/70"><MessageSquare className="h-4 w-4" /></div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold">Brand Voice</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">Instructions for the AI copywriter</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-1">
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Tone & Personality</Label>
                      <Textarea value={brandData.tone} onChange={(e) => setBrandData({ ...brandData, tone: e.target.value })} className="h-24 resize-none text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Target Audience</Label>
                      <Textarea value={brandData.target_audience} onChange={(e) => setBrandData({ ...brandData, target_audience: e.target.value })} className="h-24 resize-none text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Always Say (Keywords)</Label>
                      <TagInput value={brandData.always_say || []} onChange={(v) => setBrandData({ ...brandData, always_say: v })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Never Say (Banned Words)</Label>
                      <TagInput value={brandData.never_say || []} onChange={(v) => setBrandData({ ...brandData, never_say: v })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Preferred Call-to-Action</Label>
                    <Input value={brandData.preferred_cta} onChange={(e) => setBrandData({ ...brandData, preferred_cta: e.target.value })} className="h-9" />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1 text-xs font-semibold text-green-700"><Check className="h-3 w-3" /> Good Post Example</Label>
                      <Textarea value={brandData.good_post_example} onChange={(e) => setBrandData({ ...brandData, good_post_example: e.target.value })} className="h-32 resize-none border-l-4 border-l-green-500 bg-green-50/30 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1 text-xs font-semibold text-red-700"><AlertCircle className="h-3 w-3" /> Bad Post Example</Label>
                      <Textarea value={brandData.bad_post_example} onChange={(e) => setBrandData({ ...brandData, bad_post_example: e.target.value })} className="h-32 resize-none border-l-4 border-l-red-500 bg-red-50/30 text-sm" />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Approved Hashtags <span className="text-muted-foreground">(max 6)</span></Label>
                      <TagInput value={brandData.hashtags || []} onChange={(v) => setBrandData({ ...brandData, hashtags: v.slice(0, 6) })} />
                      <p className="text-[11px] text-muted-foreground">Used verbatim in copy — the AI will not invent hashtags outside this list.</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Post Format Preference</Label>
                      <select
                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                        value={brandData.post_format_preference || ""}
                        onChange={(e) => setBrandData({ ...brandData, post_format_preference: e.target.value })}
                      >
                        <option value="">Not specified</option>
                        <option value="short-prose">Short prose (1–2 sentences)</option>
                        <option value="medium-prose">Medium prose (2–4 sentences)</option>
                        <option value="long-prose">Long prose (5+ sentences)</option>
                        <option value="bullets">Bullet points</option>
                        <option value="short-bullets">Short with bullets</option>
                      </select>
                      <p className="text-[11px] text-muted-foreground">Guides the copy writer's default formatting across all platforms.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button size="sm" onClick={() => handleSave("brand_voice", brandData)} disabled={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" /> Save Brand Voice
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2b" className="overflow-hidden rounded-xl border border-border bg-card px-0 shadow-none">
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2 text-foreground/70"><Palette className="h-4 w-4" /></div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold">Visual Brand</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">Colors, fonts, and design rules injected into every campaign design brief</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-1">
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[
                      { key: "primary_color", label: "Primary Color" },
                      { key: "secondary_color", label: "Secondary Color" },
                      { key: "accent_color", label: "Accent Color" },
                      { key: "background_color", label: "Background" },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-2">
                        <Label className="text-xs">{label}</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={visualData[key] || "#000000"}
                            onChange={(e) => setVisualData({ ...visualData, [key]: e.target.value })}
                            className="h-9 w-9 cursor-pointer rounded border border-input p-0.5"
                          />
                          <Input
                            value={visualData[key] || ""}
                            onChange={(e) => setVisualData({ ...visualData, [key]: e.target.value })}
                            placeholder="#hex"
                            className="h-9 font-mono text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Heading Font</Label>
                      <Input value={visualData.font_heading || ""} onChange={(e) => setVisualData({ ...visualData, font_heading: e.target.value })} placeholder="e.g. Montserrat Bold" className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Body Font</Label>
                      <Input value={visualData.font_body || ""} onChange={(e) => setVisualData({ ...visualData, font_body: e.target.value })} placeholder="e.g. Inter Regular" className="h-9" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Logo Usage Rules</Label>
                      <Textarea value={visualData.logo_usage_rules || ""} onChange={(e) => setVisualData({ ...visualData, logo_usage_rules: e.target.value })} placeholder="e.g. Top-left corner, min 40px, white or dark backgrounds only, no distortion" className="h-20 resize-none text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Visual Style Direction</Label>
                      <Textarea value={visualData.visual_style || ""} onChange={(e) => setVisualData({ ...visualData, visual_style: e.target.value })} placeholder="e.g. Flat illustration with bold colors, minimal whitespace, high contrast" className="h-20 resize-none text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Photography Style</Label>
                      <Textarea value={visualData.photography_style || ""} onChange={(e) => setVisualData({ ...visualData, photography_style: e.target.value })} placeholder="e.g. Real students, natural light, no stock photos, candid study moments" className="h-20 resize-none text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Layout Preference</Label>
                      <Textarea value={visualData.layout_preference || ""} onChange={(e) => setVisualData({ ...visualData, layout_preference: e.target.value })} placeholder="e.g. Mobile-first, key info above fold, CTA at bottom right" className="h-20 resize-none text-sm" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Logo File Location <span className="text-muted-foreground">(optional)</span></Label>
                    <Input
                      value={visualData.logo_file_note || ""}
                      onChange={(e) => setVisualData({ ...visualData, logo_file_note: e.target.value })}
                      placeholder="e.g. TSH_Logo_White.png — Google Drive /Brand Assets/"
                      className="h-9"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Injected into design briefs so designers know where to find the logo file. Upload to Canva manually — logo file uploads require M-vision.
                    </p>
                  </div>

                  <div className="rounded-md border bg-background p-4">
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Social Handles &amp; Links</div>
                    <p className="mb-4 text-[11px] text-muted-foreground">
                      Injected into every design brief so Canva AI can place accurate social icons and handles. Also used for QR code generation.
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[
                        { key: "youtube", label: "YouTube", placeholder: "@yourchannel" },
                        { key: "facebook", label: "Facebook", placeholder: "Your page name" },
                        { key: "whatsapp", label: "WhatsApp", placeholder: "+260 97X XXXXXX or wa.me link" },
                        { key: "instagram", label: "Instagram", placeholder: "@yourbrand" },
                        { key: "tiktok", label: "TikTok", placeholder: "@yourbrand" },
                        { key: "custom_app_url", label: "Product / Landing Page", placeholder: "https://yourapp.example.com" },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-xs">{label}</Label>
                          <Input
                            value={(visualData.social_handles ?? {})[key] || ""}
                            onChange={(e) => setVisualData({
                              ...visualData,
                              social_handles: { ...(visualData.social_handles ?? {}), [key]: e.target.value }
                            })}
                            placeholder={placeholder}
                            className="h-9"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <Label className="text-xs">Primary CTA URL <span className="text-muted-foreground">(QR code destination)</span></Label>
                      <Input
                        value={visualData.primary_cta_url || ""}
                        onChange={(e) => setVisualData({ ...visualData, primary_cta_url: e.target.value })}
                        placeholder="https://yourbrand.example.com"
                        className="h-9"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        The single link all QR codes and design CTAs will point to. Override per-campaign in the design brief if needed.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Markdown Design Spec <span className="text-muted-foreground">(optional — freeform, injected verbatim)</span></Label>
                    <Textarea
                      value={visualData.markdown_design_spec || ""}
                      onChange={(e) => setVisualData({ ...visualData, markdown_design_spec: e.target.value })}
                      placeholder="Write any additional design instructions in plain text or markdown. This is appended verbatim to every design brief."
                      className="h-32 resize-none font-mono text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Use this for seasonal overrides, special event styling rules, or anything not captured by the structured fields above.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button size="sm" onClick={handleSaveVisualBrand} disabled={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" /> Save Visual Brand
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="overflow-hidden rounded-xl border border-border bg-card px-0 shadow-none">
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2 text-foreground/70"><Share2 className="h-4 w-4" /></div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold">Connections & Modules</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">Manage connected channels and optional workspace modules</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-1">
                <div className="mb-4 rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
                  Facebook publishing credentials for `M13A` can be stored here. Other live providers remain toggle-only until their milestone slices.
                </div>

                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Active channels</div>
                <div className="mb-5 space-y-2">
                  {INTEGRATIONS.filter((p) => p.live).map(({ id, name, Icon, color }) => {
                    const isConnected = !!platformConnections[id];
                    const isFacebook = id === "facebook";
                    const hasFacebookCredentials = !!facebookCredentials.page_id && !!facebookCredentials.access_token;
                    const connectedFacebookPageName = String((platformConnections.facebook?.page_name ?? "") || "");
                    return (
                      <div key={id} className="rounded-lg border bg-background">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <Icon style={{ color }} className="h-5 w-5 shrink-0" />
                            <span className="text-sm font-medium">{name}</span>
                            {isConnected ? (
                              <Badge variant="outline" className="h-5 border-green-200 bg-green-50 px-1.5 text-[10px] text-green-700">Connected</Badge>
                            ) : (
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">Not connected</Badge>
                            )}
                            {isFacebook && isConnected && !hasFacebookCredentials ? (
                              <Badge variant="outline" className="h-5 border-amber-200 bg-amber-50 px-1.5 text-[10px] text-amber-700">Credentials needed</Badge>
                            ) : null}
                          </div>
                          <Switch
                            checked={isConnected}
                            disabled={updateMutation.isPending}
                            onCheckedChange={() => handleToggleConnection(id, isConnected)}
                          />
                        </div>

                        {isFacebook && isConnected ? (
                          <div className="border-t bg-muted/20 px-3 pb-3 pt-3">
                            <div className="mb-3 rounded-md border bg-background p-3 text-[11px] text-muted-foreground">
                              <p className="font-medium text-foreground">Official Facebook connection</p>
                              <p className="mt-1">Connect through the official `samm` Meta app to pull the Page ID and Page Access Token automatically.</p>
                              {connectedFacebookPageName ? (
                                <p className="mt-2 text-foreground/80">Currently linked page: <span className="font-medium">{connectedFacebookPageName}</span></p>
                              ) : null}
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-8 text-xs"
                                  onClick={handleStartFacebookConnect}
                                  disabled={updateMutation.isPending || isConnectingFacebook}
                                >
                                  {isConnectingFacebook ? "Connecting..." : "Connect with samm app"}
                                </Button>
                              </div>
                            </div>

                            {facebookPages.length > 1 ? (
                              <div className="mb-3 rounded-md border bg-background p-3">
                                <Label className="text-[11px]">Choose connected Facebook Page</Label>
                                <select
                                  value={selectedFacebookPageId}
                                  onChange={(e) => setSelectedFacebookPageId(e.target.value)}
                                  className="mt-2 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                                >
                                  {facebookPages.map((page) => (
                                    <option key={page.id} value={page.id}>
                                      {page.name}
                                    </option>
                                  ))}
                                </select>
                                <div className="mt-3 flex justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs"
                                    onClick={handleUseSelectedFacebookPage}
                                    disabled={updateMutation.isPending || !selectedFacebookPageId}
                                  >
                                    <Check className="mr-1.5 h-3.5 w-3.5" /> Use selected page
                                  </Button>
                                </div>
                              </div>
                            ) : null}

                            <p className="mb-3 text-[11px] text-muted-foreground">Manual fallback: enter the Facebook Page ID and Page Access Token used for live publishing.</p>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label className="text-[11px]">Page ID</Label>
                                <Input
                                  value={facebookCredentials.page_id}
                                  onChange={(e) => setFacebookCredentials((current) => ({ ...current, page_id: e.target.value }))}
                                  placeholder="123456789012345"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px]">Page Access Token</Label>
                                <Input
                                  type="password"
                                  value={facebookCredentials.access_token}
                                  onChange={(e) => setFacebookCredentials((current) => ({ ...current, access_token: e.target.value }))}
                                  placeholder="EAAG..."
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSaveFacebookCredentials} disabled={updateMutation.isPending}>
                                <Save className="mr-1.5 h-3.5 w-3.5" /> Save Facebook credentials
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Optional modules</div>
                <div className="mb-5 space-y-2">
                  {[
                    {
                      id: "ambassadors",
                      name: "Ambassadors",
                      description: "Turn on ambassador management and related workspace surfaces.",
                    },
                    {
                      id: "affiliates",
                      name: "Affiliates",
                      description: "Reserve this module for future affiliate and referral workflows. No live automation is attached yet.",
                    },
                  ].map((module) => {
                    const enabled = isModuleEnabled(module.id);
                    return (
                      <div key={module.id} className="flex items-center justify-between rounded-lg border bg-background p-3">
                        <div className="pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{module.name}</span>
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">
                              {enabled ? "Active" : "Hidden"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{module.description}</p>
                        </div>
                        <Switch
                          checked={enabled}
                          disabled={updateMutation.isPending}
                          onCheckedChange={() => handleToggleModule(module.id, enabled)}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Coming soon</div>
                <div className="space-y-2">
                  {INTEGRATIONS.filter((p) => !p.live).map(({ id, name, Icon, color }) => (
                    <div key={id} className="flex items-center justify-between rounded-lg border border-dashed bg-muted/20 p-3 opacity-60">
                      <div className="flex items-center gap-3">
                        <Icon style={{ color }} className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-medium">{name}</span>
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">Coming soon</Badge>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 w-28 text-xs" disabled>Connect</Button>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="overflow-hidden rounded-xl border border-border bg-card px-0 shadow-none">
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2 text-foreground/70"><GitBranch className="h-4 w-4" /></div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold">Pipeline Automation</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">Configure scheduled AI jobs</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-1">
                <div className="space-y-6">
                  <div className="space-y-4 rounded-lg border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Engagement Pipeline</h4>
                        <p className="text-xs text-muted-foreground">Scans comments and flags escalations</p>
                      </div>
                      <Switch checked={pipelineData.pipeline_a_enabled} onCheckedChange={(v) => setPipelineData({ ...pipelineData, pipeline_a_enabled: v })} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="w-24 text-xs">Run time (Daily)</Label>
                      <Input type="time" value={pipelineData.pipeline_a_run_time} onChange={(e) => setPipelineData({ ...pipelineData, pipeline_a_run_time: e.target.value })} className="h-8 w-32 text-xs" disabled={!pipelineData.pipeline_a_enabled} />
                      <Button size="sm" variant="outline" className="ml-auto h-8 gap-1.5 text-xs" disabled={triggeringPipeline === "a" || !pipelineData.pipeline_a_enabled} onClick={() => handleTriggerPipeline("a", "Engagement pipeline")}>
                        <Play className="h-3 w-3" />{triggeringPipeline === "a" ? "Starting…" : "Run now"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Content Drafting Pipeline</h4>
                        <p className="text-xs text-muted-foreground">Generates weekly social posts for approval</p>
                      </div>
                      <Switch checked={pipelineData.pipeline_b_enabled} onCheckedChange={(v) => setPipelineData({ ...pipelineData, pipeline_b_enabled: v })} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="w-24 text-xs">Run day</Label>
                      <select className="h-8 w-32 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm" value={pipelineData.pipeline_b_run_day} onChange={(e) => setPipelineData({ ...pipelineData, pipeline_b_run_day: e.target.value })} disabled={!pipelineData.pipeline_b_enabled}>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                      </select>
                      <Input type="time" value={pipelineData.pipeline_b_run_time} onChange={(e) => setPipelineData({ ...pipelineData, pipeline_b_run_time: e.target.value })} className="h-8 w-32 text-xs" disabled={!pipelineData.pipeline_b_enabled} />
                      <Button size="sm" variant="outline" className="ml-auto h-8 gap-1.5 text-xs" disabled={triggeringPipeline === "b" || !pipelineData.pipeline_b_enabled} onClick={() => handleTriggerPipeline("b", "Content drafting pipeline")}>
                        <Play className="h-3 w-3" />{triggeringPipeline === "b" ? "Starting…" : "Run now"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Campaign Builder Pipeline</h4>
                        <p className="text-xs text-muted-foreground">End-to-end campaign creation</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" disabled={triggeringPipeline === "c" || !pipelineData.pipeline_c_enabled} onClick={() => handleTriggerPipeline("c", "Campaign builder pipeline")}>
                          <Play className="h-3 w-3" />{triggeringPipeline === "c" ? "Starting…" : "Run now"}
                        </Button>
                        <Switch checked={pipelineData.pipeline_c_enabled} onCheckedChange={(v) => setPipelineData({ ...pipelineData, pipeline_c_enabled: v })} />
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-md border border-amber-100 bg-amber-50/50 p-3">
                      <Switch checked={pipelineData.pipeline_c_auto_approve} onCheckedChange={(v) => setPipelineData({ ...pipelineData, pipeline_c_auto_approve: v })} disabled={!pipelineData.pipeline_c_enabled} />
                      <div>
                        <Label className="text-xs font-semibold text-amber-800">Auto-approve briefs</Label>
                        <p className="mt-0.5 text-[11px] leading-snug text-amber-700/80">
                          Enabling this skips manual approval for campaign briefs. The agent will proceed directly to drafting content.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button size="sm" onClick={() => handleSave("pipeline_config", pipelineData)} disabled={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" /> Save Pipelines
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="overflow-hidden rounded-xl border border-border bg-card px-0 shadow-none">
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2 text-foreground/70"><Target className="h-4 w-4" /></div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold">KPI Targets</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">Goals for the agent to optimize towards</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-1">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                  {[
                    { key: "weekly_signups", label: "Weekly Signups" },
                    { key: "youtube_weekly_growth", label: "YouTube Growth (%)" },
                    { key: "whatsapp_reach_per_post", label: "WhatsApp Reach/Post" },
                    { key: "facebook_reach_per_post", label: "Facebook Reach/Post" },
                    { key: "email_open_rate", label: "Email Open Rate (%)" },
                    ...(isModuleEnabled("ambassadors") ? [{ key: "active_ambassadors", label: "Active Ambassadors" }] : [])
                  ].map((field) => (
                    <div key={field.key} className="flex items-center justify-between border-b border-muted p-3">
                      <Label className="text-xs">{field.label}</Label>
                      <Input type="number" value={kpiData[field.key]} onChange={(e) => setKpiData({ ...kpiData, [field.key]: Number(e.target.value) })} className="h-8 w-24 text-right text-sm font-medium" />
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button size="sm" onClick={() => handleSave("kpi_targets", kpiData)} disabled={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" /> Save Targets
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5b" className="overflow-hidden rounded-xl border border-border bg-card px-0 shadow-none">
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2 text-foreground/70"><ShieldCheck className="h-4 w-4" /></div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold">Campaign Defaults &amp; Approval Rules</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">Baseline campaign behavior and approval boundaries for every workspace</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-1">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-lg border bg-background p-4">
                    <div className="mb-4 text-sm font-medium">Campaign defaults</div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Default duration (days)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={campaignDefaultsData.default_duration_days ?? 14}
                          onChange={(e) =>
                            setCampaignDefaultsData({
                              ...campaignDefaultsData,
                              default_duration_days: Number(e.target.value || 14),
                            })
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Default objective</Label>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                          value={campaignDefaultsData.default_objective ?? "engagement"}
                          onChange={(e) => setCampaignDefaultsData({ ...campaignDefaultsData, default_objective: e.target.value })}
                        >
                          <option value="awareness">Awareness</option>
                          <option value="engagement">Engagement</option>
                          <option value="conversion">Conversion</option>
                          <option value="retention">Retention</option>
                          <option value="announcement">Announcement</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Default CTA style</Label>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                          value={campaignDefaultsData.default_cta_style ?? "educational"}
                          onChange={(e) => setCampaignDefaultsData({ ...campaignDefaultsData, default_cta_style: e.target.value })}
                        >
                          <option value="direct">Direct</option>
                          <option value="soft">Soft</option>
                          <option value="educational">Educational</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Default audience segment</Label>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                          value={campaignDefaultsData.default_icp_category_id ?? ""}
                          onChange={(e) =>
                            setCampaignDefaultsData({
                              ...campaignDefaultsData,
                              default_icp_category_id: e.target.value || null,
                            })
                          }
                        >
                          <option value="">No default segment</option>
                          {icpCategories.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Default channels</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {["facebook", "whatsapp", "youtube", "email"].map((channel) => {
                            const checked = (campaignDefaultsData.default_channels ?? []).includes(channel);
                            return (
                              <label key={channel} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                                <Switch checked={checked} onCheckedChange={(enabled) => toggleDefaultChannel(channel, enabled)} />
                                <span className="capitalize">{channel}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button size="sm" onClick={handleSaveCampaignDefaults} disabled={updateCampaignDefaults.isPending}>
                        <Save className="mr-2 h-4 w-4" /> Save Campaign Defaults
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-background p-4">
                    <div className="mb-4 text-sm font-medium">Approval policy</div>
                    <div className="space-y-3">
                      {[
                        { key: "brief_approval_required", label: "Campaign briefs require approval" },
                        { key: "copy_approval_required", label: "Copy drafts require approval" },
                        { key: "discount_approval_required", label: "Discounts require approval" },
                        { key: "outreach_approval_required", label: "Outreach requires approval" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between rounded-md border p-3">
                          <div className="pr-4 text-sm">{item.label}</div>
                          <Switch
                            checked={Boolean(approvalPolicyData[item.key])}
                            onCheckedChange={(checked) =>
                              setApprovalPolicyData({
                                ...approvalPolicyData,
                                [item.key]: checked,
                              })
                            }
                          />
                        </div>
                      ))}
                      <div className="space-y-2">
                        <Label className="text-xs">Policy notes</Label>
                        <Textarea
                          value={approvalPolicyData.notes ?? ""}
                          onChange={(e) => setApprovalPolicyData({ ...approvalPolicyData, notes: e.target.value })}
                          placeholder="Optional notes about approval boundaries or operator policy."
                          className="h-28 resize-none text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button size="sm" onClick={handleSaveApprovalPolicy} disabled={updateApprovalPolicy.isPending}>
                        <Save className="mr-2 h-4 w-4" /> Save Approval Policy
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}


