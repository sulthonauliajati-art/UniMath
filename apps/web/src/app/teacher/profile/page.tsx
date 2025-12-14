'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/lib/auth/context'

interface Stats {
  totalStudents: number
  totalClasses: number
  totalSchools: number
  points: number
}

export default function TeacherProfilePage() {
  const router = useRouter()
  const { user, token, isLoading, logout, updateUser } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'TEACHER')) {
      router.push('/teacher/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function fetchStats() {
      if (!token) return
      try {
        const res = await fetch('/api/teacher/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()

        if (data.stats) {
          setStats(data.stats)
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

  const handleLogout = async () => {
    await logout()
    router.push('/teacher/login')
  }

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

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/teacher/dashboard" className="text-text-secondary hover:text-white">
            ← Kembali
          </Link>
          <h1 className="text-2xl font-bold text-white">Profil Guru</h1>
        </div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-uni-primary to-uni-accent rounded-full flex items-center justify-center">
                <span className="text-4xl">👨‍🏫</span>
              </div>
              <div className="flex-1">
                {editing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-xl font-bold text-white bg-white/10 px-3 py-1 rounded-lg w-full"
                    autoFocus
                  />
                ) : (
                  <h2 className="text-xl font-bold text-white">{user.name}</h2>
                )}
                <p className="text-text-secondary">{user.email}</p>
              </div>
              <button
                onClick={handleEditProfile}
                disabled={saving}
                className="text-uni-primary hover:text-uni-accent transition-colors"
              >
                {saving ? '...' : editing ? '✓' : '✏️'}
              </button>
              {editing && (
                <button
                  onClick={() => setEditing(false)}
                  className="text-text-secondary hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Stats Grid */}
            {loadingStats ? (
              <div className="text-center text-text-secondary py-4">Memuat statistik...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-uni-bg-secondary/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-uni-primary">{stats?.totalStudents || 0}</div>
                  <div className="text-xs text-text-secondary">Total Siswa</div>
                </div>
                <div className="bg-uni-bg-secondary/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-uni-accent">{stats?.totalClasses || 0}</div>
                  <div className="text-xs text-text-secondary">Total Kelas</div>
                </div>
                <div className="bg-uni-bg-secondary/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats?.totalSchools || 0}</div>
                  <div className="text-xs text-text-secondary">Sekolah</div>
                </div>
                <div className="bg-uni-bg-secondary/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-uni-warning">{stats?.points || 0}</div>
                  <div className="text-xs text-text-secondary">Poin</div>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            onClick={handleLogout}
            className="w-full p-4 text-center text-uni-error hover:bg-uni-error/10 rounded-xl transition-colors"
          >
            Logout
          </button>
        </motion.div>
      </div>
    </main>
  )
}
