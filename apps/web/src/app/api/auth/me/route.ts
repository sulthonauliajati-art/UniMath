import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

// Get current user from token
export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token diperlukan' } },
        { status: 401 }
      )
    }

    // Validate token
    const tokenData = await validateToken(token)
    if (!tokenData.valid || !tokenData.userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token tidak valid atau sudah expired' } },
        { status: 401 }
      )
    }

    // Get user
    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
        name: users.name,
        email: users.email,
        nisn: users.nisn,
        passwordStatus: users.passwordStatus,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, tokenData.userId))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User tidak ditemukan' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get me error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
