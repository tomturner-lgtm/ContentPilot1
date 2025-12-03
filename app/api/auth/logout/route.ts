import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.signOut()

    // Rediriger vers la page de login
    const response = NextResponse.redirect(new URL('/login', req.url))
    
    // Supprimer tous les cookies Supabase possibles
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ybfbfmbnlsvgyhtzctpl.supabase.co'
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'ybfbfmbnlsvgyhtzctpl'
    
    response.cookies.delete(`sb-${projectRef}-auth-token`)
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')

    return response
  } catch (error) {
    console.error('Error logging out:', error)
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

