'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/lib/auth/context'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/admin/login')
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-uni-bg">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const menuItems = [
    { href: '/admin/materials', icon: '📚', title: 'Kelola Materi', desc: 'Tambah/edit materi pembelajaran' },
    { href: '/admin/questions', icon: '❓', title: 'Kelola Soal', desc: 'Upload dan kelola bank soal' },
    { href: '/admin/achievements', icon: '🏆', title: 'Achievements', desc: 'Kelola badge dan reward' },
    { href: '/admin/users', icon: '👥', title: 'Users', desc: 'Kelola guru dan siswa' },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />
      
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">🔐 Admin Dashboard</h1>
            <p className="text-text-secondary">Selamat datang, {user.name}</p>
          </div>
          <button
            onClick={logout}
            className="text-text-secondary hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={item.href}>
                <GlassCard hover className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{item.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-text-secondary">{item.desc}</p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  )
}
