import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Platform = 'facebook' | 'instagram'

type PlatformConnection = {
  connected?: boolean
  access_token?: string
  page_id?: string
  pageId?: string
  account_id?: string
  ig_user_id?: string
  instagram_business_account_id?: string
}

type MetricSnapshot = {
  platform: Platform
  external_account_id: string
  followers: number | null
  post_reach: number | null
  reach: number | null
  engagement: number | null
  engagement_rate: number | null
  clicks: number | null
  conversions: number | null
  signups: number | null
  raw_payload: Record<string, unknown>
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function safeString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function percentChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null
  if (previous === 0) return current > 0 ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

function engagementRate(engagement: number | null, reach: number | null): number | null {
  if (engagement === null || reach === null || reach <= 0) return null
  return Number(((engagement / reach) * 100).toFixed(2))
}

function graphBaseUrl() {
  const version = safeString(Deno.env.get('META_GRAPH_VERSION'))
  return version ? `https://graph.facebook.com/${version}` : 'https://graph.facebook.com'
}

async function fetchMetaJson(path: string, params: Record<string, string>) {
  const url = new URL(`${graphBaseUrl()}/${path.replace(/^\/+/, '')}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url)
  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = json?.error?.message ?? `Meta Graph request failed with ${response.status}`
    throw new Error(message)
  }

  return json
}

function latestInsightValue(payload: any, metricName: string): number | null {
  const metric = Array.isArray(payload?.data)
    ? payload.data.find((item: any) => item?.name === metricName)
    : null
  const values = Array.isArray(metric?.values) ? metric.values : []
  if (values.length === 0) return null
  return asNumber(values[values.length - 1]?.value)
}

async function fetchFacebookSnapshot(connection: PlatformConnection): Promise<MetricSnapshot> {
  const accessToken = safeString(connection.access_token)
  const pageId = safeString(connection.page_id) ?? safeString(connection.pageId)

  if (!accessToken || !pageId) {
    throw new Error('facebook_meta_connection_missing_page_id_or_access_token')
  }

  const [page, insights] = await Promise.all([
    fetchMetaJson(pageId, {
      fields: 'followers_count,fan_count',
      access_token: accessToken,
    }),
    fetchMetaJson(`${pageId}/insights`, {
      metric: 'page_impressions_unique,page_post_engagements',
      period: 'day',
      access_token: accessToken,
    }),
  ])

  const followers = asNumber(page.followers_count) ?? asNumber(page.fan_count)
  const reach = latestInsightValue(insights, 'page_impressions_unique')
  const engagement = latestInsightValue(insights, 'page_post_engagements')

  return {
    platform: 'facebook',
    external_account_id: pageId,
    followers,
    post_reach: reach,
    reach,
    engagement,
    engagement_rate: engagementRate(engagement, reach),
    clicks: null,
    conversions: null,
    signups: null,
    raw_payload: { page, insights },
  }
}

async function resolveInstagramAccountId(
  instagramConnection: PlatformConnection,
  facebookConnection?: PlatformConnection,
) {
  const directAccountId =
    safeString(instagramConnection.account_id) ??
    safeString(instagramConnection.ig_user_id) ??
    safeString(instagramConnection.instagram_business_account_id)

  if (directAccountId) return directAccountId

  const pageId = safeString(facebookConnection?.page_id) ?? safeString(facebookConnection?.pageId)
  const accessToken = safeString(instagramConnection.access_token) ?? safeString(facebookConnection?.access_token)
  if (!pageId || !accessToken) return null

  const page = await fetchMetaJson(pageId, {
    fields: 'instagram_business_account',
    access_token: accessToken,
  })

  return safeString(page?.instagram_business_account?.id)
}

async function fetchInstagramSnapshot(
  instagramConnection: PlatformConnection,
  facebookConnection?: PlatformConnection,
): Promise<MetricSnapshot> {
  const accessToken = safeString(instagramConnection.access_token) ?? safeString(facebookConnection?.access_token)
  const accountId = await resolveInstagramAccountId(instagramConnection, facebookConnection)

  if (!accessToken || !accountId) {
    throw new Error('instagram_meta_connection_missing_account_id_or_access_token')
  }

  const [account, insights] = await Promise.all([
    fetchMetaJson(accountId, {
      fields: 'followers_count,media_count',
      access_token: accessToken,
    }),
    fetchMetaJson(`${accountId}/insights`, {
      metric: 'reach,profile_views',
      period: 'day',
      access_token: accessToken,
    }),
  ])

  const followers = asNumber(account.followers_count)
  const reach = latestInsightValue(insights, 'reach')
  const profileViews = latestInsightValue(insights, 'profile_views')

  return {
    platform: 'instagram',
    external_account_id: accountId,
    followers,
    post_reach: reach,
    reach,
    engagement: profileViews,
    engagement_rate: engagementRate(profileViews, reach),
    clicks: null,
    conversions: null,
    signups: null,
    raw_payload: { account, insights },
  }
}

async function loadPreviousMetric(supabase: any, orgId: string, platform: Platform, snapshotDate: string) {
  const { data, error } = await supabase
    .from('platform_metrics')
    .select('followers, post_reach, reach, engagement_rate, engagement, signups')
    .eq('org_id', orgId)
    .eq('platform', platform)
    .eq('source', 'meta_graph')
    .lt('snapshot_date', snapshotDate)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Failed to load previous ${platform} metric: ${error.message}`)
  return data ?? null
}

async function writeSnapshot(supabase: any, orgId: string, snapshotDate: string, snapshot: MetricSnapshot) {
  const previous = await loadPreviousMetric(supabase, orgId, snapshot.platform, snapshotDate)

  await supabase
    .from('platform_metrics')
    .delete()
    .eq('org_id', orgId)
    .eq('platform', snapshot.platform)
    .eq('snapshot_date', snapshotDate)
    .eq('source', 'meta_graph')
    .eq('external_account_id', snapshot.external_account_id)

  const row = {
    org_id: orgId,
    platform: snapshot.platform,
    snapshot_date: snapshotDate,
    followers: snapshot.followers,
    post_reach: snapshot.post_reach,
    reach: snapshot.reach,
    engagement: snapshot.engagement,
    engagement_rate: snapshot.engagement_rate,
    clicks: snapshot.clicks,
    conversions: snapshot.conversions,
    signups: snapshot.signups,
    followers_change: percentChange(snapshot.followers, asNumber(previous?.followers)),
    reach_change: percentChange(snapshot.reach, asNumber(previous?.reach ?? previous?.post_reach)),
    engagement_change: percentChange(snapshot.engagement_rate, asNumber(previous?.engagement_rate)),
    signups_change: percentChange(snapshot.signups, asNumber(previous?.signups)),
    source: 'meta_graph',
    source_integration: 'meta',
    external_account_id: snapshot.external_account_id,
    external_snapshot_id: `${snapshot.platform}:${snapshot.external_account_id}:${snapshotDate}`,
    raw_payload: snapshot.raw_payload,
    captured_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('platform_metrics')
    .insert(row)
    .select('id, platform, snapshot_date, external_account_id')
    .single()

  if (error) throw new Error(`Failed to write ${snapshot.platform} metric: ${error.message}`)
  return data
}

function requestedPlatforms(value: unknown): Platform[] {
  if (!Array.isArray(value)) return ['facebook', 'instagram']
  return value
    .filter((platform): platform is Platform => platform === 'facebook' || platform === 'instagram')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json().catch(() => ({}))
    const orgId =
      safeString(body.orgId) ??
      safeString(body.org_id) ??
      safeString(Deno.env.get('SUPABASE_ORG_ID'))

    if (!orgId) {
      return jsonResponse({ ok: false, error: 'org_id_required' }, 400)
    }

    const snapshotDate = safeString(body.snapshot_date) ?? new Date().toISOString().slice(0, 10)
    const dryRun = body.dry_run === true
    const platforms = requestedPlatforms(body.platforms)

    const { data: orgConfig, error: configError } = await supabase
      .from('org_config')
      .select('org_id, platform_connections')
      .eq('org_id', orgId)
      .single()

    if (configError) throw new Error(`Failed to load org config: ${configError.message}`)

    const connections = (orgConfig?.platform_connections ?? {}) as Record<string, PlatformConnection | undefined>
    const results = []

    for (const platform of platforms) {
      try {
        const connection = connections[platform] ?? {}
        if (connection.connected === false) {
          results.push({ platform, status: 'skipped', reason: `${platform}_not_connected` })
          continue
        }

        const snapshot = platform === 'facebook'
          ? await fetchFacebookSnapshot(connection)
          : await fetchInstagramSnapshot(connection, connections.facebook)

        const stored = dryRun ? null : await writeSnapshot(supabase, orgId, snapshotDate, snapshot)
        results.push({ platform, status: dryRun ? 'ready' : 'inserted', snapshot_date: snapshotDate, stored })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const status = message.includes('missing_') ? 'skipped' : 'failed'
        results.push({ platform, status, reason: message })
      }
    }

    return jsonResponse({
      ok: true,
      org_id: orgId,
      snapshot_date: snapshotDate,
      inserted: results.filter((row) => row.status === 'inserted').length,
      skipped: results.filter((row) => row.status === 'skipped').length,
      failed: results.filter((row) => row.status === 'failed').length,
      results,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('fetch-platform-metrics failed:', message)
    return jsonResponse({ ok: false, error: message }, 500)
  }
})
