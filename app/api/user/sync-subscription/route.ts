import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('auth_id', user.id)
      .single()

    if (userError || !userData?.stripe_customer_id) {
      return NextResponse.json({
        message: 'No Stripe customer found',
        plan: 'test',
      })
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0]
      const priceId = sub.items.data[0].price.id

      // Determine plan based on price ID
      let plan = 'test' // Changed from 'free' - default is now test

      if (
        priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
        priceId === process.env.STRIPE_PRICE_PRO_YEARLY
      ) {
        plan = 'pro'
      } else if (
        priceId === process.env.STRIPE_PRICE_UNLIMITED_MONTHLY ||
        priceId === process.env.STRIPE_PRICE_UNLIMITED_YEARLY
      ) {
        plan = 'max'
      }

      // Update in Supabase using the RPC function
      const { error: updateError } = await supabase.rpc(
        'update_subscription_from_stripe',
        {
          user_email: user.email || '',
          plan_name: plan,
          customer_id: userData.stripe_customer_id,
          subscription_id: sub.id,
        }
      )

      if (updateError) {
        console.error('Error updating subscription:', updateError)
        return NextResponse.json(
          { error: 'Error updating subscription in database' },
          { status: 500 }
        )
      }

      // Get updated quota info
      const { data: updatedQuota } = await supabase.rpc('get_user_quota', {
        p_user_id: user.id,
      })

      return NextResponse.json({
        message: 'Subscription synced successfully',
        plan,
        quota: updatedQuota,
      })
    }

    // No active subscription found - reset to test plan
    const { error: resetError } = await supabase.rpc(
      'update_subscription_from_stripe',
      {
        user_email: user.email || '',
        plan_name: 'test', // Changed from 'free'
        customer_id: userData.stripe_customer_id,
        subscription_id: null,
      }
    )

    if (resetError) {
      console.error('Error resetting subscription:', resetError)
    }

    return NextResponse.json({
      message: 'No active subscription found',
      plan: 'test', // Changed from 'free'
    })
  } catch (err: any) {
    console.error('Error syncing subscription:', err)
    return NextResponse.json(
      { error: err.message || 'Error syncing subscription' },
      { status: 500 }
    )
  }
}

