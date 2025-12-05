import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Variables Supabase pour les requêtes RPC
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

    // Get user quota using the RPC function
    const { data: quotaData, error: quotaError } = await supabaseAdmin.rpc(
      'get_user_quota',
      { p_user_id: user.id }
    )

    if (quotaError) {
      console.error('Error getting quota:', quotaError)
      // Si pas de quota trouvé, retourner des valeurs par défaut (plan gratuit)
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

    const quota = quotaData as {
      plan_type: string
      articles_limit: number
      articles_used: number
      articles_remaining: number
      reset_date: string
      one_time_purchases_available: number
      has_unlimited: boolean
    }

    const canGenerate =
      quota.has_unlimited ||
      quota.articles_remaining > 0 ||
      quota.one_time_purchases_available > 0

    // Get one-time purchases
    const { data: oneTimePurchases } = await supabaseAdmin
      .from('one_time_purchases')
      .select('id, used, created_at')
      .eq('user_id', user.id)
      .eq('used', false)

    return NextResponse.json({
      canGenerate,
      plan: quota.plan_type,
      articlesUsed: quota.articles_used,
      articlesLimit: quota.articles_limit,
      articlesRemaining: quota.articles_remaining,
      resetDate: quota.reset_date,
      oneTimePurchasesAvailable: quota.one_time_purchases_available,
      hasUnlimited: quota.has_unlimited,
      oneTimePurchases: oneTimePurchases || [],
    })
  } catch (err: any) {
    console.error('Error checking quota:', err)
    return NextResponse.json(
      { error: err.message || 'Error checking quota' },
      { status: 500 }
    )
  }
}
