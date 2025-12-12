import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

// Liste des pages qui nécessitent une authentification
const PROTECTED_PATHS = [
  '/dashboard',
  '/articles',
  '/generate',
  '/integrations',
  '/profile',
]

// Pages publiques accessibles uniquement si NON connecté
const AUTH_PAGES = ['/login']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Créer le client Supabase pour le middleware
  const supabase = createMiddlewareClient({ req: request, res: response })
  
  // Récupérer la session
  const { data: { session } } = await supabase.auth.getSession()
  
  const pathname = request.nextUrl.pathname
  
  // Vérifier si c'est une page protégée
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  const isAuthPage = AUTH_PAGES.some(path => pathname.startsWith(path))
  
  console.log('🔒 Middleware:', { pathname, isProtectedPath, hasSession: !!session })
  
  // 🔐 SÉCURITÉ : Rediriger vers /login si pas de session sur page protégée
  if (isProtectedPath && !session) {
    console.log('❌ Accès refusé - redirection vers /login')
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Rediriger vers /dashboard si déjà connecté et sur /login
  if (isAuthPage && session) {
    console.log('✅ Déjà connecté - redirection vers /dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return response
}

// Configuration du matcher pour les routes à protéger
export const config = {
  matcher: [
    // Pages protégées
    '/dashboard/:path*',
    '/articles/:path*',
    '/generate/:path*',
    '/integrations/:path*',
    '/profile/:path*',
    // Pages d'authentification
    '/login',
  ],
}
