'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/lib/auth/context'

interface Stats {
  totalFloors: number
  totalSessions: number
  totalAttempts: number
  correctAttempts: number
  accuracy: number
}

interface MaterialProgress {
  id: string
  name: string
  progress: number
}

export default function StudentProfile() {
  const router = useRouter()
  const { user, token, isLoading, updateUser } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [materialProgress, setMaterialProgress] = useState<MaterialProgress[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

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
        const data = await res.json()

        if (data.stats) {
          setStats(data.stats)
          setMaterialProgress(data.materialProgress || [])
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    if (token) {
      fetchStats()
    }
  }, [token])

  const handleEditProfile = async () => {
    if (!editing) {
      setEditName(user?.name || '')
      setEditing(true)
      return
    }

    if (!editName.trim()) return
    setSaving(true)

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName }),
      })
      const data = await res.json()
      if (data.success && updateUser) {
        updateUser({ ...user!, name: editName })
      }
      setEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setSaving(false)
    }
  }

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
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/student/dashboard" className="text-text-secondary hover:text-white text-sm sm:text-base">
            ← Kembali
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Profil Saya</h1>
        </div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-uni-primary to-uni-accent rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-lg sm:text-xl font-bold text-white bg-white/10 px-2 sm:px-3 py-1 rounded-lg w-full"
                    autoFocus
                  />
                ) : (
                  <h2 className="text-lg sm:text-xl font-bold text-white truncate">{user.name}</h2>
                )}
                <p className="text-text-secondary text-sm sm:text-base">NISN: {user.nisn}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleEditProfile}
                  disabled={saving}
                  className="text-uni-primary hover:text-uni-accent transition-colors p-1"
                >
                  {saving ? '...' : editing ? '✓' : '✏️'}
                </button>
                {editing && (
                  <button
                    onClick={() => setEditing(false)}
                    className="text-text-secondary hover:text-white p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            {loadingStats ? (
              <div className="text-center text-text-secondary py-6 sm:py-8 text-sm">Memuat statistik...</div>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-uni-bg-secondary/50 rounded-xl p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-uni-primary">{stats.totalFloors}</div>
                  <div className="text-[10px] sm:text-xs text-text-secondary">Lantai Tercapai</div>
                </div>
                <div className="bg-uni-bg-secondary/50 rounded-xl p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-uni-accent">{stats.accuracy}%</div>
                  <div className="text-[10px] sm:text-xs text-text-secondary">Akurasi</div>
                </div>
                <div className="bg-uni-bg-secondary/50 rounded-xl p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-white">{stats.totalSessions}</div>
                  <div className="text-[10px] sm:text-xs text-text-secondary">Sesi Latihan</div>
                </div>
                <div className="bg-uni-bg-secondary/50 rounded-xl p-3 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    {stats.correctAttempts}/{stats.totalAttempts}
                  </div>
                  <div className="text-[10px] sm:text-xs text-text-secondary">Jawaban Benar</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-text-secondary py-6 sm:py-8 text-sm">
                Belum ada data latihan. Mulai latihan untuk melihat progress!
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Progress per Material */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Progress per Materi</h3>
            {loadingStats ? (
              <div className="text-center text-text-secondary py-4 text-sm">Memuat...</div>
            ) : materialProgress.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {materialProgress.map((material) => (
                  <div key={material.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs sm:text-sm text-text-secondary truncate mr-2">{material.name}</span>
                      <span className="text-xs sm:text-sm text-uni-primary flex-shrink-0">{material.progress}%</span>
                    </div>
                    <ProgressBar value={material.progress} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-text-secondary py-4 text-sm">Belum ada progress materi</div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </main>
  )
}
