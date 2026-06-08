import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type Role = 'STUDENT' | 'TEACHER' | 'ADMIN'

const DASHBOARD_FOR_ROLE: Record<Role, string> = {
  ADMIN: '/admin/dashboard',
  TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
}

const PUBLIC_PATHS = new Set<string>([
  '/admin/login',
  '/teacher/login',
  '/teacher/register',
  '/teacher/forgot-password',
  '/teacher/reset-password',
  '/student/login',
])

// ─────────────────────────────────────────────────────────────────────────────
// MAINTENANCE MODE
// Aktifkan: set NEXT_PUBLIC_MAINTENANCE_MODE=true di Vercel Environment Variables
// Bypass admin: tambahkan ?bypass=unimath-admin di URL atau cookie 'maintenance_bypass'
// ─────────────────────────────────────────────────────────────────────────────
const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'
const MAINTENANCE_BYPASS_KEY = process.env.MAINTENANCE_BYPASS_KEY || 'unimath-admin-2026'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── MAINTENANCE MODE CHECK ─────────────────────────────────────────────────
  if (MAINTENANCE_MODE) {
    // Selalu izinkan: halaman maintenance itu sendiri & assets statis
    if (
      pathname === '/maintenance' ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/icons') ||
      pathname.startsWith('/images') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.ico')
    ) {
      return NextResponse.next()
    }

    // Cek bypass cookie (admin yang sudah bypass sebelumnya)
    const bypassCookie = request.cookies.get('maintenance_bypass')
    if (bypassCookie?.value === MAINTENANCE_BYPASS_KEY) {
      return NextResponse.next()
    }

    // Cek bypass query param: ?bypass=unimath-admin-2026
    const bypassParam = request.nextUrl.searchParams.get('bypass')
    if (bypassParam === MAINTENANCE_BYPASS_KEY) {
      // Set cookie bypass agar tidak perlu param terus
      const response = NextResponse.redirect(
        new URL(pathname, request.url)
      )
      response.cookies.set('maintenance_bypass', MAINTENANCE_BYPASS_KEY, {
        httpOnly: true,
        maxAge: 60 * 60 * 8, // 8 jam
        path: '/',
      })
      return response
    }

    // Izinkan API admin tetap berjalan (untuk admin yang sudah bypass)
    // API publik tetap diblokir kecuali admin
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.next()
    }

    // Semua request lainnya → redirect ke halaman maintenance
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NORMAL MODE (auth logic seperti biasa)
  // ─────────────────────────────────────────────────────────────────────────
  const userCookie = request.cookies.get('user')
  const tokenCookie = request.cookies.get('token')

  let user: { role?: Role } | null = null
  if (userCookie?.value) {
    try {
      user = JSON.parse(userCookie.value)
    } catch {
      user = null
    }
  }

  const isAuthenticated = !!(user && user.role && tokenCookie?.value)

  // ── Login/public pages for unauthenticated users ────────────────────
  if (PUBLIC_PATHS.has(pathname)) {
    if (isAuthenticated && user?.role) {
      return NextResponse.redirect(
        new URL(DASHBOARD_FOR_ROLE[user.role], request.url)
      )
    }
    return NextResponse.next()
  }

  // ── Protected paths by prefix ───────────────────────────────────────
  const isAdminPath = pathname.startsWith('/admin')
  const isTeacherPath = pathname.startsWith('/teacher')
  const isStudentPath = pathname.startsWith('/student')

  if (!isAdminPath && !isTeacherPath && !isStudentPath) {
    return NextResponse.next()
  }

  const requiredRole: Role = isAdminPath
    ? 'ADMIN'
    : isTeacherPath
      ? 'TEACHER'
      : 'STUDENT'

  if (!isAuthenticated) {
    const loginUrl = isAdminPath
      ? '/admin/login'
      : isTeacherPath
        ? '/teacher/login'
        : '/student/login'
    return NextResponse.redirect(new URL(loginUrl, request.url))
  }

  if (user?.role && user.role !== requiredRole) {
    return NextResponse.redirect(
      new URL(DASHBOARD_FOR_ROLE[user.role], request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match semua path kecuali Next.js internals dan static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
