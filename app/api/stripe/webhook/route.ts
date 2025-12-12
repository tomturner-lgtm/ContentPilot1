import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// HARDCODED price IDs pour fiabilité (pas de dépendance aux env vars)
const PLAN_CONFIG: Record<string, { plan: string; limit: number; period: string }> = {
  'price_1SVW9TCQc7L9vhgD6NrtRBK4': { plan: 'test', limit: 1, period: 'one_time' },
  'price_1SVGLwCQc7L9vhgDOp2cw4wn': { plan: 'pro', limit: 30, period: 'monthly' },
  'price_1SVUXJCQc7L9vhgDVShAMmE4': { plan: 'pro', limit: 30, period: 'yearly' },
  'price_1SVGMbCQc7L9vhgDuc2zUVyS': { plan: 'max', limit: 200, period: 'monthly' },
  'price_1SVUXXCQc7L9vhgDEkMjivDk': { plan: 'max', limit: 200, period: 'yearly' },
}

export async function POST(req: Request) {
  console.log('🔔 Stripe webhook received')

  // Supabase Admin client
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    console.error('❌ No Stripe signature')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('✅ Event type:', event.type)

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    console.log('📦 Checkout session:', {
      id: session.id,
      customer_email: session.customer_email,
      metadata: session.metadata,
    })

    // Get line items to find price ID
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
    const priceId = lineItems.data[0]?.price?.id

    console.log('💰 Price ID:', priceId)

    if (!priceId) {
      console.error('❌ No price ID found')
      return NextResponse.json({ received: true })
    }

    // Get plan config
    const planConfig = PLAN_CONFIG[priceId]

    if (!planConfig) {
      console.error('❌ Unknown price ID:', priceId)
      console.error('Available price IDs:', Object.keys(PLAN_CONFIG))
      return NextResponse.json({ received: true })
    }

    console.log('✅ Plan config:', planConfig)

    // Get user email
    const customerEmail = session.customer_email || session.customer_details?.email

    if (!customerEmail) {
      console.error('❌ No customer email')
      return NextResponse.json({ received: true })
    }

    console.log('👤 Customer email:', customerEmail)

    // Find user in database by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, auth_id, email')
      .eq('email', customerEmail)
      .single()

    if (userError || !userData) {
      console.error('❌ User not found by email:', customerEmail, userError)
      return NextResponse.json({ received: true })
    }

    console.log('✅ Found user:', userData)

    // Update user plan
    const updateData = {
      plan: planConfig.plan,
      articles_limit: planConfig.limit,
      billing_period: planConfig.period,
      articles_used: 0,
      quota_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string || null,
      stripe_subscription_status: 'active',
      updated_at: new Date().toISOString(),
    }

    console.log('📝 Updating user with:', updateData)

    const { error: updateError, data: updateResult } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userData.id)
      .select()

    if (updateError) {
      console.error('❌ Error updating user:', updateError)
    } else {
      console.log('✅ User updated successfully:', updateResult)
    }

    // For one-time purchases, also add to one_time_purchases table
    if (planConfig.period === 'one_time') {
      const { error: purchaseError } = await supabase
        .from('one_time_purchases')
        .insert({
          user_id: userData.id,
          stripe_payment_id: session.payment_intent as string,
          amount_paid: 500,
          used: false,
        })

      if (purchaseError) {
        console.error('❌ Error creating one-time purchase:', purchaseError)
      } else {
        console.log('✅ One-time purchase recorded')
      }
    }
  }

  // Handle subscription cancelled (definitive)
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    console.log('🚫 Subscription DELETED (definitive):', subscription.id)

    // Find user by subscription ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (userData) {
      // Clear all subscription data
      const { error } = await supabase
        .from('users')
        .update({
          plan: null,
          billing_period: null,
          articles_limit: 0,
          articles_used: 0,
          stripe_subscription_id: null,
          stripe_subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.id)

      if (error) {
        console.error('❌ Error canceling subscription:', error)
      } else {
        console.log('✅ Subscription fully canceled in DB for user:', userData.id)
      }
    }
  }

  // Handle subscription updated (status change, cancel_at_period_end, etc.)
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    console.log('🔄 Subscription updated:', subscription.id)
    console.log('   - status:', subscription.status)
    console.log('   - cancel_at_period_end:', subscription.cancel_at_period_end)

    // Determine the right status
    let newStatus: string = subscription.status
    if (subscription.cancel_at_period_end && subscription.status === 'active') {
      newStatus = 'canceling' // Custom status for UI
    }

    const { error } = await supabase
      .from('users')
      .update({
        stripe_subscription_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('❌ Error updating subscription status:', error)
    } else {
      console.log(`✅ Status updated to: ${newStatus}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ÉVÉNEMENT CRITIQUE : invoice.payment_succeeded
  // Déclenché à CHAQUE renouvellement mensuel/annuel
  // C'est ICI qu'on réinitialise articles_used à 0
  // ═══════════════════════════════════════════════════════════════
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = invoice.subscription as string

    console.log('💳 === PAIEMENT RÉUSSI ===')
    console.log('💳 Invoice ID:', invoice.id)
    console.log('💳 Subscription ID:', subscriptionId)
    console.log('💳 Billing reason:', invoice.billing_reason)

    // Ne traiter que les renouvellements (pas le premier paiement qui est géré par checkout.session.completed)
    if (subscriptionId && invoice.billing_reason === 'subscription_cycle') {
      console.log('🔄 Renouvellement détecté - Réinitialisation du quota...')

      // Trouver l'user par subscription_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, plan, articles_used, articles_limit')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

      if (userError || !userData) {
        console.error('❌ User not found for subscription:', subscriptionId, userError)
        return NextResponse.json({ received: true })
      }

      console.log('👤 User trouvé:', {
        id: userData.id,
        email: userData.email,
        plan: userData.plan,
        articles_used_before: userData.articles_used,
        articles_limit: userData.articles_limit
      })

      // Calculer la nouvelle date de reset (+30 jours)
      const newResetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      // RÉINITIALISER LE QUOTA
      const { error: updateError } = await supabase
        .from('users')
        .update({
          articles_used: 0, // 🔥 RESET à zéro
          quota_reset_date: newResetDate,
          stripe_subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.id)

      if (updateError) {
        console.error('❌ Erreur lors du reset du quota:', updateError)
      } else {
        console.log('✅ QUOTA RÉINITIALISÉ avec succès!')
        console.log('   - articles_used: 0 (était:', userData.articles_used, ')')
        console.log('   - quota_reset_date:', newResetDate)
      }
    } else if (invoice.billing_reason === 'subscription_create') {
      console.log('ℹ️ Premier paiement (géré par checkout.session.completed), ignoré ici')
    } else {
      console.log('ℹ️ Autre type de paiement, billing_reason:', invoice.billing_reason)
    }
    console.log('💳 === FIN PAIEMENT ===')
  }

  // ═══════════════════════════════════════════════════════════════
  // ÉVÉNEMENT : invoice.payment_failed
  // Déclenché quand un paiement échoue (carte expirée, fonds insuffisants)
  // ═══════════════════════════════════════════════════════════════
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = invoice.subscription as string

    console.log('❌ === PAIEMENT ÉCHOUÉ ===')
    console.log('❌ Invoice ID:', invoice.id)
    console.log('❌ Subscription ID:', subscriptionId)

    if (subscriptionId) {
      // Mettre à jour le statut pour informer l'utilisateur
      const { error } = await supabase
        .from('users')
        .update({
          stripe_subscription_status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscriptionId)

      if (error) {
        console.error('❌ Erreur lors de la mise à jour du statut:', error)
      } else {
        console.log('⚠️ Statut mis à jour: past_due')
      }
    }
    console.log('❌ === FIN PAIEMENT ÉCHOUÉ ===')
  }

  return NextResponse.json({ received: true })
}
