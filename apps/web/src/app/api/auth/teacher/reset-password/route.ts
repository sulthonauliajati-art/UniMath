import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, passwordResetOtp } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, otpId, newPassword } = await request.json()

    if (!email || !otpId || !newPassword) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Data tidak lengkap' } },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Password minimal 6 karakter' } },
        { status: 400 }
      )
    }

    // Find teacher by email
    const [teacher] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.role, 'TEACHER')))
      .limit(1)

    if (!teacher) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Verify OTP record exists and belongs to this user
    const [otpRecord] = await db
      .select()
      .from(passwordResetOtp)
      .where(
        and(
          eq(passwordResetOtp.id, otpId),
          eq(passwordResetOtp.userId, teacher.id),
          eq(passwordResetOtp.used, false)
        )
      )
      .limit(1)

    if (!otpRecord) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Request tidak valid' } },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordStatus: 'SET',
      })
      .where(eq(users.id, teacher.id))

    // Mark OTP as used
    await db
      .update(passwordResetOtp)
      .set({ used: true })
      .where(eq(passwordResetOtp.id, otpId))

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
