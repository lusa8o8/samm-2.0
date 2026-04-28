import type Stripe from 'npm:stripe@18.4.0'
import {
  buildSubscriptionSnapshot,
  createAdminClient,
  createStripeClient,
  resolveOrgIdForStripeObject,
  upsertOrgBillingRow,
} from '../_shared/stripe-billing.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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

async function retrieveSubscription(stripe: Stripe, subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!signature || !webhookSecret) {
      throw new Error('Missing Stripe webhook signature configuration')
    }

    const payload = await req.text()
    const stripe = createStripeClient()
    const event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret)
    const adminClient = createAdminClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orgId =
          (typeof session.metadata?.org_id === 'string' && session.metadata.org_id) ||
          (typeof session.client_reference_id === 'string' && session.client_reference_id) ||
          null

        if (!orgId) break

        const customerId = typeof session.customer === 'string' ? session.customer : null
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null

        if (subscriptionId) {
          const subscription = await retrieveSubscription(stripe, subscriptionId)
          await upsertOrgBillingRow(
            adminClient,
            buildSubscriptionSnapshot(orgId, subscription, {
              checkoutSessionId: session.id,
              lastEventId: event.id,
            }),
          )
        } else {
          await upsertOrgBillingRow(adminClient, {
            org_id: orgId,
            stripe_customer_id: customerId,
            stripe_checkout_session_id: session.id,
            status: 'inactive',
            last_event_id: event.id,
          })
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const metadataOrgId =
          typeof subscription.metadata?.org_id === 'string' ? subscription.metadata.org_id : null
        const orgId = await resolveOrgIdForStripeObject(adminClient, {
          orgId: metadataOrgId,
          stripeCustomerId:
            typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? null,
          stripeSubscriptionId: subscription.id,
        })

        if (!orgId) break

        await upsertOrgBillingRow(
          adminClient,
          buildSubscriptionSnapshot(orgId, subscription, {
            lastEventId: event.id,
          }),
        )
        break
      }

      default:
        break
    }

    return jsonResponse({ received: true })
  } catch (error) {
    console.error('stripe-webhook error', error)
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 400)
  }
})
