import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Variables Supabase pour les requêtes admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

    // Récupérer directement depuis la table users (plus fiable que RPC)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, plan, billing_period, articles_limit, articles_used, quota_reset_date, stripe_subscription_status')
      .eq('auth_id', user.id)
      .single()

    if (userError || !userData) {
      console.error('Error getting user:', userError)
      // Si pas d'user trouvé, retourner des valeurs par défaut (plan gratuit)
      return NextResponse.json({
        canGenerate: true,
        plan: 'free',
        articlesUsed: 0,
        articlesLimit: 1,
        articlesRemaining: 1,
        resetDate: new Date().toISOString(),
        oneTimePurchasesAvailable: 0,
        hasUnlimited: false,
        oneTimePurchases: [],
      })
    }

    // Calculer les valeurs
    const articlesLimit = userData.articles_limit || 0
    const articlesUsed = userData.articles_used || 0
    const articlesRemaining = Math.max(0, articlesLimit - articlesUsed)

    // Get one-time purchases disponibles
    const { data: oneTimePurchases, error: otpError } = await supabaseAdmin
      .from('one_time_purchases')
      .select('id, used, created_at')
      .eq('user_id', userData.id)
      .eq('used', false)

    const oneTimePurchasesAvailable = oneTimePurchases?.length || 0

    // Déterminer si l'user peut générer
    const canGenerate =
      articlesRemaining > 0 ||
      oneTimePurchasesAvailable > 0

    console.log('📊 Check quota result:', {
      userId: userData.id,
      plan: userData.plan,
      articlesUsed,
      articlesLimit,
      articlesRemaining,
      oneTimePurchasesAvailable,
      canGenerate
    })

    return NextResponse.json({
      canGenerate,
      plan: userData.plan || 'free',
      articlesUsed,
      articlesLimit,
      articlesRemaining,
      resetDate: userData.quota_reset_date || new Date().toISOString(),
      oneTimePurchasesAvailable,
      hasUnlimited: false, // Plus de plan "illimité"
      oneTimePurchases: oneTimePurchases || [],
      subscriptionStatus: userData.stripe_subscription_status,
    })
  } catch (err: any) {
    console.error('Error checking quota:', err)
    return NextResponse.json(
      { error: err.message || 'Error checking quota' },
      { status: 500 }
    )
  }
}
