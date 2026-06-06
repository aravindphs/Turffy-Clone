import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Route rules
const PROTECTED_ROUTES = ['/bookings', '/profile']
const OWNER_ROUTES = ['/dashboard', '/turf', '/slots', '/reviews', '/owner-bookings']
const ADMIN_ROUTES = ['/admin']
const AUTH_ROUTES = ['/login', '/register', '/forgot-password']

function getPathRole(pathname: string): 'owner' | 'admin' | 'user' | 'public' {
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) return 'admin'
  if (OWNER_ROUTES.some((r) => pathname.startsWith(r))) return 'owner'
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) return 'user'
  return 'public'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check auth by calling /me API (cookies are automatically forwarded)
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const requiredRole = getPathRole(pathname)

  if (requiredRole === 'public' && !isAuthRoute) {
    return NextResponse.next()
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    })

    if (!res.ok) {
      // Not authenticated
      if (requiredRole !== 'public') {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
      return NextResponse.next()
    }

    const data = await res.json()
    const user = data.data
    const role: string = user?.role

    // Redirect authenticated users away from auth pages
    if (isAuthRoute) {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      if (role === 'owner') return NextResponse.redirect(new URL('/dashboard', request.url))
      return NextResponse.redirect(new URL('/turfs', request.url))
    }

    // Role-based access control
    if (requiredRole === 'admin' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (requiredRole === 'owner' && role !== 'owner' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
  } catch {
    // API unreachable — allow auth routes, block protected
    if (requiredRole !== 'public') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/forgot-password',
    '/dashboard/:path*',
    '/turf/:path*',
    '/slots/:path*',
    '/reviews/:path*',
    '/owner-bookings/:path*',
    '/bookings/:path*',
    '/profile/:path*',
    '/admin/:path*',
  ],
}
