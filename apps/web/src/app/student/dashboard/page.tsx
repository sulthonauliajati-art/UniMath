'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { useAuth } from '@/lib/auth/context'

interface Stats {
  totalFloors: number
  accuracy: number
}

export default function StudentDashboard() {
  const router = useRouter()
  const { user, token, isLoading, logout } = useAuth()
  const [stats, setStats] = useState<Stats>({ totalFloors: 0, accuracy: 0 })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function fetchStats() {
      if (!token) return
      try {
        const res = await fetch('/api/student/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setStats({
            totalFloors: data.stats?.totalFloors || 0,
            accuracy: data.stats?.accuracy || 0,
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }
    if (user && token) {
      fetchStats()
    }
  }, [user, token])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-uni-bg">
        <div className="text-white">Loading...</div>
      </div>
    )
  }


  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />
      
      <div className="relative z-10 p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start gap-2 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
              Halo, {user.name}! 👋
            </h1>
            <p className="text-text-secondary text-sm sm:text-base">Siap belajar hari ini?</p>
          </div>
          <button
            onClick={() => {
              logout()
              router.push('/student/login')
            }}
            className="text-text-secondary hover:text-white transition-colors text-sm flex-shrink-0 px-2 py-1"
          >
            Logout
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <GlassCard className="p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-uni-primary">
              {loadingStats ? '...' : stats.totalFloors}
            </div>
            <div className="text-xs sm:text-sm text-text-secondary">Lantai Tercapai</div>
          </GlassCard>
          <GlassCard className="p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-uni-accent">
              {loadingStats ? '...' : `${stats.accuracy}%`}
            </div>
            <div className="text-xs sm:text-sm text-text-secondary">Akurasi</div>
          </GlassCard>
        </div>

        {/* Main Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 sm:space-y-4"
        >
          <Link href="/student/materials">
            <GlassCard hover className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-uni-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl">📚</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-white">Daftar Materi</h3>
                <p className="text-xs sm:text-sm text-text-secondary">Lihat materi dan mulai latihan</p>
              </div>
              <span className="text-text-muted flex-shrink-0">→</span>
            </GlassCard>
          </Link>

          <Link href="/student/leaderboard">
            <GlassCard hover className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-uni-warning/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl">🏆</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-white">Leaderboard</h3>
                <p className="text-xs sm:text-sm text-text-secondary">Lihat peringkat kamu</p>
              </div>
              <span className="text-text-muted flex-shrink-0">→</span>
            </GlassCard>
          </Link>

          <Link href="/student/achievements">
            <GlassCard hover className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-uni-success/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl">🎖️</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-white">Achievements</h3>
                <p className="text-xs sm:text-sm text-text-secondary">Kumpulkan badge dan reward</p>
              </div>
              <span className="text-text-muted flex-shrink-0">→</span>
            </GlassCard>
          </Link>

          <Link href="/student/profile">
            <GlassCard hover className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-uni-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-white">Profil Saya</h3>
                <p className="text-xs sm:text-sm text-text-secondary">Lihat progress dan statistik</p>
              </div>
              <span className="text-text-muted flex-shrink-0">→</span>
            </GlassCard>
          </Link>
        </motion.div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 sm:mt-8"
        >
          <GlassCard className="p-5 sm:p-6 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-uni-primary/20 to-uni-accent/20 rounded-full flex items-center justify-center">
              <span className="text-3xl sm:text-4xl">🤖</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
              Lanjutkan Latihan
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary mb-3 sm:mb-4">
              Bantu robot naik gedung dengan menjawab soal!
            </p>
            <Link href="/student/practice">
              <NeonButton variant="primary" size="lg" className="w-full sm:w-auto">
                Mulai Latihan
              </NeonButton>
            </Link>
          </GlassCard>
        </motion.div>
      </div>
    </main>
  )
}
