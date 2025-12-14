import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { hashPassword, createAuthToken } from '@/lib/auth/utils'

export async function POST(request: NextRequest) {
  try {
    const { nisn, password } = await request.json()

    if (!nisn || !password) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'NISN dan password diperlukan' } },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Password minimal 6 karakter' } },
        { status: 400 }
      )
    }

    const [student] = await db
      .select()
      .from(users)
      .where(and(eq(users.nisn, nisn), eq(users.role, 'STUDENT')))
      .limit(1)

    if (!student) {
      return NextResponse.json(
        { error: { code: 'AUTH_USER_NOT_FOUND', message: 'NISN tidak ditemukan' } },
        { status: 404 }
      )
    }

    if (student.passwordStatus === 'SET') {
      return NextResponse.json(
        { error: { code: 'AUTH_PASSWORD_ALREADY_SET', message: 'Password sudah diatur. Hubungi guru untuk reset password.' } },
        { status: 400 }
      )
    }

    // Hash and update password
    const hashedPassword = await hashPassword(password)
    
    await db
      .update(users)
      .set({ password: hashedPassword, passwordStatus: 'SET' })
      .where(eq(users.id, student.id))

    // Create auth token
    const token = await createAuthToken(student.id, 'STUDENT')

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: student.id,
        role: student.role,
        name: student.name,
        nisn: student.nisn,
        passwordStatus: 'SET',
        createdAt: student.createdAt,
      },
    })
  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
