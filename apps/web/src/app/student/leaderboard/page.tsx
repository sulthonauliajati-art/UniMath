'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface LeaderboardEntry {
  id: string
  name: string
  rank: number
  totalFloors: number
  accuracy: number
  points: number
}

export default function StudentLeaderboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard?limit=20')
        const data = await res.json()
        setLeaderboard(data.leaderboard || [])
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }
    if (user) {
      fetchLeaderboard()
    }
  }, [user])

  if (isLoading || !user) {
    return <LoadingScreen />
  }

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600'
    if (rank === 2) return 'from-gray-300 to-gray-500'
    if (rank === 3) return 'from-orange-400 to-orange-600'
    return 'from-uni-primary/50 to-uni-accent/50'
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />
      
      <div className="relative z-10 p-4 sm:p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/student/dashboard" className="text-text-secondary hover:text-white text-sm sm:text-base">
            ← Kembali
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white">🏆 Leaderboard</h1>
        </div>

        {loading ? (
          <LoadingScreen fullScreen={false} />
        ) : leaderboard.length === 0 ? (
          <GlassCard className="p-6 sm:p-8 text-center">
            <p className="text-text-secondary text-sm">Belum ada data leaderboard</p>
          </GlassCard>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <GlassCard 
                  className={`p-3 sm:p-4 ${entry.id === user.id ? 'ring-2 ring-uni-primary' : ''}`}
                >
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${getRankColor(entry.rank)} flex items-center justify-center font-bold text-white text-sm sm:text-base flex-shrink-0`}>
                      {getRankEmoji(entry.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <h3 className="font-semibold text-white text-sm sm:text-base truncate">{entry.name}</h3>
                        {entry.id === user.id && (
                          <span className="text-[10px] sm:text-xs bg-uni-primary/20 text-uni-primary px-1.5 sm:px-2 py-0.5 rounded">
                            Kamu
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-text-secondary">
                        Akurasi: {entry.accuracy}%
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg sm:text-xl font-bold text-uni-primary">{entry.totalFloors}</div>
                      <div className="text-[10px] sm:text-xs text-text-secondary">Lantai</div>
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
