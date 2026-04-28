import { createStripeClient, getAuthenticatedOrgContext, getOrgBillingRow, upsertOrgBillingRow } from '../_shared/stripe-billing.ts'

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
    const { adminClient, user, orgId } = await getAuthenticatedOrgContext(req)
    const stripe = createStripeClient()
    const body = await req.json().catch(() => ({}))
    const origin =
      typeof body?.origin === 'string' && body.origin.startsWith('http')
        ? body.origin
        : Deno.env.get('APP_ORIGIN') ?? 'http://localhost:5173'

    const priceId = Deno.env.get('STRIPE_PRICE_ID')
    if (!priceId) {
      throw new Error('Missing STRIPE_PRICE_ID')
    }

    const existingBilling = await getOrgBillingRow(adminClient, orgId)
    let stripeCustomerId = existingBilling?.stripe_customer_id ?? null

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          org_id: orgId,
          user_id: user.id,
        },
        name: user.email?.split('@')[0] ?? undefined,
      })
      stripeCustomerId = customer.id
    }

    const successUrl = new URL('/samm', origin)
    successUrl.searchParams.set('billing', 'success')
    const cancelUrl = new URL('/samm', origin)
    cancelUrl.searchParams.set('billing', 'cancelled')

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      client_reference_id: orgId,
      allow_promotion_codes: true,
      metadata: {
        org_id: orgId,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          org_id: orgId,
          user_id: user.id,
        },
      },
    })

    await upsertOrgBillingRow(adminClient, {
      org_id: orgId,
      stripe_customer_id: stripeCustomerId,
      stripe_checkout_session_id: session.id,
      status: existingBilling?.status ?? 'inactive',
      price_id: existingBilling?.price_id ?? null,
      product_id: existingBilling?.product_id ?? null,
      current_period_end: existingBilling?.current_period_end ?? null,
      cancel_at_period_end: existingBilling?.cancel_at_period_end ?? false,
      last_event_id: existingBilling?.last_event_id ?? null,
      stripe_subscription_id: existingBilling?.stripe_subscription_id ?? null,
    })

    return jsonResponse({ url: session.url })
  } catch (error) {
    console.error('stripe-create-checkout-session error', error)
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
