import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userCookie = request.cookies.get('user')
  const tokenCookie = request.cookies.get('token')

  let user = null
  if (userCookie?.value) {
    try {
      user = JSON.parse(userCookie.value)
    } catch (e) {
      // ignore
    }
  }

  // Paths to protect (excluding login and api routes)
  const isAdminPath = pathname.startsWith('/admin') && !pathname.includes('/login')
  const isTeacherPath = pathname.startsWith('/teacher') && !pathname.includes('/login')
  const isStudentPath = pathname.startsWith('/student') && !pathname.includes('/login')
  
  // Login paths
  const isAdminLogin = pathname === '/admin/login'
  const isTeacherLogin = pathname === '/teacher/login'
  const isStudentLogin = pathname === '/student/login'

  // If trying to access protected paths without auth or wrong role
  if (isAdminPath) {
    if (!tokenCookie || !user || user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  if (isTeacherPath) {
    if (!tokenCookie || !user || user.role !== 'TEACHER') {
      return NextResponse.redirect(new URL('/teacher/login', request.url))
    }
  }

  if (isStudentPath) {
    if (!tokenCookie || !user || user.role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/student/login', request.url))
    }
  }

  // If authenticated user tries to access login page, redirect to dashboard
  if (user && tokenCookie) {
    if (isAdminLogin && user.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    if (isTeacherLogin && user.role === 'TEACHER') {
      return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
    }
    if (isStudentLogin && user.role === 'STUDENT') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*'
  ],
}
