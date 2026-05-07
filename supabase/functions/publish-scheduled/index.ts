import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { publishDueContentRows } from '../_shared/publish-content.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function bearerToken(req: Request) {
  const value = req.headers.get('Authorization') ?? ''
  const match = value.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json().catch(() => ({})) as { content_id?: unknown }
    const contentId = typeof body.content_id === 'string' ? body.content_id.trim() : ''
    let orgId: string | null = null

    if (contentId) {
      const token = bearerToken(req)
      if (!token) {
        return jsonResponse({ ok: false, error: 'authentication_required' }, 401)
      }

      const { data: userData, error: userError } = await supabase.auth.getUser(token)
      if (userError || !userData.user) {
        return jsonResponse({ ok: false, error: 'invalid_user_token' }, 401)
      }

      orgId = typeof userData.user.app_metadata?.org_id === 'string'
        ? userData.user.app_metadata.org_id
        : null

      if (!orgId) {
        return jsonResponse({ ok: false, error: 'workspace_not_found' }, 403)
      }
    }

    const nowIso = new Date().toISOString()
    let query = supabase
      .from('content_registry')
      .select('id, org_id, platform, body, subject_line, media_url, scheduled_at, status, metadata, is_campaign_post, campaign_name, pipeline_run_id')
      .in('status', ['scheduled', 'approved'])
      .lte('scheduled_at', nowIso)
      .neq('platform', 'design_brief')
      .order('scheduled_at', { ascending: true })
      .limit(50)

    if (contentId) {
      query = query.eq('id', contentId).eq('org_id', orgId)
    }

    const { data: rows, error } = await query

    if (error) throw new Error(`Failed to load scheduled content: ${error.message}`)

    if (!rows || rows.length === 0) {
      return jsonResponse({ ok: true, published: 0, failed: 0, skipped: 0, message: 'No scheduled posts ready to publish' })
    }

    const summary = await publishDueContentRows({
      supabase,
      rows,
      claimPrefix: 'publish-scheduled',
    })

    return jsonResponse({
      ok: true,
      ...summary,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('publish-scheduled failed:', message)
    return jsonResponse({ ok: false, error: message }, 500)
  }
})
