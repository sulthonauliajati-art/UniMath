'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/lib/auth/context'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  type: string
  requirement: number
  points: number
  earned: boolean
  progress: number
  current: number
}

export default function StudentAchievementsPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function fetchAchievements() {
      if (!token) return
      try {
        const res = await fetch('/api/student/achievements', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setAchievements(data.achievements || [])
      } catch (error) {
        console.error('Failed to fetch achievements:', error)
      } finally {
        setLoading(false)
      }
    }
    if (user && token) {
      fetchAchievements()
    }
  }, [user, token])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-uni-bg">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const earnedCount = achievements.filter((a) => a.earned).length
  const totalPoints = achievements.filter((a) => a.earned).reduce((sum, a) => sum + a.points, 0)

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />
      
      <div className="relative z-10 p-4 sm:p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/student/dashboard" className="text-text-secondary hover:text-white text-sm sm:text-base">
            ← Kembali
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white">🏆 Achievements</h1>
        </div>

        {/* Summary */}
        <GlassCard className="p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-uni-primary">{earnedCount}</div>
              <div className="text-[10px] sm:text-xs text-text-secondary">Diraih</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-uni-accent">{achievements.length}</div>
              <div className="text-[10px] sm:text-xs text-text-secondary">Total</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-uni-warning">{totalPoints}</div>
              <div className="text-[10px] sm:text-xs text-text-secondary">Poin</div>
            </div>
          </div>
        </GlassCard>

        {loading ? (
          <div className="text-center text-text-secondary py-8 text-sm">Loading...</div>
        ) : achievements.length === 0 ? (
          <GlassCard className="p-6 sm:p-8 text-center">
            <p className="text-text-secondary text-sm">Belum ada achievement tersedia</p>
          </GlassCard>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {achievements.map((ach, index) => (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <GlassCard className={`p-3 sm:p-4 ${ach.earned ? 'ring-2 ring-uni-success' : 'opacity-70'}`}>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0 ${ach.earned ? 'bg-uni-success/20' : 'bg-white/5 grayscale'}`}>
                      {ach.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                        <h3 className="font-semibold text-white text-sm sm:text-base">{ach.name}</h3>
                        {ach.earned && (
                          <span className="text-[10px] sm:text-xs bg-uni-success/20 text-uni-success px-1.5 sm:px-2 py-0.5 rounded">
                            ✓
                          </span>
                        )}
                        <span className="text-[10px] sm:text-xs text-uni-warning">+{ach.points}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-text-secondary mb-1.5 sm:mb-2">{ach.description}</p>
                      {!ach.earned && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <ProgressBar value={ach.progress} size="sm" />
                          </div>
                          <span className="text-[10px] sm:text-xs text-text-muted flex-shrink-0">
                            {ach.current}/{ach.requirement}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
