import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // /admin/* was a legacy, independently-implemented admin panel that
  // duplicated /dashboard/admin/* (fewer routes, and fixes applied to one
  // tree didn't reach the other — see MASTER_AUDIT_IMPLEMENTATION_REPORT.md).
  // /dashboard/admin/* is canonical; redirect the old tree here rather than
  // in the page itself so it happens before any client JS loads, with no
  // flash of the old UI first.
  if (path === '/admin' || path.startsWith('/admin/')) {
    const url = new URL(path.replace(/^\/admin/, '/dashboard/admin'), request.url)
    url.search = request.nextUrl.search
    return NextResponse.redirect(url)
  }

  // Check if any cookie starting with 'wordpress_logged_in_' exists
  const cookies = request.cookies.getAll()
  const hasAuthCookie = cookies.some(c => c.name.startsWith('wordpress_logged_in_'))

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
