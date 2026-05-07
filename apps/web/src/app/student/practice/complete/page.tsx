'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { StarryBackground, TowerBackground, GlassCard, NeonButton } from '@/components/ui'
import { useAuth } from '@/lib/auth/context'

interface PracticeStats {
  floorsClimbed: number
  correctAnswers: number
  totalAttempts: number
  materialId?: string
  materialTitle?: string
}

export default function PracticeCompletePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [stats, setStats] = useState<PracticeStats | null>(null)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
      return
    }

    // Load stats from sessionStorage
    const statsData = sessionStorage.getItem('practiceStats')
    if (statsData) {
      setStats(JSON.parse(statsData))
      sessionStorage.removeItem('practiceStats')
      
      // Fire confetti
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#00d4aa', '#00b4d8', '#ffffff', '#f6ad55'],
      })
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-uni-bg">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const accuracy = stats && stats.totalAttempts > 0 
    ? Math.round((stats.correctAnswers / stats.totalAttempts) * 100) 
    : 0

  // P1 Fix: Generate motivational message based on performance
  const getMotivationalMessage = () => {
    if (!stats) return { emoji: '🎉', title: 'Selamat!', message: 'Kamu udah berlatih untuk hari ini!' }
    
    if (accuracy >= 90) {
      return { emoji: '🌟', title: 'Luar Biasa!', message: 'Akurasi kamu sangat tinggi! Kamu siap naik level!' }
    } else if (accuracy >= 70) {
      return { emoji: '👏', title: 'Bagus Sekali!', message: 'Terus berlatih untuk hasil yang lebih baik!' }
    } else if (accuracy >= 50) {
      return { emoji: '💪', title: 'Semangat!', message: 'Coba ulangi materi ini untuk meningkatkan akurasi.' }
    } else {
      return { emoji: '📚', title: 'Jangan Menyerah!', message: 'Pelajari kembali materinya dan coba lagi ya!' }
    }
  }

  const motivation = getMotivationalMessage()

  // P1 Fix: Recommendation based on accuracy
  const getRecommendation = () => {
    if (!stats) return null
    if (accuracy >= 80) {
      return { text: 'Lanjut ke Materi Berikutnya', href: '/student/materials', variant: 'primary' as const }
    } else {
      return { text: 'Ulangi Latihan', href: stats.materialId ? `/student/practice/${stats.materialId}/start` : '/student/practice', variant: 'secondary' as const }
    }
  }

  const recommendation = getRecommendation()

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

            {/* Celebration illustration */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6 sm:mb-8 relative z-10"
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 mx-auto bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-2 border-uni-primary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                <span className="text-6xl sm:text-7xl">{motivation.emoji}</span>
              </div>
            </motion.div>

            {/* Message - P1 Fix: Dynamic motivational message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative z-10"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {motivation.title}
              </h1>
              <p className="text-text-secondary text-sm sm:text-base mb-6 sm:mb-8">
                {motivation.message}
              </p>
            </motion.div>

            {/* Stats */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 relative z-10"
              >
                <div className="bg-uni-bg-secondary/40 border border-uni-primary/20 rounded-xl p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-uni-primary drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">
                    {stats.floorsClimbed}
                  </div>
                  <div className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wider mt-1">Lantai</div>
                </div>
                <div className="bg-uni-bg-secondary/40 border border-uni-accent/20 rounded-xl p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-uni-accent drop-shadow-[0_0_8px_rgba(0,119,255,0.5)]">
                    {stats.correctAnswers}
                  </div>
                  <div className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wider mt-1">Benar</div>
                </div>
                <div className="bg-uni-bg-secondary/40 border border-white/10 rounded-xl p-4 text-center">
                  <div className={`text-2xl sm:text-3xl font-bold ${accuracy >= 70 ? 'text-uni-success drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : accuracy >= 50 ? 'text-uni-warning drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-uni-error drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}>
                    {accuracy}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wider mt-1">Akurasi</div>
                </div>
              </motion.div>
            )}

            {/* P1 Fix: Performance insight */}
            {stats && stats.totalAttempts > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-6 sm:mb-8 p-3 bg-black/30 border border-white/5 rounded-lg relative z-10"
              >
                <p className="text-xs sm:text-sm text-text-secondary">
                  Kamu menjawab <span className="text-uni-success font-semibold">{stats.correctAnswers}</span> benar 
                  dari <span className="text-white font-semibold">{stats.totalAttempts}</span> soal
                  {stats.totalAttempts - stats.correctAnswers > 0 && (
                    <span className="text-uni-error"> ({stats.totalAttempts - stats.correctAnswers} salah)</span>
                  )}
                </p>
              </motion.div>
            )}

            {/* Actions - P1 Fix: Clear action buttons with recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-3 sm:space-y-4 relative z-10"
            >
              {recommendation && (
                <Link href={recommendation.href} className="block">
                  <button className="w-full py-4 bg-gradient-to-r from-uni-primary to-uni-accent hover:from-uni-primary-dark hover:to-uni-primary rounded-xl text-white font-bold text-sm sm:text-base shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-transform hover:scale-[1.02]">
                    {recommendation.text}
                  </button>
                </Link>
              )}
              <Link href="/student/materials" className="block">
                <button className="w-full py-3 bg-black/40 border border-uni-primary/50 hover:bg-uni-primary/20 rounded-xl text-white font-bold text-sm sm:text-base transition-all shadow-[0_0_10px_rgba(0,229,255,0.1)]">
                  Pilih Materi Lain
                </button>
              </Link>
              <Link href="/student/dashboard" className="block">
                <button className="w-full py-3 bg-transparent hover:bg-white/5 rounded-xl text-text-secondary hover:text-white font-medium text-sm sm:text-base transition-colors">
                  Kembali ke Dashboard
                </button>
              </Link>
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>
    </main>
  )
}
