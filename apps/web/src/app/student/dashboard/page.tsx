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

/** Convert XP to badge tier */
function getBadge(xp: number): { name: string; emoji: string; color: string } {
  if (xp >= 500) return { name: 'Master', emoji: '👑', color: 'text-yellow-300' }
  if (xp >= 300) return { name: 'Diamond', emoji: '💎', color: 'text-cyan-300' }
  if (xp >= 150) return { name: 'Gold', emoji: '🏅', color: 'text-amber-400' }
  if (xp >= 80) return { name: 'Silver', emoji: '🥈', color: 'text-gray-300' }
  if (xp >= 30) return { name: 'Bronze', emoji: '🥉', color: 'text-orange-400' }
  return { name: 'Starter', emoji: '⭐', color: 'text-slate-400' }
}

/** Get next badge tier info */
function getNextBadgeInfo(xp: number): { nextName: string; nextEmoji: string; xpNeeded: number; xpRemaining: number } | null {
  if (xp < 30) return { nextName: 'Bronze', nextEmoji: '🥉', xpNeeded: 30, xpRemaining: 30 - xp }
  if (xp < 80) return { nextName: 'Silver', nextEmoji: '🥈', xpNeeded: 80, xpRemaining: 80 - xp }
  if (xp < 150) return { nextName: 'Gold', nextEmoji: '🏅', xpNeeded: 150, xpRemaining: 150 - xp }
  if (xp < 300) return { nextName: 'Diamond', nextEmoji: '💎', xpNeeded: 300, xpRemaining: 300 - xp }
  if (xp < 500) return { nextName: 'Master', nextEmoji: '👑', xpNeeded: 500, xpRemaining: 500 - xp }
  return null
}

interface Stats {
  totalFloors: number
  accuracy: number
  totalSessions: number
  totalXP: number
  rank?: number
  currentMaterialId: string
}

interface TestUnlock {
  pretestUnlocked: boolean
  posttestUnlocked: boolean
  pretestCompleted: boolean
  highestFloor: number
  floorRequirement: number
  floorMet: boolean
}

