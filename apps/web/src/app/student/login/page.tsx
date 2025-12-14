'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth/context'
import { User } from '@/lib/types'

type Step = 'nisn' | 'password' | 'set-password' | 'register' | 'not-found'

export default function StudentLoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [step, setStep] = useState<Step>('nisn')
  const [nisn, setNisn] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [studentName, setStudentName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCheckNisn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/student/check-nisn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nisn }),
      })
      const data = await res.json()

      if (data.found) {
        setStudentName(data.name)
        if (data.needSetPassword) {
          setStep('set-password')
        } else {
          setStep('password')
        }
      } else {
        // NISN not found - offer to register
        setStep('not-found')
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nisn, password }),
      })
      const data = await res.json()

      if (data.token && data.user) {
        login(data.user as User, data.token)
        router.push('/student/dashboard')
      } else if (data.needSetPassword) {
        setStudentName(data.studentName)
        setStep('set-password')
      } else {
        setError(data.error?.message || 'Password salah')
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Password tidak cocok')
      return
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/student/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nisn, password }),
      })
      const data = await res.json()

      if (data.token && data.user) {
        login(data.user as User, data.token)
        router.push('/student/dashboard')
      } else {
        setError(data.error?.message || 'Gagal membuat password')
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Password tidak cocok')
      return
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }
    if (name.trim().length < 3) {
      setError('Nama minimal 3 karakter')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nisn, name: name.trim(), password }),
      })
      const data = await res.json()

      if (data.token && data.user) {
        login(data.user as User, data.token)
        router.push('/student/dashboard')
      } else {
        setError(data.error?.message || 'Gagal mendaftar')
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep('nisn')
    setNisn('')
    setName('')
    setPassword('')
    setConfirmPassword('')
    setStudentName('')
    setError('')
  }

  return (
    <main className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      <StarryBackground />

      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
                {step === 'register' ? 'Daftar Siswa' : 'Login Siswa'}
              </h1>
              <p className="text-text-secondary text-xs sm:text-sm">
                {step === 'nisn' && 'Masukkan NISN kamu'}
                {step === 'password' && `Halo, ${studentName}!`}
                {step === 'set-password' && `Halo, ${studentName}!`}
                {step === 'register' && 'Lengkapi data untuk mendaftar'}
                {step === 'not-found' && 'NISN belum terdaftar'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: NISN */}
              {step === 'nisn' && (
                <motion.form
                  key="nisn"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleCheckNisn}
                  className="space-y-6"
                >
                  <Input
                    label="NISN"
                    placeholder="Masukkan NISN"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value.replace(/\D/g, ''))}
                    error={error}
                    required
                  />
                  <NeonButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={loading}
                    disabled={nisn.length === 0}
                  >
                    Lanjutkan
                  </NeonButton>
                </motion.form>
              )}


              {/* Step 2a: Password (existing user) */}
              {step === 'password' && (
                <motion.form
                  key="password"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    Masuk
                  </NeonButton>
                  <div className="flex justify-between text-sm">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-text-secondary hover:text-white transition-colors"
                    >
                      ← Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Hubungi guru untuk reset password')}
                      className="text-uni-primary hover:text-uni-accent transition-colors"
                    >
                      Lupa password?
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Step 2b: Set Password (registered by teacher, first login) */}
              {step === 'set-password' && (
                <motion.form
                  key="set-password"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSetPassword}
                  className="space-y-6"
                >
                  <p className="text-text-secondary text-sm text-center mb-4">
                    Ini pertama kali kamu login. Silakan buat password untuk akun kamu.
                  </p>
                  <Input
                    label="Password Baru"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    Buat Password & Masuk
                  </NeonButton>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full text-sm text-text-secondary hover:text-white transition-colors"
                  >
                    ← Kembali
                  </button>
                </motion.form>
              )}

              {/* Not Found - Offer to Register */}
              {step === 'not-found' && (
                <motion.div
                  key="not-found"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="text-center space-y-6"
                >
                  <div className="w-16 h-16 mx-auto bg-uni-accent/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🎓</span>
                  </div>
                  <p className="text-text-secondary">
                    NISN <span className="text-white font-mono">{nisn}</span> belum terdaftar.
                  </p>
                  <p className="text-sm text-text-muted">
                    Kamu bisa mendaftar sekarang atau hubungi guru untuk didaftarkan.
                  </p>
                  <div className="space-y-3">
                    <NeonButton
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={() => setStep('register')}
                    >
                      Daftar Sekarang
                    </NeonButton>
                    <NeonButton
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      onClick={resetForm}
                    >
                      Coba NISN Lain
                    </NeonButton>
                  </div>
                </motion.div>
              )}

              {/* Register Form */}
              {step === 'register' && (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleRegister}
                  className="space-y-5"
                >
                  <div className="p-3 bg-uni-bg-secondary/30 rounded-lg mb-4">
                    <p className="text-xs text-text-muted text-center">
                      NISN: <span className="text-white font-mono">{nisn}</span>
                    </p>
                  </div>
                  <Input
                    label="Nama Lengkap"
                    placeholder="Masukkan nama lengkap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    Daftar & Masuk
                  </NeonButton>
                  <button
                    type="button"
                    onClick={() => setStep('not-found')}
                    className="w-full text-sm text-text-secondary hover:text-white transition-colors"
                  >
                    ← Kembali
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Back to landing */}
          <div className="text-center mt-4 sm:mt-6">
            <a href="/" className="text-text-secondary hover:text-white text-xs sm:text-sm transition-colors">
              ← Kembali ke halaman utama
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
