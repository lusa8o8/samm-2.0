import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { userId, email } = body

    if (!userId || !email) {
      return new Response(JSON.stringify({ error: 'userId and email are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Service role client — can write app_metadata and bypass RLS
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Generate a new org_id for this user
    const orgId = crypto.randomUUID()

    // Create default org_config row
    const defaultConfig = {
      org_id: orgId,
      org_name: email.split('@')[0],
      full_name: '',
      country: '',
      timezone: 'Africa/Lusaka',
      contact_email: email,
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
        pipeline_b_enabled: true,
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

    const { error: configError } = await adminClient
      .from('org_config')
      .insert(defaultConfig)

    if (configError) {
      console.error('org_config insert failed:', configError)
      return new Response(JSON.stringify({ error: configError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Stamp org_id into the user's app_metadata so it's in the JWT
    const { error: metaError } = await adminClient.auth.admin.updateUserById(userId, {
      app_metadata: { org_id: orgId },
    })

    if (metaError) {
      console.error('app_metadata update failed:', metaError)
      return new Response(JSON.stringify({ error: metaError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, org_id: orgId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('provision-org error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
