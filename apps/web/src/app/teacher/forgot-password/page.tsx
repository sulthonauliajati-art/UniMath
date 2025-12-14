'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { Input } from '@/components/ui/Input'

type Step = 'email' | 'otp' | 'new-password' | 'success'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpId, setOtpId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/teacher/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (data.success) {
        setStep('otp')
      } else {
        setError(data.error?.message || 'Gagal mengirim OTP')
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/teacher/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()

      if (data.success) {
        setOtpId(data.otpId)
        setStep('new-password')
      } else {
        setError(data.error?.message || 'Kode OTP tidak valid')
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok')
      return
    }
    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/teacher/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpId, newPassword }),
      })
      const data = await res.json()

      if (data.success) {
        setStep('success')
      } else {
        setError(data.error?.message || 'Gagal reset password')
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <StarryBackground />

      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Lupa Password</h1>
              <p className="text-text-secondary text-sm">
                {step === 'email' && 'Masukkan email untuk reset password'}
                {step === 'otp' && 'Masukkan kode OTP yang dikirim ke email'}
                {step === 'new-password' && 'Buat password baru'}
                {step === 'success' && 'Password berhasil direset!'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Email */}
              {step === 'email' && (
                <motion.form
                  key="email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSendOtp}
                  className="space-y-5"
                >
                  <Input
                    label="Email"
                    type="email"
                    placeholder="guru@sekolah.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={error}
                    required
                  />
                  <NeonButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={loading}
                  >
                    Kirim Kode OTP
                  </NeonButton>
                </motion.form>
              )}

              {/* Step 2: OTP */}
              {step === 'otp' && (
                <motion.form
                  key="otp"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleVerifyOtp}
                  className="space-y-5"
                >
                  <div className="p-3 bg-uni-success/10 border border-uni-success/30 rounded-lg mb-4">
                    <p className="text-uni-success text-sm text-center">
                      ✓ Kode OTP telah dikirim ke {email}
                    </p>
                  </div>
                  <Input
                    label="Kode OTP"
                    placeholder="Masukkan 6 digit kode"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    error={error}
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-text-muted text-center">
                    Kode berlaku 10 menit. Cek folder spam jika tidak ada di inbox.
                  </p>
                  <NeonButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={loading}
                    disabled={otp.length !== 6}
                  >
                    Verifikasi
                  </NeonButton>
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="w-full text-sm text-text-secondary hover:text-white transition-colors"
                  >
                    ← Kembali
                  </button>
                </motion.form>
              )}

              {/* Step 3: New Password */}
              {step === 'new-password' && (
                <motion.form
                  key="new-password"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleResetPassword}
                  className="space-y-5"
                >
                  <Input
                    label="Password Baru"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Konfirmasi Password"
                    type="password"
                    placeholder="Ulangi password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={error}
                    required
                  />
                  <NeonButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={loading}
                  >
                    Reset Password
                  </NeonButton>
                </motion.form>
              )}

              {/* Step 4: Success */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="w-20 h-20 mx-auto bg-uni-success/20 rounded-full flex items-center justify-center">
                    <span className="text-4xl">✓</span>
                  </div>
                  <p className="text-white">
                    Password berhasil direset. Silakan login dengan password baru.
                  </p>
                  <NeonButton
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => router.push('/teacher/login')}
                  >
                    Login Sekarang
                  </NeonButton>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          <div className="text-center mt-6">
            <Link
              href="/teacher/login"
              className="text-text-secondary hover:text-white text-sm transition-colors"
            >
              ← Kembali ke login
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
