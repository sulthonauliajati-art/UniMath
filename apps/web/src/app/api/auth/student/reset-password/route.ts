import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { validateToken, revokeAllUserTokens } from '@/lib/auth/utils'

// Reset password siswa (oleh guru)
// Ini akan mengubah status password menjadi UNSET
// Siswa harus set password baru saat login berikutnya
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

    // Validate token - must be teacher
    const tokenData = await validateToken(token)
    if (!tokenData.valid || tokenData.role !== 'TEACHER') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Hanya guru yang dapat reset password siswa' } },
        { status: 401 }
      )
    }

    const { studentId } = await request.json()

    if (!studentId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'ID siswa diperlukan' } },
        { status: 400 }
      )
    }

    // Find student
    const [student] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, studentId), eq(users.role, 'STUDENT')))
      .limit(1)

    if (!student) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Siswa tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Reset password - set to null and status to UNSET
    await db
      .update(users)
      .set({ password: null, passwordStatus: 'UNSET' })
      .where(eq(users.id, studentId))

    // Revoke all student's tokens (force logout)
    await revokeAllUserTokens(studentId)

    return NextResponse.json({
      success: true,
      message: `Password ${student.name} berhasil direset. Siswa harus mengatur password baru saat login.`,
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
