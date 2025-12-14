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

type Tab = 'login' | 'register'

export default function TeacherLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (data.token && data.user) {
        login(data.user as User, data.token)
        router.push('/teacher/dashboard')
      } else {
        setError(data.error?.message || 'Email atau password salah')
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

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/teacher/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()

      if (data.token && data.user) {
        login(data.user as User, data.token)
        router.push('/teacher/dashboard')
      } else {
        setError(data.error?.message || 'Gagal mendaftar')
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (newTab: Tab) => {
    setTab(newTab)
    setError('')
    setEmail('')
    setPassword('')
    setName('')
    setConfirmPassword('')
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
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Portal Guru</h1>
              <p className="text-text-secondary text-sm">
                Kelola kelas dan pantau progress siswa
              </p>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => switchTab('login')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  tab === 'login'
                    ? 'bg-uni-primary text-white'
                    : 'bg-uni-bg-secondary/50 text-text-secondary hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => switchTab('register')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  tab === 'register'
                    ? 'bg-uni-primary text-white'
                    : 'bg-uni-bg-secondary/50 text-text-secondary hover:text-white'
                }`}
              >
                Daftar
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* Login Form */}
              {tab === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
                  <Input
                    label="Email"
                    type="email"
                    placeholder="guru@sekolah.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
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

                </motion.form>
              )}

              {/* Register Form */}
              {tab === 'register' && (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleRegister}
                  className="space-y-5"
                >
                  <Input
                    label="Nama Lengkap"
                    placeholder="Nama lengkap Anda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="guru@sekolah.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    Daftar
                  </NeonButton>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Demo credentials hint */}
            <div className="mt-6 p-3 bg-uni-bg-secondary/30 rounded-lg">
              <p className="text-xs text-text-muted text-center">
                Demo: guru@demo.com / demo123
              </p>
            </div>
          </GlassCard>

          {/* Back to landing */}
          <div className="text-center mt-6">
            <a href="/" className="text-text-secondary hover:text-white text-sm transition-colors">
              ← Kembali ke halaman utama
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
