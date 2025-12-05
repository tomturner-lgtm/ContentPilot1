import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    // Vérifier la session Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = session.user.id

    // On sécurise les variables pour le build avec des valeurs de fallback
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ybfbfmbnlsvgyhtzctpl.supabase.co'
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user quota using the existing RPC function
    const { data: quotaData, error: quotaError } = await supabase.rpc(
      'get_user_quota',
      {
        p_user_id: userId,
      }
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

    // Parse the JSON response from the function
    const quota = quotaData as {
      plan_type: string
      articles_limit: number
      articles_used: number
      articles_remaining: number
      reset_date: string
      one_time_purchases_available: number
      has_unlimited: boolean
    }

    // Check if user can generate an article
    const canGenerate =
      quota.has_unlimited ||
      quota.articles_remaining > 0 ||
      quota.one_time_purchases_available > 0

    // Get one-time purchases count
    const { data: oneTimePurchases, error: purchasesError } = await supabase
      .from('one_time_purchases')
      .select('id, used, created_at')
      .eq('user_id', userId)
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
