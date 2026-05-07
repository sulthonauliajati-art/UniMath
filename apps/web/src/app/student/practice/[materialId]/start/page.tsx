'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground, TowerBackground, RobotMascot, GlassCard, NeonButton } from '@/components/ui'
import { useAuth } from '@/lib/auth/context'
import { mockMaterials } from '@/data/mock/seed'

export default function PracticeStartPage() {
  const params = useParams()
  const materialId = params.materialId as string
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [mode, setMode] = useState<'pretest' | 'posttest'>('pretest')
  const [loading, setLoading] = useState(false)

  const material = mockMaterials.find((m) => m.id === materialId)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  const handleStart = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId, mode }),
      })
      const data = await res.json()
      if (data.sessionId) {
        // Store session in sessionStorage for the game
        sessionStorage.setItem('practiceSession', JSON.stringify({
          ...data,
          materialName: material?.title || 'Matematika',
        }))
        router.push(`/student/practice/${materialId}/play`)
      }
    } catch (error) {
      console.error('Failed to start practice:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-uni-bg">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <main className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-uni-bg pb-24 pt-20">
      <StarryBackground density="high" />
      <TowerBackground variant="flat" />
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-30 flex justify-between items-center">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-uni-primary to-uni-accent flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.3)]">
            <span className="text-white font-bold text-lg leading-none">U</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide hidden sm:block">Unimath</span>
        </div>

        {/* Right: Static Info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
             <div className="text-white font-semibold text-sm">{user.name}</div>
             <div className="text-uni-primary text-xs">Siswa Aktif</div>
          </div>
          <div className="w-10 h-10 rounded-full border border-uni-primary bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.2)] overflow-hidden">
             <span className="text-xl">🤖</span>
          </div>
        </div>
      </div>
      
      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-6 sm:p-10 text-center glass-strong border-uni-primary/40 relative">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-uni-primary/10 blur-[40px] pointer-events-none"></div>

            {/* Robot illustration */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 sm:mb-8 relative z-10"
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 mx-auto bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-2 border-uni-primary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                <span className="text-6xl sm:text-7xl">🤖</span>
              </div>
            </motion.div>

            {/* Material title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 relative z-10">
              {material?.title || 'Latihan'}
            </h1>
            <p className="text-text-secondary text-sm sm:text-base mb-6 sm:mb-8 relative z-10">
              Bantu robot naik gedung dengan menjawab soal!
            </p>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-8 p-1.5 bg-black/30 border border-white/10 rounded-xl relative z-10">
              <button
                onClick={() => setMode('pretest')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                  mode === 'pretest'
                    ? 'bg-uni-primary text-white shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                Pre-test
              </button>
              <button
                onClick={() => setMode('posttest')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                  mode === 'posttest'
                    ? 'bg-uni-primary text-white shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                Post-test
              </button>
            </div>

            {/* Start button */}
            <div className="relative z-10">
              <button
                className="w-full py-4 bg-gradient-to-r from-uni-primary to-uni-accent hover:from-uni-primary-dark hover:to-uni-primary rounded-xl text-white font-bold text-lg shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center gap-3 transition-transform hover:scale-105"
                onClick={handleStart}
                disabled={loading}
              >
                {loading ? 'Menyiapkan...' : '🚀 Mulai Latihan'}
              </button>
            </div>

            {/* Back link */}
            <Link
              href="/student/materials"
              className="block mt-4 sm:mt-6 text-text-secondary hover:text-white text-xs sm:text-sm transition-colors"
            >
              ← Kembali ke Daftar Materi
            </Link>
          </GlassCard>
        </motion.div>
      </div>
    </main>
  )
}
