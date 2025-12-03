import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    // On sécurise les variables pour le build avec des valeurs de fallback
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ybfbfmbnlsvgyhtzctpl.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Z2dvamxlbGF4YmlseGNrdGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mjc1MTAsImV4cCI6MjA3OTIwMzUxMH0.BNfsDlt4duHGu2npsE0ixiYpeogYmRNEh0j_4c34QKc'
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user quota using the existing RPC function
    const { data: quotaData, error: quotaError } = await supabase.rpc(
      'get_user_quota',
      {
        p_user_id: user.id,
      }
    )

    if (quotaError) {
      console.error('Error getting quota:', quotaError)
      throw quotaError
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

