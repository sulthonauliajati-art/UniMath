import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { verifyPassword, createAuthToken } from '@/lib/auth/utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email dan password diperlukan' } },
        { status: 400 }
      )
    }

    const [teacher] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), eq(users.role, 'TEACHER')))
      .limit(1)

    if (!teacher) {
      return NextResponse.json(
        { error: { code: 'AUTH_USER_NOT_FOUND', message: 'Email tidak terdaftar' } },
        { status: 404 }
      )
    }

    if (!teacher.password) {
      return NextResponse.json(
        { error: { code: 'AUTH_PASSWORD_NOT_SET', message: 'Password belum diatur' } },
        { status: 400 }
      )
    }

    // Verify password (support both hashed and plain for migration)
    const isValidPassword = teacher.password.startsWith('$2')
      ? await verifyPassword(password, teacher.password)
      : teacher.password === password

    if (!isValidPassword) {
      return NextResponse.json(
        { error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Password salah' } },
        { status: 401 }
      )
    }

    // Create auth token
    const token = await createAuthToken(teacher.id, 'TEACHER')

    return NextResponse.json({
      token,
      user: {
        id: teacher.id,
        role: teacher.role,
        name: teacher.name,
        email: teacher.email,
        passwordStatus: teacher.passwordStatus,
        createdAt: teacher.createdAt,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
