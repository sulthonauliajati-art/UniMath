import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateToken, verifyPassword, hashPassword, revokeAllUserTokens, createAuthToken } from '@/lib/auth/utils'

export async function POST(request: NextRequest) {
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
    if (!tokenData.valid || tokenData.role !== 'STUDENT') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token tidak valid' } },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Password lama dan baru diperlukan' } },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Password baru minimal 6 karakter' } },
        { status: 400 }
      )
    }

    // Get student
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenData.userId!))
      .limit(1)

    if (!student || !student.password) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Verify current password
    const isValidPassword = student.password.startsWith('$2')
      ? await verifyPassword(currentPassword, student.password)
      : student.password === currentPassword

    if (!isValidPassword) {
      return NextResponse.json(
        { error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Password lama salah' } },
        { status: 401 }
      )
    }

    // Hash and update new password
    const hashedPassword = await hashPassword(newPassword)
    
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, student.id))

    // Revoke all tokens and create new one
    await revokeAllUserTokens(student.id)
    const newToken = await createAuthToken(student.id, 'STUDENT')

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah',
      token: newToken,
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
