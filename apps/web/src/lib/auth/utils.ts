import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { authTokens, users } from '@/lib/db/schema'
import { eq, and, gt } from 'drizzle-orm'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(prefix: string, userId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `${prefix}_${userId}_${timestamp}_${random}`
}

export async function createAuthToken(
  userId: string,
  role: 'STUDENT' | 'TEACHER' | 'ADMIN',
  expiresInDays: number = 7
): Promise<string> {
  const token = generateToken(role.toLowerCase(), userId)
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()

  await db.insert(authTokens).values({
    token,
    userId,
    role,
    expiresAt,
  })

  return token
}

export async function validateToken(token: string): Promise<{
  valid: boolean
  userId?: string
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN'
}> {
  if (!token) return { valid: false }

  const [authToken] = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.token, token),
        gt(authTokens.expiresAt, new Date().toISOString())
      )
    )
    .limit(1)

  if (!authToken) return { valid: false }

  return {
    valid: true,
    userId: authToken.userId,
    role: authToken.role,
  }
}

export async function revokeToken(token: string): Promise<boolean> {
  const result = await db.delete(authTokens).where(eq(authTokens.token, token))
  return true
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db.delete(authTokens).where(eq(authTokens.userId, userId))
}

export async function getUserById(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return user
}
