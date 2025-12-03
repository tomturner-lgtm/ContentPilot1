import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Routes protégées
  const protectedPaths = ['/profile', '/dashboard']
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Vérifier si l'utilisateur a une session Supabase
  // Supabase stocke les sessions dans des cookies avec le pattern sb-{project-ref}-auth-token
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ybfbfmbnlsvgyhtzctpl.supabase.co'
  const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'ybfbfmbnlsvgyhtzctpl'
  
  // Chercher les cookies Supabase standard
  const authToken = request.cookies.get(`sb-${projectRef}-auth-token`)?.value
  const accessToken = request.cookies.get('sb-access-token')?.value
  
  const hasSession = !!(authToken || accessToken)

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (!hasSession && isProtectedPath) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si l'utilisateur est connecté et essaie d'accéder à /login, rediriger vers /profile
  if (hasSession && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/profile', request.url))
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

