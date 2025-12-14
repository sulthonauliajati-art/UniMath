import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token diperlukan' } },
        { status: 401 }
      )
    }

    const tokenData = await validateToken(token)
    if (!tokenData.valid || tokenData.role !== 'TEACHER') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token tidak valid' } },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get student
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Siswa tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Reset password - set passwordStatus to UNSET and clear password
    await db
      .update(users)
      .set({
        password: null,
        passwordStatus: 'UNSET',
      })
      .where(eq(users.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
