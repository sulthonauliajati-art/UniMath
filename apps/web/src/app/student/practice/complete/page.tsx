'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
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
    <main className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      <StarryBackground />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-6 sm:p-8 text-center">
            {/* Celebration illustration */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-4 sm:mb-6"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-uni-primary/20 to-uni-accent/20 rounded-full flex items-center justify-center">
                <span className="text-5xl sm:text-6xl">{motivation.emoji}</span>
              </div>
            </motion.div>

            {/* Message - P1 Fix: Dynamic motivational message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
                {motivation.title}
              </h1>
              <p className="text-text-secondary text-sm sm:text-base mb-4 sm:mb-6">
                {motivation.message}
              </p>
            </motion.div>

            {/* Stats */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6"
              >
                <div className="bg-uni-bg-secondary/50 rounded-xl p-3 sm:p-4">
                  <div className="text-xl sm:text-2xl font-bold text-uni-primary">
                    {stats.floorsClimbed}
                  </div>
                  <div className="text-[10px] sm:text-xs text-text-secondary">Lantai</div>
                </div>
                <div className="bg-uni-bg-secondary/50 rounded-xl p-3 sm:p-4">
                  <div className="text-xl sm:text-2xl font-bold text-uni-accent">
                    {stats.correctAnswers}
                  </div>
                  <div className="text-[10px] sm:text-xs text-text-secondary">Benar</div>
                </div>
                <div className="bg-uni-bg-secondary/50 rounded-xl p-3 sm:p-4">
                  <div className={`text-xl sm:text-2xl font-bold ${accuracy >= 70 ? 'text-uni-success' : accuracy >= 50 ? 'text-uni-warning' : 'text-uni-error'}`}>
                    {accuracy}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-text-secondary">Akurasi</div>
                </div>
              </motion.div>
            )}

            {/* P1 Fix: Performance insight */}
            {stats && stats.totalAttempts > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-4 sm:mb-6 p-3 bg-uni-bg-secondary/30 rounded-lg"
              >
                <p className="text-xs sm:text-sm text-text-secondary">
                  Kamu menjawab <span className="text-uni-success font-semibold">{stats.correctAnswers}</span> benar 
                  dari <span className="text-white font-semibold">{stats.totalAttempts}</span> soal
                  {stats.totalAttempts - stats.correctAnswers > 0 && (
                    <span> ({stats.totalAttempts - stats.correctAnswers} salah)</span>
                  )}
                </p>
              </motion.div>
            )}

            {/* Actions - P1 Fix: Clear action buttons with recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-2 sm:space-y-3"
            >
              {recommendation && (
                <Link href={recommendation.href}>
                  <NeonButton variant={recommendation.variant} size="lg" className="w-full">
                    {recommendation.text}
                  </NeonButton>
                </Link>
              )}
              <Link href="/student/materials">
                <NeonButton variant="secondary" size="lg" className="w-full">
                  Pilih Materi Lain
                </NeonButton>
              </Link>
              <Link href="/student/dashboard">
                <NeonButton variant="ghost" size="lg" className="w-full">
                  Kembali ke Dashboard
                </NeonButton>
              </Link>
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>
    </main>
  )
}
