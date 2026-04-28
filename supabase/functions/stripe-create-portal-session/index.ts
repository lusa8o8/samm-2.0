import { createStripeClient, getAuthenticatedOrgContext, getOrgBillingRow } from '../_shared/stripe-billing.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const { adminClient, orgId } = await getAuthenticatedOrgContext(req)
    const stripe = createStripeClient()
    const billing = await getOrgBillingRow(adminClient, orgId)
    if (!billing?.stripe_customer_id) {
      return jsonResponse({ error: 'No Stripe customer exists for this workspace yet' }, 400)
    }

    const body = await req.json().catch(() => ({}))
    const origin =
      typeof body?.origin === 'string' && body.origin.startsWith('http')
        ? body.origin
        : Deno.env.get('APP_ORIGIN') ?? 'http://localhost:5173'

    const returnUrl = new URL('/operations/settings', origin)
    returnUrl.searchParams.set('billing', 'manage')

    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: returnUrl.toString(),
    })

    return jsonResponse({ url: session.url })
  } catch (error) {
    console.error('stripe-create-portal-session error', error)
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
