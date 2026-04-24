import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  expireStaleRuns,
  resolveExplicitSchedulerRequest,
  type ChatHistoryItem,
  type ChatResponse,
  type ConversationMode,
} from '../coordinator-chat/scheduler.ts'
import { ensureDashboardMemoryContext } from '../_shared/samm-memory.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: ChatResponse | { error: string }, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

async function proxyToLegacyCoordinatorChat(
  supabase: any,
  params: {
    accessToken: string
    message: string
    history: ChatHistoryItem[]
    mode: ConversationMode
    confirmationAction?: string | null
    action?: Record<string, unknown> | null
    orgId: string
  },
) {
  const { data, error } = await supabase.functions.invoke('coordinator-chat', {
    body: {
      message: params.message,
      history: params.history,
      mode: params.mode,
      confirmationAction: params.confirmationAction ?? null,
      action: params.action ?? null,
      orgId: params.orgId,
    },
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  })

  if (error) {
    throw new Error(`Legacy coordinator proxy failed: ${error.message}`)
  }

  return data as ChatResponse
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Missing Supabase credentials in function environment')
    }

    const authHeader = req.headers.get('Authorization')
    const accessToken = authHeader?.replace(/^Bearer\s+/i, '')

    if (!accessToken) {
      return jsonResponse({ error: 'Missing bearer token' }, 401)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const authClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    })
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: userError?.message ?? 'Unauthorized' }, 401)
    }

    const body = await req.json().catch(() => ({}))
    const message = String(body?.message ?? '').trim()
    const history = Array.isArray(body?.history) ? (body.history as ChatHistoryItem[]) : []
    const mode: ConversationMode = body?.mode === 'planning' ? 'planning' : 'execution'
    const confirmationAction = body?.confirmationAction ? String(body.confirmationAction) : null
    const action =
      body?.action && typeof body.action === 'object' && !Array.isArray(body.action)
        ? (body.action as Record<string, unknown>)
        : null
    const orgId = user.app_metadata?.org_id ?? body?.orgId

    if (!orgId || typeof orgId !== 'string') {
      return jsonResponse({ error: 'Missing org context' }, 400)
    }

    if (!message && !action) {
      return jsonResponse({ error: 'Message is required' }, 400)
    }

    if (action) {
      const proxied = await proxyToLegacyCoordinatorChat(supabase, {
        accessToken,
        message:
          message ||
          String(action.topic ?? action.title ?? action.type ?? 'coordinator action'),
        history,
        mode,
        confirmationAction,
        action,
        orgId,
      })

      return jsonResponse(proxied)
    }

    const { data: runsData, error: runsError } = await supabase
      .from('pipeline_runs')
      .select('*')
      .eq('org_id', orgId)
      .order('started_at', { ascending: false })
      .limit(8)

    if (runsError) {
      throw new Error(`Failed to load pipeline runs: ${runsError.message}`)
    }

    const activeRuns = await expireStaleRuns(supabase, runsData ?? [])
    const memoryContext = await ensureDashboardMemoryContext(supabase, {
      orgId,
      userId: user.id,
      message,
    })

    const explicitSchedulerResult = await resolveExplicitSchedulerRequest({
      supabase,
      orgId,
      userId: user.id,
      message,
      mode,
      confirmationAction,
      runs: activeRuns,
      memoryContext,
    })

    if (explicitSchedulerResult) {
      return jsonResponse(explicitSchedulerResult)
    }

    const proxied = await proxyToLegacyCoordinatorChat(supabase, {
      accessToken,
      message,
      history,
      mode,
      confirmationAction,
      action: null,
      orgId,
    })

    return jsonResponse(proxied)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return jsonResponse({ error: message }, 500)
  }
})
