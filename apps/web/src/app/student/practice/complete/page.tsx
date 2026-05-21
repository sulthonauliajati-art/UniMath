'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { TowerBackground, GlassCard } from '@/components/ui'
import { useAuth } from '@/lib/auth/context'

interface PracticeStats {
  floorsClimbed: number
  correctAnswers: number
  totalAttempts: number
  sessionXP?: number
  bestStreak?: number
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

    const statsData = sessionStorage.getItem('practiceStats')
    if (statsData) {
      setStats(JSON.parse(statsData))
      sessionStorage.removeItem('practiceStats')

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#06B6D4', '#10B981', '#ffffff', '#F59E0B'],
      })
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <TowerBackground variant="practice">
        <div className="min-h-[100dvh] flex items-center justify-center">
          <div className="text-white/80 text-sm animate-pulse">Loading…</div>
        </div>
      </TowerBackground>
    )
  }

  const accuracy =
    stats && stats.totalAttempts > 0
      ? Math.round((stats.correctAnswers / stats.totalAttempts) * 100)
      : 0

  const getMotivationalMessage = () => {
    if (!stats)
      return {
        emoji: '🎉',
        title: 'Selamat!',
        message: 'Kamu udah berlatih untuk hari ini!',
      }
    if (accuracy >= 90)
      return {
        emoji: '🌟',
        title: 'Luar Biasa!',
        message: 'Akurasi kamu sangat tinggi! Kamu siap naik level!',
      }
    if (accuracy >= 70)
      return {
        emoji: '👏',
        title: 'Bagus Sekali!',
        message: 'Terus berlatih untuk hasil yang lebih baik!',
      }
    if (accuracy >= 50)
      return {
        emoji: '💪',
        title: 'Semangat!',
        message: 'Coba ulangi materi ini untuk meningkatkan akurasi.',
      }
    return {
      emoji: '📚',
      title: 'Jangan Menyerah!',
      message: 'Pelajari kembali materinya dan coba lagi ya!',
    }
  }

  const motivation = getMotivationalMessage()

  const getRecommendation = () => {
    if (!stats) return null
    return {
      text: 'Latihan Lagi',
      href: stats.materialId
        ? `/student/practice/${stats.materialId}/start`
        : '/student/practice',
    }
  }

  const recommendation = getRecommendation()

  return (
    <TowerBackground variant="practice">
      {/* Header */}
      <header className="relative z-30 w-full px-4 pt-4 sm:px-6 sm:pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-uni-primary to-uni-accent flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.4)]">
            <span className="text-white font-bold text-lg leading-none">U</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide hidden sm:block">
            Unimath
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-white font-semibold text-sm">{user.name}</div>
            <div className="text-cyan-300 text-xs">Siswa Aktif</div>
          </div>
          <div className="w-10 h-10 rounded-full border border-cyan-400/50 bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.25)]">
            <span className="text-xl">🤖</span>
          </div>
        </div>
      </header>

      {/* Card */}
      <section className="relative z-20 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <GlassCard glowColor="cyan" intensity="strong" className="p-6 sm:p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-4"
            >
              <div className="text-6xl sm:text-7xl mx-auto">{motivation.emoji}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {motivation.title}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mb-6 sm:mb-7">
                {motivation.message}
              </p>
            </motion.div>

            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-6"
              >
                <StatPill
                  value={`+${stats.sessionXP || 0}`}
                  label="⭐ XP Earned"
                  color="amber"
                />
                <StatPill
                  value={stats.bestStreak || 0}
                  label="🔥 Best Streak"
                  color="cyan"
                />
                <StatPill
                  value={stats.correctAnswers}
                  label="✅ Benar"
                  color="emerald"
                />
                <StatPill
                  value={`${accuracy}%`}
                  label="📊 Akurasi"
                  color={
                    accuracy >= 70 ? 'emerald' : accuracy >= 50 ? 'amber' : 'red'
                  }
                />
              </motion.div>
            )}

            {stats && stats.totalAttempts > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-6 p-3 bg-black/35 border border-cyan-500/15 rounded-lg text-xs sm:text-sm text-slate-300"
              >
                Kamu menjawab{' '}
                <span className="text-emerald-300 font-semibold">
                  {stats.correctAnswers}
                </span>{' '}
                benar dari{' '}
                <span className="text-white font-semibold">{stats.totalAttempts}</span>{' '}
                soal
                {stats.totalAttempts - stats.correctAnswers > 0 && (
                  <>
                    {' '}
                    <span className="text-red-300">
                      ({stats.totalAttempts - stats.correctAnswers} salah)
                    </span>
                  </>
                )}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-2.5"
            >
              {recommendation && (
                <Link href={recommendation.href} className="block">
                  <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-bold text-sm sm:text-base shadow-[0_0_24px_-4px_rgba(6,182,212,0.8)] hover:shadow-[0_0_32px_-4px_rgba(6,182,212,1)] transition-shadow">
                    {recommendation.text}
                  </button>
                </Link>
              )}
              <Link href="/student/dashboard" className="block">
                <button className="w-full py-3 rounded-xl bg-black/40 border border-cyan-400/50 text-white font-semibold text-sm sm:text-base hover:bg-cyan-500/10 transition-colors">
                  Kembali ke Dashboard
                </button>
              </Link>
            </motion.div>
          </GlassCard>
        </motion.div>
      </section>
    </TowerBackground>
  )
}

function StatPill({
  value,
  label,
  color,
}: {
  value: number | string
  label: string
  color: 'cyan' | 'emerald' | 'amber' | 'red'
}) {
  const tones = {
    cyan: 'text-cyan-300 border-cyan-400/30 shadow-[0_0_12px_-4px_rgba(6,182,212,0.6)]',
    emerald:
      'text-emerald-300 border-emerald-400/30 shadow-[0_0_12px_-4px_rgba(16,185,129,0.6)]',
    amber:
      'text-amber-300 border-amber-400/30 shadow-[0_0_12px_-4px_rgba(245,158,11,0.6)]',
    red: 'text-red-300 border-red-400/30 shadow-[0_0_12px_-4px_rgba(239,68,68,0.6)]',
  }
  return (
    <div
      className={`bg-black/35 border rounded-xl p-3 ${tones[color]}`}
    >
      <div className="text-2xl sm:text-3xl font-bold">{value}</div>
      <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  )
}
