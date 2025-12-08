import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

// Mapping des price IDs vers les plans et limites
const PLAN_CONFIG: Record<string, { planType: string; articlesLimit: number }> = {
  // Test (one-time) - 1 article
  [process.env.STRIPE_PRICE_TEST || 'price_test']: { planType: 'test', articlesLimit: 1 },
  // Pro mensuel - 30 articles
  [process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_m']: { planType: 'pro', articlesLimit: 30 },
  // Pro annuel - 30 articles
  [process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_y']: { planType: 'pro', articlesLimit: 30 },
  // Max mensuel - 200 articles
  [process.env.STRIPE_PRICE_UNLIMITED_MONTHLY || 'price_max_m']: { planType: 'max', articlesLimit: 200 },
  // Max annuel - 200 articles
  [process.env.STRIPE_PRICE_UNLIMITED_YEARLY || 'price_max_y']: { planType: 'max', articlesLimit: 200 },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    }

    console.log('Webhook event received:', event.type)

    // Paiement réussi (checkout completed)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      console.log('Checkout completed:', {
        customerId: session.customer,
        customerEmail: session.customer_email,
        subscriptionId: session.subscription,
        mode: session.mode,
      })

      // Récupérer les line items pour identifier le price ID
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
      const priceId = lineItems.data[0]?.price?.id

      if (!priceId) {
        console.error('No price ID found in session')
        return NextResponse.json({ received: true })
      }

      console.log('Price ID:', priceId)

      // Déterminer le plan et les limites
      const planConfig = PLAN_CONFIG[priceId] || { planType: 'pro', articlesLimit: 30 }
      console.log('Plan config:', planConfig)

      // Trouver l'utilisateur par email
      const customerEmail = session.customer_email || session.customer_details?.email
      if (!customerEmail) {
        console.error('No customer email found')
        return NextResponse.json({ received: true })
      }

      // Chercher l'utilisateur dans auth.users
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()
      const user = users?.users?.find(u => u.email === customerEmail)

      if (!user) {
        console.error('User not found for email:', customerEmail)
        return NextResponse.json({ received: true })
      }

      console.log('Found user:', user.id)

      // Mettre à jour l'utilisateur dans la table users
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          plan: planConfig.planType,
          articles_limit: planConfig.articlesLimit,
          articles_used: 0, // Reset à 0 pour le nouveau plan
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string || null,
          stripe_subscription_status: 'active',
          quota_reset_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('auth_id', user.id)

      if (updateError) {
        console.error('Error updating user:', updateError)
      } else {
        console.log('User updated successfully:', user.id)
      }

      // Pour les achats ponctuels (test), créer un one_time_purchase
      if (session.mode === 'payment' && planConfig.planType === 'test') {
        const { error: purchaseError } = await supabaseAdmin
          .from('one_time_purchases')
          .insert({
            user_id: user.id,
            stripe_payment_id: session.payment_intent as string,
            amount_paid: 500, // 5€ en centimes
            used: false,
          })

        if (purchaseError) {
          console.error('Error creating one-time purchase:', purchaseError)
        }
      }
    }

    // Subscription mise à jour (upgrade/downgrade)
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription
      console.log('Subscription updated:', subscription.id, subscription.status)

      // Mettre à jour le statut
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          stripe_subscription_status: subscription.status,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)

      if (error) console.error('Error updating subscription status:', error)
    }

    // Subscription annulée
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      console.log('Subscription deleted:', subscription.id)

      // Révoquer le plan (remettre en free)
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          plan: 'free',
          articles_limit: 0,
          stripe_subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)

      if (error) console.error('Error revoking plan:', error)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
