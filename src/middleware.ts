import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check if fxsim_authed session flag cookie exists OR WordPress auth cookie
  const cookies = request.cookies.getAll()
  const hasAuthCookie = request.cookies.get('fxsim_authed')?.value === '1' || cookies.some(c => c.name.startsWith('wordpress_logged_in_'))

  // Canonical redirect: strictly map any /dashboard/admin* URL to /admin*
  if (path === '/dashboard/admin' || path === '/dashboard/admin/') {
    const url = new URL('/admin', request.url)
    return NextResponse.redirect(url, 308)
  }
  if (path.startsWith('/dashboard/admin/')) {
    const sub = path.replace('/dashboard/admin/', '')
    const targetMap: Record<string, string> = {
      'users': 'traders',
      'challenges': 'traders',
      'payments': 'payouts',
      'settings': 'config',
      'setup': 'config',
      'support': 'helpdesk',
      'notifications': 'activity',
      'health': 'operations',
    }
    const mapped = targetMap[sub] || sub
    const url = new URL(`/admin/${mapped}`, request.url)
    return NextResponse.redirect(url, 308)
  }

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
