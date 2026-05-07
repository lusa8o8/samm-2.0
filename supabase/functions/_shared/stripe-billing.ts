import Stripe from 'npm:stripe@18.4.0'
import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2'

export type OrgBillingRow = {
  org_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_checkout_session_id: string | null
  status: string
  price_id: string | null
  product_id: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  last_event_id: string | null
}

export const BILLING_ACCESS_STATUSES = new Set(['active', 'trialing', 'grandfathered'])

export function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export function createStripeClient() {
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-03-31.basil',
  })
}

export async function getAuthenticatedOrgContext(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? ''
  const accessToken = authHeader.replace('Bearer ', '').trim()
  if (!accessToken) {
    throw new Error('Missing bearer token')
  }

  const adminClient = createAdminClient()
  const { data: userData, error: userError } = await adminClient.auth.getUser(accessToken)
  if (userError || !userData.user) {
    throw new Error(userError?.message ?? 'Could not resolve authenticated user')
  }

  const user = userData.user
  const orgId = getOrgIdFromUser(user)
  if (!orgId) {
    throw new Error('No org_id found on authenticated user')
  }

  return {
    accessToken,
    adminClient,
    user,
    orgId,
  }
}

export function getOrgIdFromUser(user: User) {
  const rawOrgId = user.app_metadata?.org_id
  return typeof rawOrgId === 'string' && rawOrgId.trim().length > 0 ? rawOrgId.trim() : null
}

export async function getOrgBillingRow(adminClient: SupabaseClient, orgId: string) {
  const { data, error } = await adminClient
    .from('org_billing')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? null) as OrgBillingRow | null
}

export async function upsertOrgBillingRow(
  adminClient: SupabaseClient,
  row: Partial<OrgBillingRow> & { org_id: string },
) {
  const payload = {
    ...row,
    updated_at: new Date().toISOString(),
  }

  const { error } = await adminClient
    .from('org_billing')
    .upsert(payload, { onConflict: 'org_id' })

  if (error) {
    throw new Error(error.message)
  }
}

function extractCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end
  if (!periodEnd) return null
  return new Date(periodEnd * 1000).toISOString()
}

export function buildSubscriptionSnapshot(
  orgId: string,
  subscription: Stripe.Subscription,
  extras?: {
    checkoutSessionId?: string | null
    lastEventId?: string | null
  },
) {
  const primaryItem = subscription.items.data[0]
  const priceId = typeof primaryItem?.price?.id === 'string' ? primaryItem.price.id : null
  const productId =
    typeof primaryItem?.price?.product === 'string' ? primaryItem.price.product : null

  return {
    org_id: orgId,
    stripe_customer_id:
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? null,
    stripe_subscription_id: subscription.id,
    stripe_checkout_session_id: extras?.checkoutSessionId ?? null,
    status: subscription.status ?? 'inactive',
    price_id: priceId,
    product_id: productId,
    current_period_end: extractCurrentPeriodEnd(subscription),
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    last_event_id: extras?.lastEventId ?? null,
  }
}

export async function resolveOrgIdForStripeObject(
  adminClient: SupabaseClient,
  input: {
    orgId?: string | null
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
  },
) {
  if (input.orgId) return input.orgId

  if (input.stripeSubscriptionId) {
    const { data, error } = await adminClient
      .from('org_billing')
      .select('org_id')
      .eq('stripe_subscription_id', input.stripeSubscriptionId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (data?.org_id) return data.org_id as string
  }

  if (input.stripeCustomerId) {
    const { data, error } = await adminClient
      .from('org_billing')
      .select('org_id')
      .eq('stripe_customer_id', input.stripeCustomerId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (data?.org_id) return data.org_id as string
  }

  return null
}
