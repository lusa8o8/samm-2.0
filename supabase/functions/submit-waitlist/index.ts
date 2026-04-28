import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type WaitlistPayload = {
  full_name?: string
  email?: string
  organization_name?: string
  role?: string
  team_size?: string
  channels?: string[]
  primary_use_case?: string
  biggest_workflow_pain?: string
  source?: string
}

function sanitizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeChannels(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
    .slice(0, 8)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as WaitlistPayload

    const fullName = sanitizeText(body.full_name)
    const email = sanitizeText(body.email).toLowerCase()
    const organizationName = sanitizeText(body.organization_name)
    const role = sanitizeText(body.role)
    const teamSize = sanitizeText(body.team_size)
    const primaryUseCase = sanitizeText(body.primary_use_case)
    const biggestWorkflowPain = sanitizeText(body.biggest_workflow_pain)
    const source = sanitizeText(body.source) || 'website'
    const channels = normalizeChannels(body.channels)

    if (!fullName || !email || !primaryUseCase || !biggestWorkflowPain) {
      return new Response(JSON.stringify({ error: 'Missing required waitlist fields.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: existing, error: existingError } = await adminClient
      .from('waitlist_leads')
      .select('id, status')
      .eq('email', email)
      .maybeSingle()

    if (existingError) {
      return new Response(JSON.stringify({ error: existingError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const nextStatus =
      existing?.status && ['approved', 'onboarded'].includes(existing.status)
        ? existing.status
        : 'pending'

    const row = {
      full_name: fullName,
      email,
      organization_name: organizationName || null,
      role: role || null,
      team_size: teamSize || null,
      channels,
      primary_use_case: primaryUseCase,
      biggest_workflow_pain: biggestWorkflowPain,
      source,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await adminClient
      .from('waitlist_leads')
      .upsert(row, { onConflict: 'email' })
      .select('id, status')
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, id: data.id, status: data.status }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
