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

export default function TeacherDashboard() {
  const router = useRouter()
  const { user, token, isLoading, logout } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

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

    if (token) {
      fetchStats()
    }
  }, [token])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-uni-bg">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const menuItems = [
    { icon: '🏫', title: 'Kelola Sekolah', desc: 'Atur sekolah Anda', href: '/teacher/schools' },
    { icon: '📚', title: 'Kelola Kelas', desc: 'Atur kelas dan siswa', href: '/teacher/classes' },
    { icon: '📊', title: 'Rekap & Laporan', desc: 'Lihat progress siswa', href: '/teacher/reports' },
  ]

  const handleLogout = async () => {
    await logout()
    router.push('/teacher/login')
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen glass-strong p-6 hidden md:block">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gradient">UniMath</h1>
            <p className="text-xs text-text-secondary">Panel Guru</p>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-uni-primary/10 transition-colors group"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-text-secondary group-hover:text-white transition-colors">
                  {item.title}
                </span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <Link
              href="/teacher/profile"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-uni-primary/10 transition-colors"
            >
              <div className="w-8 h-8 bg-uni-primary/20 rounded-full flex items-center justify-center">
                <span>👤</span>
              </div>
              <span className="text-text-secondary text-sm">{user.name}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full mt-2 p-2 text-sm text-text-muted hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Selamat Datang, {user.name}! 👋</h1>
            <p className="text-text-secondary">Dashboard Guru</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <GlassCard className="p-4 text-center">
                <div className="text-3xl font-bold text-uni-primary">
                  {loadingStats ? '...' : stats?.totalStudents || 0}
                </div>
                <div className="text-sm text-text-secondary">Total Siswa</div>
              </GlassCard>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <GlassCard className="p-4 text-center">
                <div className="text-3xl font-bold text-uni-accent">
                  {loadingStats ? '...' : stats?.totalClasses || 0}
                </div>
                <div className="text-sm text-text-secondary">Total Kelas</div>
              </GlassCard>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <GlassCard className="p-4 text-center">
                <div className="text-3xl font-bold text-white">
                  {loadingStats ? '...' : stats?.totalSchools || 0}
                </div>
                <div className="text-sm text-text-secondary">Sekolah</div>
              </GlassCard>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <GlassCard className="p-4 text-center">
                <div className="text-3xl font-bold text-uni-warning">
                  {loadingStats ? '...' : stats?.points || 0}
                </div>
                <div className="text-sm text-text-secondary">Poin</div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Quick Actions - Mobile */}
          <div className="md:hidden space-y-4 mb-8">
            {menuItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link href={item.href}>
                  <GlassCard hover className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-uni-primary/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">{item.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-text-secondary">{item.desc}</p>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Getting Started */}
          {stats && stats.totalSchools === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">🚀 Mulai Sekarang</h3>
                <p className="text-text-secondary mb-4">
                  Selamat datang! Untuk memulai, silakan buat sekolah dan kelas terlebih dahulu.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/teacher/schools"
                    className="block p-3 bg-uni-primary/20 rounded-lg hover:bg-uni-primary/30 transition-colors"
                  >
                    <span className="text-white">1. Buat Sekolah →</span>
                  </Link>
                  <Link
                    href="/teacher/classes"
                    className="block p-3 bg-uni-bg-secondary/30 rounded-lg hover:bg-uni-bg-secondary/50 transition-colors"
                  >
                    <span className="text-text-secondary">2. Buat Kelas & Tambah Siswa</span>
                  </Link>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  )
}
