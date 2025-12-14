import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, passwordResetOtp } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendOtpEmail } from '@/lib/email/resend'

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email diperlukan' } },
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
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'Jika email terdaftar, kode OTP akan dikirim',
      })
    }

    // Generate OTP
    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

    // Save OTP to database
    const otpId = `OTP${Date.now().toString(36).toUpperCase()}`
    await db.insert(passwordResetOtp).values({
      id: otpId,
      userId: teacher.id,
      otp,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString(),
    })

    // Send email
    const emailResult = await sendOtpEmail(email, otp, teacher.name)

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error)
      return NextResponse.json(
        { error: { code: 'EMAIL_ERROR', message: 'Gagal mengirim email. Coba lagi.' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Kode OTP telah dikirim ke email',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
