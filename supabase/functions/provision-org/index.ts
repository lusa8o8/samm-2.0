import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function hasOrgRow(adminClient: any, table: string, orgId: string) {
  const { data, error } = await adminClient
    .from(table)
    .select('org_id')
    .eq('org_id', orgId)
    .limit(1)

  if (error) throw new Error(error.message)
  return Array.isArray(data) && data.length > 0
}

async function insertIfMissing(adminClient: any, table: string, payload: Record<string, unknown>) {
  const orgId = String(payload.org_id ?? '')
  if (!orgId) throw new Error(`Missing org_id for ${table}`)
  if (await hasOrgRow(adminClient, table, orgId)) return

  const { error } = await adminClient.from(table).insert(payload)
  if (error) throw new Error(error.message)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { userId, email } = body

    // Service role client — can write app_metadata and bypass RLS
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return jsonResponse({ error: 'Authentication is required to create a workspace.' }, 401)
    }

    const { data: userRecord, error: userLookupError } = await adminClient.auth.getUser(token)
    if (userLookupError || !userRecord?.user) {
      return jsonResponse({ error: userLookupError?.message ?? 'User not found' }, 401)
    }

    if (userId && userRecord.user.id !== userId) {
      return jsonResponse({ error: 'Workspace user does not match the active session.' }, 403)
    }

    const normalizedEmail = String(email ?? userRecord.user.email ?? '').trim().toLowerCase()
    if (!normalizedEmail) {
      return jsonResponse({ error: 'A work email is required to create a workspace.' }, 400)
    }

    const existingUserOrgId =
      typeof userRecord.user.app_metadata?.org_id === 'string' && userRecord.user.app_metadata.org_id.trim()
        ? userRecord.user.app_metadata.org_id.trim()
        : null

    const { data: existingEmailOrg, error: existingEmailOrgError } = await adminClient
      .from('org_config')
      .select('org_id')
      .eq('contact_email', normalizedEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingEmailOrgError) {
      return jsonResponse({ error: existingEmailOrgError.message }, 500)
    }

    const orgId = existingUserOrgId ?? existingEmailOrg?.org_id ?? crypto.randomUUID()

    // Create default org_config row
    const defaultConfig = {
      org_id: orgId,
      org_name: normalizedEmail.split('@')[0],
      full_name: '',
      country: '',
      timezone: 'Africa/Lusaka',
      contact_email: normalizedEmail,
      brand_voice: {
        tone: 'professional',
        target_audience: '',
        always_say: [],
        never_say: [],
        preferred_cta: 'Learn more',
        good_post_example: '',
        bad_post_example: '',
      },
      platform_connections: {},
      pipeline_config: {
        pipeline_a_enabled: true,
        pipeline_a_run_time: '08:00',
        pipeline_b_enabled: false,
        pipeline_b_run_day: 'monday',
        pipeline_b_run_time: '09:00',
        pipeline_c_enabled: true,
        pipeline_c_auto_approve: false,
      },
      kpi_targets: {
        engagement_rate: 5,
        reach: 10000,
        conversions: 100,
      },
    }

    const defaultCampaignDefaults = {
      org_id: orgId,
      default_duration_days: 14,
      default_channels: ['facebook', 'whatsapp', 'youtube', 'email'],
      default_objective: 'engagement',
      default_cta_style: 'educational',
      default_icp_category_id: null,
    }

    const defaultApprovalPolicy = {
      org_id: orgId,
      brief_approval_required: true,
      copy_approval_required: true,
      discount_approval_required: true,
      outreach_approval_required: true,
      notes: '',
    }

    const defaultOutreachPolicy = {
      org_id: orgId,
      name: 'Default Outreach Policy',
      min_icp_fit_score: 0,
      min_trigger_confidence: 0,
      negative_signal_suppression_days: 7,
      max_contacts_per_7d: 3,
      max_contacts_per_30d: 8,
      channel_rules: {
        email: {
          enabled: true,
          quiet_hours: ['21:00-07:00'],
        },
        whatsapp: {
          enabled: true,
          quiet_hours: ['20:00-08:00'],
        },
      },
    }

    const defaultBilling = {
      org_id: orgId,
      status: 'inactive',
      cancel_at_period_end: false,
    }

    await insertIfMissing(adminClient, 'org_config', defaultConfig)
    await insertIfMissing(adminClient, 'campaign_defaults', defaultCampaignDefaults)
    await insertIfMissing(adminClient, 'approval_policy', defaultApprovalPolicy)
    await insertIfMissing(adminClient, 'outreach_policy', defaultOutreachPolicy)

    await insertIfMissing(adminClient, 'org_billing', defaultBilling)

    // Stamp org_id into the user's app_metadata so it's in the JWT
    const { error: metaError } = await adminClient.auth.admin.updateUserById(userRecord.user.id, {
      app_metadata: { ...(userRecord.user.app_metadata ?? {}), org_id: orgId },
    })

    if (metaError) {
      console.error('app_metadata update failed:', metaError)
      return jsonResponse({ error: metaError.message }, 500)
    }

    return jsonResponse({ ok: true, org_id: orgId, existing: Boolean(existingUserOrgId || existingEmailOrg?.org_id) })
  } catch (err) {
    console.error('provision-org error:', err)
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
