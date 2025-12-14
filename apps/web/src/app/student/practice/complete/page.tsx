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
                <span className="text-5xl sm:text-6xl">🎉</span>
              </div>
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
                Selamat!
              </h1>
              <p className="text-text-secondary text-sm sm:text-base mb-4 sm:mb-6">
                Kamu udah berlatih untuk hari ini! 🌟
              </p>
            </motion.div>

            {/* Stats */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8"
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
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {accuracy}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-text-secondary">Akurasi</div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-2 sm:space-y-3"
            >
              <Link href="/student/profile">
                <NeonButton variant="primary" size="lg" className="w-full">
                  Lihat Progress
                </NeonButton>
              </Link>
              <Link href="/student/dashboard">
                <NeonButton variant="secondary" size="lg" className="w-full">
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
