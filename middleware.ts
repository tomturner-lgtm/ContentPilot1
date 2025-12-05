import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Routes protégées
  const protectedPaths = ['/profile', '/dashboard', '/generate']
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Vérifier si l'utilisateur a une session Better Auth
  // Better Auth stocke les sessions dans des cookies
  const sessionToken = request.cookies.get('better-auth.session_token')?.value

  const hasSession = !!sessionToken

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (!hasSession && isProtectedPath) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si l'utilisateur est connecté et essaie d'accéder à /login, rediriger vers /dashboard
  if (hasSession && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (let API handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
