/**
 * SERVER-SIDE AUTH UTILITIES
 *
 * Centralized authentication resolution for all API routes.
 * Use resolveAuthenticatedUserId() instead of duplicating the
 * token→cookie→legacy chain in every route handler.
 */
import { cookies } from 'next/headers'
import { validateToken } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'

/**
 * Resolve authenticated user ID from multiple sources, in priority order:
 *
 * 1. Authorization header (Bearer token) — preferred for programmatic access
 * 2. Cookie 'auth_token' — server-set token
 * 3. Cookie 'token' — client-set by AuthProvider login()
 * 4. Cookie 'user' (legacy) — JSON-parsed, validated format, NOT 'anonymous'
 *
 * Returns the userId string if any source yields a valid identity, or null.
 */
export async function resolveAuthenticatedUserId(
  request: NextRequest
): Promise<string | null> {
  // 1. Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim()
    if (token) {
      const t = await validateToken(token)
      if (t.valid && t.userId) return t.userId
    }
  }

  const cookieStore = await cookies()

  // 2. Cookie 'auth_token' (server-set token)
  const authToken = cookieStore.get('auth_token')
  if (authToken?.value) {
    const t = await validateToken(authToken.value)
    if (t.valid && t.userId) return t.userId
  }

  // 3. Cookie 'token' (client-set by AuthProvider)
  const tokenCookie = cookieStore.get('token')
  if (tokenCookie?.value) {
    const t = await validateToken(tokenCookie.value)
    if (t.valid && t.userId) return t.userId
  }

  // 4. Cookie 'user' (legacy) — parse and validate
  const userCookie = cookieStore.get('user')
  if (userCookie?.value) {
    try {
      const user = JSON.parse(userCookie.value)
      if (
        user.id &&
        typeof user.id === 'string' &&
        user.id !== 'anonymous' &&
        user.id.length > 0
      ) {
        return user.id
      }
    } catch {
      // invalid JSON — ignore
    }
  }

  return null
}

/**
 * Resolve authenticated user with role check.
 * Returns { userId, role } if authenticated, or null.
 */
export async function resolveAuthenticatedUser(
  request: NextRequest
): Promise<{ userId: string; role: 'STUDENT' | 'TEACHER' | 'ADMIN' } | null> {
  // 1. Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim()
    if (token) {
      const t = await validateToken(token)
      if (t.valid && t.userId && t.role) return { userId: t.userId, role: t.role }
    }
  }

  const cookieStore = await cookies()

  // 2. Cookie 'auth_token'
  const authToken = cookieStore.get('auth_token')
  if (authToken?.value) {
    const t = await validateToken(authToken.value)
    if (t.valid && t.userId && t.role) return { userId: t.userId, role: t.role }
  }

  // 3. Cookie 'token'
  const tokenCookie = cookieStore.get('token')
  if (tokenCookie?.value) {
    const t = await validateToken(tokenCookie.value)
    if (t.valid && t.userId && t.role) return { userId: t.userId, role: t.role }
  }

  // 4. Cookie 'user' (legacy) — role from the cookie JSON
  const userCookie = cookieStore.get('user')
  if (userCookie?.value) {
    try {
      const user = JSON.parse(userCookie.value)
      if (
        user.id &&
        typeof user.id === 'string' &&
        user.id !== 'anonymous' &&
        user.id.length > 0 &&
        user.role
      ) {
        return { userId: user.id, role: user.role }
      }
    } catch {
      // invalid JSON — ignore
    }
  }

  return null
}
