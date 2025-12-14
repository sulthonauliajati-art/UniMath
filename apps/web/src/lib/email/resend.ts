import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOtpEmail(to: string, otp: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'UniMath <noreply@unimath.haisa.com>',
      to: [to],
      subject: 'Kode OTP Reset Password - UniMath',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 16px;">
            <h1 style="color: #00d9ff; margin: 0 0 20px 0; text-align: center;">🚀 UniMath</h1>
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
              <p style="color: #ffffff; margin: 0 0 15px 0;">Halo ${name},</p>
              <p style="color: #b0b0b0; margin: 0 0 20px 0;">
                Kamu meminta untuk reset password akun UniMath. Gunakan kode OTP berikut:
              </p>
              <div style="background: #00d9ff; color: #1a1a2e; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 12px; letter-spacing: 8px; margin: 20px 0;">
                ${otp}
              </div>
              <p style="color: #b0b0b0; margin: 20px 0 0 0; font-size: 14px;">
                ⏰ Kode ini berlaku selama <strong style="color: #ffffff;">10 menit</strong>.
              </p>
              <p style="color: #b0b0b0; margin: 10px 0 0 0; font-size: 14px;">
                Jika kamu tidak meminta reset password, abaikan email ini.
              </p>
            </div>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} UniMath - Platform Latihan Matematika
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Send email error:', error)
    return { success: false, error }
  }
}