export default function StudentDashboard() {
  const router = useRouter()
  const { user, token, isLoading, logout } = useAuth()
  const [stats, setStats] = useState<Stats>({ totalFloors: 0, accuracy: 0, totalSessions: 0, totalXP: 0, rank: 1, currentMaterialId: 'M1A' })
  const [loadingStats, setLoadingStats] = useState(true)
  const [testUnlock, setTestUnlock] = useState<TestUnlock | null>(null)
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
        // Parallel fetch: stats + progress — setengah latency
        const [statsRes, progressRes] = await Promise.all([
          fetch('/api/student/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/student/progress'),
        ])

        let totalXP = 0
        let currentMaterialId = 'M1A'
        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats({
            totalFloors: data.stats?.totalFloors || 0,
            accuracy: data.stats?.accuracy || 0,
            totalSessions: data.stats?.totalSessions || 0,
            totalXP: 0,
            rank: data.stats?.rank || 1,
            currentMaterialId: 'M1A',
          })

          const hasSeenOnboarding = localStorage.getItem('unimath_onboarding_seen')
          if (data.stats?.totalSessions === 0 && !hasSeenOnboarding) {
            setShowOnboarding(true)
          }
        }

        if (progressRes.ok) {
          const progressData = await progressRes.json()
          totalXP = progressData.totalXP || 0
          currentMaterialId = progressData.currentMaterialId || 'M1A'
        }

        setStats(prev => ({ ...prev, totalXP, currentMaterialId }))

        // Fetch test unlock status
        try {
          const unlockRes = await fetch(`/api/student/test-unlock?materialId=${currentMaterialId}`)
          if (unlockRes.ok) {
            const unlockData = await unlockRes.json()
            setTestUnlock(unlockData)
          }
        } catch {}
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
           {/* Top Leaderboard Rank Badge */}
           <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30">
             <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
               stats.rank === 1
                 ? 'bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 border-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.8),_inset_0_0_8px_rgba(255,255,255,0.4)] scale-110 animate-pulse'
                 : stats.rank === 2
                 ? 'bg-gradient-to-br from-slate-200 via-gray-400 to-slate-500 border-slate-100 shadow-[0_0_20px_rgba(226,232,240,0.6),_inset_0_0_8px_rgba(255,255,255,0.3)] scale-105'
                 : stats.rank === 3
                 ? 'bg-gradient-to-br from-orange-400 via-amber-600 to-orange-700 border-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.6),_inset_0_0_8px_rgba(255,255,255,0.3)] scale-105'
                 : 'bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-uni-primary/60 shadow-[0_0_15px_rgba(0,229,255,0.4),_inset_0_0_6px_rgba(0,229,255,0.1)]'
             }`}>
               <span className={`font-extrabold tracking-tight ${
                 stats.rank && stats.rank <= 3 ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] text-lg' : 'text-uni-primary text-base'
               }`}>
                 #{stats.rank || 1}
               </span>
             </div>
             {stats.rank === 1 && (
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg animate-bounce select-none">👑</div>
             )}
           </div>

          <GlassCard className="p-6 pt-10 text-center glass-strong border-uni-primary/40 relative overflow-hidden group">
            {/* Ambient inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-uni-primary/10 blur-[30px] rounded-full pointer-events-none"></div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Lanjut Berlatih, {user.name.split(' ')[0]}!
            </h2>
            {(() => {
              const current = getBadge(stats.totalXP)
              const nextInfo = getNextBadgeInfo(stats.totalXP)
              return (
                <div className="mb-6 flex flex-col items-center gap-1.5 bg-black/25 rounded-xl p-3 border border-white/5 backdrop-blur-sm">
                  <div className={`text-sm font-bold flex items-center gap-1.5 ${current.color}`}>
                    <span>{current.emoji}</span>
                    <span>{current.name}</span>
                    <span className="text-text-muted font-normal">•</span>
                    <span className="text-white font-semibold">{stats.totalXP} XP</span>
                  </div>
                  <div className="text-xs text-text-secondary">
                    {nextInfo ? (
                      <span>
                        🔥 <span className="text-uni-accent font-bold">{nextInfo.xpRemaining} XP lagi</span> untuk mencapai{' '}
                        <span className="font-bold text-white">
                          {nextInfo.nextEmoji} {nextInfo.nextName}
                        </span>
                      </span>
                    ) : (
                      <span className="text-uni-success font-bold">🎉 Kamu telah mencapai tingkat tertinggi: Master!</span>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 mb-8 bg-black/20 rounded-xl p-3 border border-white/5">
              <div className="text-center">
                 <div className="text-xl mb-1">🎯</div>
                 <div className="text-lg font-bold text-white">{loadingStats ? '...' : `${stats.accuracy}%`}</div>
                 <div className="text-xs text-text-secondary uppercase tracking-wider">Akurasi</div>
              </div>
              <div className="text-center border-l border-r border-white/10">
                 <div className="text-xl mb-1">{getBadge(stats.totalXP).emoji}</div>
                 <div className={`text-lg font-bold ${getBadge(stats.totalXP).color}`}>{getBadge(stats.totalXP).name}</div>
                 <div className="text-xs text-text-secondary uppercase tracking-wider">Badge</div>
              </div>
              <div className="text-center">
                 <div className="text-xl mb-1">🏢</div>
                 <div className="text-lg font-bold text-uni-primary">{loadingStats ? '...' : stats.totalFloors}</div>
                 <div className="text-xs text-text-secondary uppercase tracking-wider">Lantai</div>
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
                 <p className="text-xs text-text-secondary">Pilih materi spesifik</p>
              </GlassCard>
           </Link>

           <Link href="/student/leaderboard">
              <GlassCard hover className="p-4 flex flex-col items-center justify-center text-center h-full glass-strong">
                 <div className="w-12 h-12 bg-uni-bg/50 rounded-full border border-uni-warning/30 flex items-center justify-center mb-3 text-2xl shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]">
                    🏆
                 </div>
                 <h3 className="text-sm font-bold text-white mb-1">Leaderboard</h3>
                 <p className="text-xs text-text-secondary">Peringkat global</p>
              </GlassCard>
           </Link>
        </div>

        {/* Pre-test & Post-test + Profile */}
        <div className="grid grid-cols-2 gap-4 w-full relative z-20 mt-4">
           {/* Pre-test — always unlocked, direct routing */}
           <Link href={`/student/test/${stats.currentMaterialId}/PRETEST`}>
              <GlassCard hover className="p-4 flex flex-col items-center justify-center text-center h-full glass-strong">
                 <div className="w-12 h-12 bg-uni-bg/50 rounded-full border border-uni-accent/30 flex items-center justify-center mb-3 text-2xl shadow-[inset_0_0_10px_rgba(0,119,255,0.2)]">
                    📝
                 </div>
                 <h3 className="text-sm font-bold text-white mb-1">Pre-test</h3>
                 <p className="text-xs text-text-secondary">Uji pemahaman awal</p>
              </GlassCard>
           </Link>

           {/* Post-test — locked/unlocked with progression guard */}
           {testUnlock?.posttestUnlocked ? (
             <Link href={`/student/test/${stats.currentMaterialId}/POSTTEST`}>
               <GlassCard hover className="p-4 flex flex-col items-center justify-center text-center h-full glass-strong border border-uni-success/30">
                 <div className="w-12 h-12 bg-uni-success/10 rounded-full border border-uni-success/30 flex items-center justify-center mb-3 text-2xl shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]">
                    ✅
                 </div>
                 <h3 className="text-sm font-bold text-white mb-1">Post-test</h3>
                 <p className="text-xs text-uni-success">Siap dikerjakan!</p>
               </GlassCard>
             </Link>
           ) : (
             <div className="relative group">
               <GlassCard className="p-4 flex flex-col items-center justify-center text-center h-full opacity-50 cursor-not-allowed">
                 <div className="w-12 h-12 bg-uni-bg/50 rounded-full border border-gray-500/30 flex items-center justify-center mb-3 text-2xl">
                    🔒
                 </div>
                 <h3 className="text-sm font-bold text-text-muted mb-1">Post-test</h3>
                 <p className="text-xs text-text-muted">Terkunci</p>
               </GlassCard>
               {/* Tooltip */}
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0a0a1a] border border-uni-primary/30 rounded-lg shadow-card opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 min-w-[220px]">
                 <p className="text-xs text-white font-semibold mb-1">🔒 Post-test Terkunci</p>
                 {testUnlock ? (
                   <div className="text-xs text-text-secondary space-y-0.5">
                     <p className={testUnlock.pretestCompleted ? 'text-uni-success' : 'text-uni-error'}>
                       {testUnlock.pretestCompleted ? '✅' : '❌'} Selesaikan Pre-test
                     </p>
                     <p className={testUnlock.floorMet ? 'text-uni-success' : 'text-uni-error'}>
                       {testUnlock.floorMet ? '✅' : '❌'} Capai Lantai {testUnlock.floorRequirement} (sekarang: {testUnlock.highestFloor})
                     </p>
                   </div>
                 ) : (
                   <p className="text-xs text-text-muted">Memuat syarat...</p>
                 )}
               </div>
             </div>
           )}
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
