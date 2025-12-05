import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Récupérer la session
  const { data: { session } } = await supabase.auth.getSession()

  // Routes protégées
  const protectedPaths = ['/profile', '/generate']
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (!session && isProtectedPath) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si l'utilisateur est connecté et essaie d'accéder à /login
  if (session && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/profile', request.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
