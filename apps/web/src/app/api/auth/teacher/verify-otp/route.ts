import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, passwordResetOtp } from '@/lib/db/schema'
import { eq, and, gt } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email dan OTP diperlukan' } },
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
        { error: { code: 'INVALID_OTP', message: 'Kode OTP tidak valid' } },
        { status: 400 }
      )
    }

    // Find valid OTP
    const now = new Date().toISOString()
    const [validOtp] = await db
      .select()
      .from(passwordResetOtp)
      .where(
        and(
          eq(passwordResetOtp.userId, teacher.id),
          eq(passwordResetOtp.otp, otp),
          eq(passwordResetOtp.used, false),
          gt(passwordResetOtp.expiresAt, now)
        )
      )
      .limit(1)

    if (!validOtp) {
      return NextResponse.json(
        { error: { code: 'INVALID_OTP', message: 'Kode OTP tidak valid atau sudah kadaluarsa' } },
        { status: 400 }
      )
    }

    // Generate reset token (temporary token for password reset)
    const resetToken = `RST${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`

    return NextResponse.json({
      success: true,
      resetToken,
      otpId: validOtp.id,
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
