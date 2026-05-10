'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground, TowerBackground, RobotMascot, GlassCard, NeonButton } from '@/components/ui'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
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
    <main className="relative min-h-[100dvh] bg-uni-bg overflow-hidden flex flex-col pb-24">
      <StarryBackground density="high" />
      <TowerBackground variant="landing" />
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-30 flex justify-between items-center">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-uni-primary to-uni-accent flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.3)]">
            <span className="text-white font-bold text-lg leading-none">U</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide hidden sm:block">Unimath</span>
        </div>

        {/* Right: Student Profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
             <div className="text-white font-semibold text-sm">{user.name}</div>
             <div className="text-uni-primary text-xs">Siswa Aktif</div>
          </div>
          <Link href="/student/profile" className="w-10 h-10 rounded-full border border-uni-primary bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.2)] overflow-hidden hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-shadow" title="Profil Anda">
             <span className="text-xl">🤖</span>
          </Link>
          <button
            onClick={async () => {
               await logout()
               router.push('/student/login')
            }}
            className="ml-2 text-text-muted hover:text-white transition-colors"
            title="Logout"
          >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
          </button>
        </div>
      </div>

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
                className={`w-2 h-2 rounded-full transition-colors ${i === onboardingStep ? 'bg-uni-primary shadow-[0_0_5px_var(--primary-glow)]' : 'bg-white/20'}`}
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
                className="px-4 py-2 text-sm bg-uni-primary/20 text-uni-primary hover:bg-uni-primary/30 border border-uni-primary/30 rounded-lg transition-colors shadow-[0_0_10px_rgba(0,229,255,0.2)]"
              >
                Selanjutnya →
              </button>
            ) : (
              <button
                onClick={handleCloseOnboarding}
                className="px-4 py-2 text-sm bg-gradient-to-r from-uni-primary to-uni-accent text-white font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(0,229,255,0.4)]"
              >
                Mulai Bermain! 🚀
              </button>
            )}
          </div>
        </div>
      </Modal>
      
      <div className="relative z-20 flex-grow flex flex-col items-center justify-center px-4 pt-24 pb-8 max-w-lg mx-auto w-full">
        
        {/* Main Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full mb-8 relative"
        >
           {/* Top Hexagon Badge */}
           <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30">
             <div className="w-12 h-12 bg-uni-bg-secondary rounded-xl border border-uni-accent shadow-[0_0_15px_rgba(0,119,255,0.5)] rotate-45 flex items-center justify-center">
               <span className="-rotate-45 text-uni-accent font-bold text-xl">{stats.totalFloors}</span>
             </div>
           </div>

          <GlassCard className="p-6 pt-10 text-center glass-strong border-uni-primary/40 relative overflow-hidden group">
            {/* Ambient inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-uni-primary/10 blur-[30px] rounded-full pointer-events-none"></div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Lanjut Berlatih, {user.name.split(' ')[0]}!
            </h2>
            <p className="text-uni-primary text-sm font-medium mb-6">
              Lantai Saat Ini: {loadingStats ? '...' : stats.totalFloors}
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 mb-8 bg-black/20 rounded-xl p-3 border border-white/5">
              <div className="text-center">
                 <div className="text-xl mb-1">🎯</div>
                 <div className="text-lg font-bold text-white">{loadingStats ? '...' : `${stats.accuracy}%`}</div>
                 <div className="text-[10px] text-text-secondary uppercase tracking-wider">Akurasi</div>
              </div>
              <div className="text-center border-l border-r border-white/10">
                 <div className="text-xl mb-1">⭐</div>
                 <div className="text-lg font-bold text-uni-warning">{stats.totalFloors * 10}</div>
                 <div className="text-[10px] text-text-secondary uppercase tracking-wider">Poin</div>
              </div>
              <div className="text-center">
                 <div className="text-xl mb-1">🏆</div>
                 <div className="text-lg font-bold text-uni-success">12</div>
                 <div className="text-[10px] text-text-secondary uppercase tracking-wider">Ranking</div>
              </div>
            </div>

            <Link href="/student/practice" className="block w-full">
              <button className="w-full py-4 bg-gradient-to-r from-uni-primary to-uni-accent hover:from-uni-primary-dark hover:to-uni-primary rounded-xl text-white font-bold text-lg shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center gap-3 transition-transform hover:scale-105">
                {stats.totalSessions === 0 ? 'Mulai Misi Pertama' : 'Lanjut Perjalanan'}
                <span className="text-xl leading-none">›</span>
              </button>
            </Link>
          </GlassCard>
        </motion.div>

        {/* Secondary Navigation Options */}
        <div className="grid grid-cols-2 gap-4 w-full relative z-20">
           <Link href="/student/materials">
              <GlassCard hover className="p-4 flex flex-col items-center justify-center text-center h-full glass-strong">
                 <div className="w-12 h-12 bg-uni-bg/50 rounded-full border border-uni-primary/30 flex items-center justify-center mb-3 text-2xl shadow-[inset_0_0_10px_rgba(0,229,255,0.2)]">
                    📚
                 </div>
                 <h3 className="text-sm font-bold text-white mb-1">Daftar Materi</h3>
                 <p className="text-[10px] text-text-secondary">Pilih materi spesifik</p>
              </GlassCard>
           </Link>

           <Link href="/student/leaderboard">
              <GlassCard hover className="p-4 flex flex-col items-center justify-center text-center h-full glass-strong">
                 <div className="w-12 h-12 bg-uni-bg/50 rounded-full border border-uni-warning/30 flex items-center justify-center mb-3 text-2xl shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]">
                    🏆
                 </div>
                 <h3 className="text-sm font-bold text-white mb-1">Leaderboard</h3>
                 <p className="text-[10px] text-text-secondary">Peringkat global</p>
              </GlassCard>
           </Link>
        </div>

        {/* Test Mode Navigation (Pretest/Posttest) */}
        <div className="grid grid-cols-2 gap-4 w-full relative z-20 mt-4">
           <Link href="/student/test?type=pretest">
              <GlassCard hover className="p-4 flex flex-col items-center justify-center text-center h-full glass-strong">
                 <div className="w-12 h-12 bg-uni-bg/50 rounded-full border border-uni-accent/30 flex items-center justify-center mb-3 text-2xl shadow-[inset_0_0_10px_rgba(0,119,255,0.2)]">
                    📝
                 </div>
                 <h3 className="text-sm font-bold text-white mb-1">Pre-test</h3>
                 <p className="text-[10px] text-text-secondary">Uji pemahaman awal</p>
              </GlassCard>
           </Link>

           <Link href="/student/test?type=posttest">
              <GlassCard hover className="p-4 flex flex-col items-center justify-center text-center h-full glass-strong">
                 <div className="w-12 h-12 bg-uni-bg/50 rounded-full border border-uni-success/30 flex items-center justify-center mb-3 text-2xl shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]">
                    ✅
                 </div>
                 <h3 className="text-sm font-bold text-white mb-1">Post-test</h3>
                 <p className="text-[10px] text-text-secondary">Ukur peningkatan</p>
              </GlassCard>
           </Link>
        </div>

        {/* Help Button Floating Bottom Left */}
        <button
           onClick={() => { setOnboardingStep(0); setShowOnboarding(true) }}
           className="absolute bottom-6 left-6 w-10 h-10 bg-uni-bg-secondary border border-uni-primary/30 text-uni-primary rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.2)] hover:bg-uni-primary/20 transition-all z-40"
           title="Cara Bermain"
        >
           ❓
        </button>

        {/* Robot Mascot Bottom Right */}
        <div className="absolute bottom-4 right-4 z-40">
           <RobotMascot state={stats.totalSessions === 0 ? 'waving' : 'happy'} size="sm" />
        </div>

      </div>
    </main>
  )
}
