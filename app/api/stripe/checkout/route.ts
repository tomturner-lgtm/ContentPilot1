import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Supabase admin client pour les opérations serveur
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json()

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const supabaseAdmin = getSupabaseAdmin()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 1. RÉCUPÉRER L'UTILISATEUR ET SON ABONNEMENT ACTUEL
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, stripe_customer_id, stripe_subscription_id, email')
      .eq('auth_id', user.id)
      .single()

    if (userError || !userData) {
      console.error('❌ User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('👤 User data:', {
      id: userData.id,
      email: userData.email,
      hasSubscription: !!userData.stripe_subscription_id,
      hasCustomer: !!userData.stripe_customer_id
    })

    // 2. SI L'UTILISATEUR A DÉJÀ UN ABONNEMENT ACTIF → L'ANNULER
    if (userData.stripe_subscription_id) {
      console.log(`🔴 Canceling existing subscription: ${userData.stripe_subscription_id}`)

      try {
        await stripe.subscriptions.cancel(userData.stripe_subscription_id)
        console.log('✅ Old subscription canceled successfully')

        // Nettoyer la DB immédiatement
        await supabaseAdmin
          .from('users')
          .update({
            stripe_subscription_id: null,
            stripe_subscription_status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('id', userData.id)
      } catch (cancelError: any) {
        // Continue même si l'annulation échoue (l'abonnement est peut-être déjà annulé)
        console.warn('⚠️ Could not cancel subscription (may already be canceled):', cancelError.message)
      }
    }

    // 3. CRÉER OU RÉCUPÉRER LE CLIENT STRIPE
    let customerId = userData.stripe_customer_id

    if (!customerId) {
      console.log('📝 Creating new Stripe customer')
      const customer = await stripe.customers.create({
        email: userData.email || user.email,
        metadata: { user_id: userData.id }
      })
      customerId = customer.id

      // Sauvegarder le customer ID
      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userData.id)

      console.log('✅ Stripe customer created:', customerId)
    }

    // 4. CRÉER LA SESSION CHECKOUT
    // Check if it's a one-time purchase or subscription (HARDCODED for reliability)
    const TEST_PRICE_ID = 'price_1SVW9TCQc7L9vhgD6NrtRBK4'
    const mode = priceId === TEST_PRICE_ID ? 'payment' : 'subscription'

    console.log('🛒 Creating checkout session:', { priceId, mode, customerId })

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId, // Utiliser le customer existant
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: mode,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`,
      metadata: {
        userId: user.id,
        user_id: userData.id, // ID interne de la table users
      },
      allow_promotion_codes: true,
    })

    console.log('✅ Checkout session created:', checkoutSession.id)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err: any) {
    console.error('❌ Error creating checkout session:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
