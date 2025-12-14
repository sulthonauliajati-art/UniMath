import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { verifyPassword, createAuthToken } from '@/lib/auth/utils'

export async function POST(request: NextRequest) {
  try {
    const { nisn, password } = await request.json()

    if (!nisn || !password) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'NISN dan password diperlukan' } },
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

    if (student.passwordStatus === 'UNSET') {
      return NextResponse.json(
        { 
          error: { 
            code: 'AUTH_PASSWORD_NOT_SET', 
            message: 'Password belum diatur. Silakan atur password terlebih dahulu.' 
          },
          needSetPassword: true,
          studentName: student.name,
        },
        { status: 400 }
      )
    }

    if (!student.password) {
      return NextResponse.json(
        { error: { code: 'AUTH_PASSWORD_NOT_SET', message: 'Password belum diatur' } },
        { status: 400 }
      )
    }

    // Verify password (support both hashed and plain for migration)
    const isValidPassword = student.password.startsWith('$2')
      ? await verifyPassword(password, student.password)
      : student.password === password

    if (!isValidPassword) {
      return NextResponse.json(
        { error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Password salah' } },
        { status: 401 }
      )
    }

    // Create auth token
    const token = await createAuthToken(student.id, 'STUDENT')

    return NextResponse.json({
      token,
      user: {
        id: student.id,
        role: student.role,
        name: student.name,
        nisn: student.nisn,
        passwordStatus: student.passwordStatus,
        createdAt: student.createdAt,
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
