import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type Role = 'STUDENT' | 'TEACHER' | 'ADMIN'

/**
 * Maps a role to the dashboard URL the user should land on.
 */
const DASHBOARD_FOR_ROLE: Record<Role, string> = {
  ADMIN: '/admin/dashboard',
  TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
}

/**
 * Paths that don't require auth — must come BEFORE any role-based routes.
 * Anything else under /admin, /teacher, /student is protected.
 */
const PUBLIC_PATHS = new Set<string>([
  '/admin/login',
  '/teacher/login',
  '/teacher/register',
  '/teacher/forgot-password',
  '/teacher/reset-password',
  '/student/login',
])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
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
    // If already logged in with a valid role, kick them to their own
    // dashboard so they can't re-login as a different role accidentally.
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

  // Not authenticated → send to the corresponding login page
  if (!isAuthenticated) {
    const loginUrl = isAdminPath
      ? '/admin/login'
      : isTeacherPath
        ? '/teacher/login'
        : '/student/login'
    return NextResponse.redirect(new URL(loginUrl, request.url))
  }

  // Authenticated but wrong role → send to their own dashboard.
  // This is safer than a hard 403 for typical misnavigation, but API routes
  // themselves (under /api) independently enforce authorization, so data
  // cannot leak even if someone bypasses this client redirect.
  if (user?.role && user.role !== requiredRole) {
    return NextResponse.redirect(
      new URL(DASHBOARD_FOR_ROLE[user.role], request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Protect all role-scoped pages except Next.js internals
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
  ],
}
