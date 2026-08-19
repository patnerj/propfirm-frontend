import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check if fxsim_authed session flag cookie exists OR WordPress auth cookie
  const cookies = request.cookies.getAll()
  const hasAuthCookie = request.cookies.get('fxsim_authed')?.value === '1' || cookies.some(c => c.name.startsWith('wordpress_logged_in_'))

  // Protect /admin routes
  if (path === '/admin' || path.startsWith('/admin/')) {
    if (!hasAuthCookie) {
      const url = new URL('/login', request.url)
      url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
      return NextResponse.redirect(url)
    }
  }

  // Protect /dashboard routes
  if (path.startsWith('/dashboard')) {
    if (!hasAuthCookie) {
      const url = new URL('/login', request.url)
      url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
      return NextResponse.redirect(url)
    }
  }

  // Let client-side code handle redirecting away from auth pages if actually logged in.
  // We can't trust the cookie presence alone because it might be expired on the server,
  // which causes an infinite redirect loop between client-side dashboard (unauthorized) and middleware (cookie present).

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register', '/admin', '/admin/:path*'],
}
