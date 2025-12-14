'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth/context'
import { User } from '@/lib/types'

export default function AdminLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (data.token && data.user) {
        login(data.user as User, data.token)
        router.push('/admin/dashboard')
      } else {
        setError(data.error?.message || 'Email atau password salah')
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
        >
          <GlassCard className="p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">🔐 Admin Panel</h1>
              <p className="text-text-secondary text-sm">Kelola materi dan soal latihan</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="admin@unimath.com"
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
            </form>
          </GlassCard>

          <div className="text-center mt-6">
            <a href="/" className="text-text-secondary hover:text-white text-sm">
              ← Kembali ke halaman utama
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
