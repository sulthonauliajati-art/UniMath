'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface Stats {
  totalFloors: number
  accuracy: number
  totalSessions: number
}

export default function StudentDashboard() {
  const router = useRouter()
  const { user, token, isLoading, logout } = useAuth()
  const [stats, setStats] = useState<Stats>({ totalFloors: 0, accuracy: 0, totalSessions: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  // P1 Fix: Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)

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
            totalSessions: data.stats?.totalSessions || 0,
          })
          
          // P1 Fix: Show onboarding for new users (no sessions yet)
          const hasSeenOnboarding = localStorage.getItem('unimath_onboarding_seen')
          if (data.stats?.totalSessions === 0 && !hasSeenOnboarding) {
            setShowOnboarding(true)
          }
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

  const handleCloseOnboarding = () => {
    setShowOnboarding(false)
    localStorage.setItem('unimath_onboarding_seen', 'true')
  }

  const onboardingSteps = [
    {
      emoji: '🤖',
      title: 'Bantu Robot Naik Gedung!',
      description: 'Jawab soal matematika dengan benar untuk membantu robot naik ke lantai berikutnya.',
    },
    {
      emoji: '🏢',
      title: 'Naik Lantai = Progress',
      description: 'Setiap jawaban benar = naik 1 lantai. Semakin tinggi lantai, semakin hebat kamu!',
    },
    {
      emoji: '🎯',
      title: 'Akurasi Penting!',
      description: 'Jawab dengan teliti. Akurasi tinggi menunjukkan kamu sudah menguasai materi.',
    },
  ]

  if (isLoading || !user) {
    return <LoadingScreen />
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />
      
      {/* P1 Fix: Onboarding Modal */}
      <Modal isOpen={showOnboarding} onClose={handleCloseOnboarding} title="Cara Bermain 🎮">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-uni-primary/20 to-uni-accent/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">{onboardingSteps[onboardingStep].emoji}</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {onboardingSteps[onboardingStep].title}
          </h3>
          <p className="text-text-secondary text-sm mb-6">
            {onboardingSteps[onboardingStep].description}
          </p>
          
          {/* Step indicators */}
          <div className="flex justify-center gap-2 mb-4">
            {onboardingSteps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i === onboardingStep ? 'bg-uni-primary' : 'bg-white/20'}`}
              />
            ))}
          </div>
          
          <div className="flex gap-3 justify-center">
            {onboardingStep > 0 && (
              <button
                onClick={() => setOnboardingStep(onboardingStep - 1)}
                className="px-4 py-2 text-sm bg-white/10 text-text-secondary hover:text-white rounded-lg transition-colors"
              >
                ← Sebelumnya
              </button>
            )}
            {onboardingStep < onboardingSteps.length - 1 ? (
              <button
                onClick={() => setOnboardingStep(onboardingStep + 1)}
                className="px-4 py-2 text-sm bg-uni-primary/20 text-uni-primary hover:bg-uni-primary/30 rounded-lg transition-colors"
              >
                Selanjutnya →
              </button>
            ) : (
              <button
                onClick={handleCloseOnboarding}
                className="px-4 py-2 text-sm bg-uni-success/20 text-uni-success hover:bg-uni-success/30 rounded-lg transition-colors"
              >
                Mulai Bermain! 🚀
              </button>
            )}
          </div>
        </div>
      </Modal>
      
      <div className="relative z-10 p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start gap-2 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
              Halo, {user.name}! 👋
            </h1>
            <p className="text-text-secondary text-sm sm:text-base">Siap belajar hari ini?</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* P1 Fix: Help button to show onboarding again */}
            <button
              onClick={() => { setOnboardingStep(0); setShowOnboarding(true) }}
              className="text-text-secondary hover:text-white transition-colors text-sm px-2 py-1"
              title="Cara bermain"
            >
              ❓
            </button>
            <button
              onClick={() => {
                logout()
                router.push('/student/login')
              }}
              className="text-text-secondary hover:text-white transition-colors text-sm px-2 py-1"
            >
              Logout
            </button>
          </div>
        </div>

        {/* P1 Fix: Compact layout with CTA at top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <GlassCard className="p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-uni-primary/20 to-uni-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl">🤖</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg sm:text-xl font-bold text-uni-primary">
                    {loadingStats ? '...' : stats.totalFloors}
                  </span>
                  <span className="text-text-secondary text-sm">Lantai</span>
                  <span className="text-lg sm:text-xl font-bold text-uni-accent">
                    {loadingStats ? '...' : `${stats.accuracy}%`}
                  </span>
                  <span className="text-text-secondary text-sm">Akurasi</span>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary">
                  {stats.totalSessions === 0 
                    ? 'Belum ada latihan. Mulai sekarang!' 
                    : `${stats.totalSessions} sesi latihan selesai`}
                </p>
              </div>
              <Link href="/student/practice" className="flex-shrink-0">
                <NeonButton variant="primary" size="md">
                  Latihan
                </NeonButton>
              </Link>
            </div>
          </GlassCard>
        </motion.div>

        {/* P1 Fix: Grid layout for desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 sm:gap-4"
        >
          <Link href="/student/materials">
            <GlassCard hover className="p-4 h-full">
              <div className="w-10 h-10 bg-uni-primary/20 rounded-xl flex items-center justify-center mb-2">
                <span className="text-xl">📚</span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-white">Daftar Materi</h3>
              <p className="text-xs text-text-secondary">Pilih materi latihan</p>
            </GlassCard>
          </Link>

          <Link href="/student/leaderboard">
            <GlassCard hover className="p-4 h-full">
              <div className="w-10 h-10 bg-uni-warning/20 rounded-xl flex items-center justify-center mb-2">
                <span className="text-xl">🏆</span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-white">Leaderboard</h3>
              <p className="text-xs text-text-secondary">Lihat peringkat</p>
            </GlassCard>
          </Link>

          <Link href="/student/achievements">
            <GlassCard hover className="p-4 h-full">
              <div className="w-10 h-10 bg-uni-success/20 rounded-xl flex items-center justify-center mb-2">
                <span className="text-xl">🎖️</span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-white">Achievements</h3>
              <p className="text-xs text-text-secondary">Kumpulkan badge</p>
            </GlassCard>
          </Link>

          <Link href="/student/profile">
            <GlassCard hover className="p-4 h-full">
              <div className="w-10 h-10 bg-uni-accent/20 rounded-xl flex items-center justify-center mb-2">
                <span className="text-xl">👤</span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-white">Profil Saya</h3>
              <p className="text-xs text-text-secondary">Lihat statistik</p>
            </GlassCard>
          </Link>
        </motion.div>
      </div>
    </main>
  )
}
