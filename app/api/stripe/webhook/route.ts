import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(req: Request) {
  // 1. On définit les variables avec une sécurité pour le build
  const supabaseUrl = process.env.SUPABASE_URL || 'https://ybfbfmbnlsvgyhtzctpl.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Z2dvamxlbGF4YmlseGNrdGpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzYyNzUxMCwiZXhwIjoyMDc5MjAzNTEwfQ.lVs1sV7kW8O8cetg5Pf6C9NRq2s2v1e1afSedw4k18g'

  // 2. On initialise le client ici
  const supabase = createClient(supabaseUrl, supabaseKey)
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('Webhook received:', event.type)

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session

      // Get the price ID from line items
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
      const priceId = lineItems.data[0]?.price?.id

      // Determine the plan
      // Note: No free plan anymore - users must purchase test (5€) or subscribe
      let plan = 'test' // Changed from 'free'
      let isOneTime = false

      if (priceId === process.env.STRIPE_PRICE_TEST) {
        // One-time test purchase
        isOneTime = true

        // Add to one_time_purchases table
        const { error: purchaseError } = await supabase
          .from('one_time_purchases')
          .insert({
            user_id: session.metadata?.user_id || session.metadata?.userId,
            stripe_payment_intent_id: session.payment_intent as string,
          })

        if (purchaseError) {
          console.error('Error creating one-time purchase:', purchaseError)
        }
      } else {
        // Subscription plans
        if (
          priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
          priceId === process.env.STRIPE_PRICE_PRO_YEARLY
        ) {
          plan = 'pro'
        } else if (
          priceId === process.env.STRIPE_PRICE_UNLIMITED_MONTHLY ||
          priceId === process.env.STRIPE_PRICE_UNLIMITED_YEARLY
        ) {
          plan = 'unlimited'
        }

        // Update subscription in Supabase
        const { error } = await supabase.rpc('update_subscription_from_stripe', {
          user_email: session.customer_details?.email,
          plan_name: plan,
          customer_id: session.customer as string,
          subscription_id: session.subscription as string,
        })
        if (error) {
          console.error('Error updating subscription:', error)
        }
      }
      break

    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription

      // Get customer email
      const customer = await stripe.customers.retrieve(
        subscription.customer as string
      )
      const customerEmail = (customer as Stripe.Customer).email

      // Reset plan when subscription is cancelled
      // Note: No free plan anymore, but we reset to minimal access
      await supabase.rpc('update_subscription_from_stripe', {
        user_email: customerEmail,
        plan_name: 'test', // Changed from 'free' - users need to purchase test or subscribe
        customer_id: subscription.customer as string,
        subscription_id: null,
      })
      break
  }

  return NextResponse.json({ received: true })
}

