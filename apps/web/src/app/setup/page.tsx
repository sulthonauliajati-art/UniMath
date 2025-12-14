'use client'

import { useState } from 'react'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'

export default function SetupPage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const createAdmin = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/setup/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: 'setup-unimath-2024' }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage(`✅ Admin berhasil dibuat!\nEmail: ${data.credentials.email}\nPassword: ${data.credentials.password}`)
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Gagal membuat admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <StarryBackground />
      <div className="relative z-10 w-full max-w-md px-4">
        <GlassCard className="p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">🔧 Setup UniMath</h1>
          <p className="text-text-secondary mb-6">Buat akun admin untuk pertama kali</p>
          
          <NeonButton onClick={createAdmin} loading={loading} className="w-full mb-4">
            Buat Admin
          </NeonButton>

          {message && (
            <pre className="text-left text-sm p-4 bg-uni-bg-secondary/50 rounded-lg whitespace-pre-wrap">
              {message}
            </pre>
          )}

          <p className="text-xs text-text-muted mt-4">
            Hapus halaman ini setelah setup selesai!
          </p>
        </GlassCard>
      </div>
    </main>
  )
}
