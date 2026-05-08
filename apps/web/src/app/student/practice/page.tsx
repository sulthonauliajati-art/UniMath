'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TowerBackground, GlassCard } from '@/components/ui'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

export default function PracticePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [currentFloor, setCurrentFloor] = useState(1)
  const [currentMaterial, setCurrentMaterial] = useState('Penjumlahan Dasar')

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch('/api/student/progress')
        const data = await res.json()
        if (data.currentFloor) setCurrentFloor(data.currentFloor)
        if (data.currentMaterial) setCurrentMaterial(data.currentMaterial)
      } catch (error) {
        console.error('Failed to fetch progress:', error)
      }
    }
    if (user) fetchProgress()
  }, [user])

  const handleStartPractice = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'practice' }),
      })
      const data = await res.json()

      if (data.sessionId) {
        sessionStorage.setItem(
          'practiceSession',
          JSON.stringify({
            ...data,
            materialName: data.materialName || currentMaterial,
          })
        )
        router.push(`/student/practice/${data.materialId}/play`)
      }
    } catch (error) {
      console.error('Failed to start practice:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !user) {
    return <LoadingScreen />
  }

  return (
    <TowerBackground variant="practice">
      <section className="relative z-20 flex-1 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <GlassCard glowColor="cyan" intensity="strong" className="p-6 sm:p-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Siap Latihan?
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mb-6">
              Bantu robot naik gedung dengan menjawab soal!
            </p>

            <div className="bg-black/40 border border-cyan-500/20 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs sm:text-sm uppercase tracking-wide">
                  Lantai saat ini
                </span>
                <span className="text-cyan-300 font-bold text-base sm:text-lg">
                  {currentFloor}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs sm:text-sm uppercase tracking-wide">
                  Materi
                </span>
                <span className="text-white font-semibold text-sm sm:text-base truncate ml-2">
                  {currentMaterial}
                </span>
              </div>
            </div>

            <button
              onClick={handleStartPractice}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-bold text-base shadow-[0_0_24px_-4px_rgba(6,182,212,0.8)] hover:shadow-[0_0_32px_-4px_rgba(6,182,212,1)] disabled:opacity-60 disabled:cursor-not-allowed transition-shadow"
            >
              {loading ? 'Menyiapkan…' : '🚀 Mulai Latihan'}
            </button>

            <Link
              href="/student/dashboard"
              className="block mt-4 text-slate-400 hover:text-white text-xs sm:text-sm transition-colors"
            >
              ← Kembali ke Dashboard
            </Link>
          </GlassCard>
        </motion.div>
      </section>
    </TowerBackground>
  )
}
