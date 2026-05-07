'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground, TowerBackground, GlassCard, NeonButton } from '@/components/ui'
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
    <main className="relative min-h-[100dvh] bg-uni-bg overflow-hidden flex flex-col pb-24">
      <StarryBackground density="high" />
      <TowerBackground variant="flat" />
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-30 flex justify-between items-center">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-uni-primary to-uni-accent flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.3)]">
            <span className="text-white font-bold text-lg leading-none">U</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide hidden sm:block">Unimath</span>
        </div>

        {/* Right: Teacher Profile (Static text on this page) */}
        <div className="flex items-center gap-3">
          <div className="text-right">
             <div className="text-white font-semibold text-sm">{user.name}</div>
             <div className="text-uni-primary text-xs">Guru</div>
          </div>
          <div className="w-10 h-10 rounded-full border border-uni-primary bg-uni-bg-secondary flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.2)] overflow-hidden">
             <span className="text-xl">🧑‍🏫</span>
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full max-w-2xl mx-auto px-4 pt-28 pb-8 flex-grow flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
           <Link href="/teacher/dashboard" className="w-10 h-10 flex items-center justify-center rounded-xl border border-uni-primary/30 bg-uni-bg-secondary text-white hover:bg-uni-primary/20 transition-colors shadow-[0_0_10px_rgba(0,229,255,0.1)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
           </Link>
           <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Profil Anda</h1>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-8 h-px bg-uni-primary/50" />
                 <div className="w-1.5 h-1.5 rotate-45 bg-uni-primary shadow-[0_0_5px_var(--primary-glow)]" />
              </div>
           </div>
        </div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-8 mb-6 glass-strong">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 text-center sm:text-left">
              <div className="w-24 h-24 bg-gradient-to-br from-uni-primary to-uni-accent rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.4)] border-2 border-uni-bg">
                <span className="text-5xl">🧑‍🏫</span>
              </div>
              <div className="flex-1">
                {editing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-2xl font-bold text-white bg-white/5 border border-uni-primary/30 px-4 py-2 rounded-lg w-full focus:outline-none focus:border-uni-primary mb-2 shadow-[inset_0_0_10px_rgba(0,229,255,0.1)]"
                    autoFocus
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
                )}
                <div className="inline-block px-3 py-1 bg-uni-primary/10 border border-uni-primary/20 rounded-full">
                  <p className="text-uni-primary text-sm font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEditProfile}
                  disabled={saving}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-uni-primary/10 border border-uni-primary/30 text-uni-primary hover:bg-uni-primary hover:text-white transition-all shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                >
                  {saving ? '...' : editing ? '✓' : '✏️'}
                </button>
                {editing && (
                  <button
                    onClick={() => setEditing(false)}
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-uni-error/10 border border-uni-error/30 text-uni-error hover:bg-uni-error hover:text-white transition-all"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="flex items-center gap-2 mb-6">
               <svg className="w-5 h-5 text-uni-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H4a2 2 0 00-2 2v6a2 2 0 002 2h3a2 2 0 002-2zm0 0V9a2 2 0 012-2h3a2 2 0 012 2v10m-6 0a2 2 0 002 2h3a2 2 0 002-2m0 0V5a2 2 0 012-2h3a2 2 0 012 2v14a2 2 0 01-2 2h-3a2 2 0 01-2-2z" />
               </svg>
               <h3 className="font-semibold text-white">Statistik Anda</h3>
            </div>

            {loadingStats ? (
              <div className="text-center text-text-secondary py-8">Memuat statistik...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-uni-bg-secondary/40 border border-uni-primary/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-uni-primary mb-1">{stats?.totalStudents || 0}</div>
                  <div className="text-xs text-text-secondary">Siswa</div>
                </div>
                <div className="bg-uni-bg-secondary/40 border border-uni-primary/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-uni-accent mb-1">{stats?.totalClasses || 0}</div>
                  <div className="text-xs text-text-secondary">Kelas</div>
                </div>
                <div className="bg-uni-bg-secondary/40 border border-uni-primary/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white mb-1">{stats?.totalSchools || 0}</div>
                  <div className="text-xs text-text-secondary">Sekolah</div>
                </div>
                <div className="bg-uni-bg-secondary/40 border border-uni-warning/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-uni-warning mb-1">{stats?.points || 0}</div>
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
            className="w-full py-4 text-center text-uni-error font-medium bg-transparent border border-uni-error/30 hover:bg-uni-error/10 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar dari Akun
          </button>
        </motion.div>
      </div>
    </main>
  )
}
