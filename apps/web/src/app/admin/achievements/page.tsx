'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Modal } from '@/components/ui/Modal'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  type: string
  requirement: number
  points: number
}

export default function AdminAchievementsPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null)
  const [form, setForm] = useState({ name: '', description: '', icon: '🏆', type: 'FLOOR', requirement: 10, points: 10 })

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/admin/login')
    }
  }, [user, isLoading, router])

  const fetchAchievements = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/admin/achievements', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.achievements) setAchievements(data.achievements)
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (token) fetchAchievements() }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingAchievement ? 'PUT' : 'POST'
      const body = editingAchievement ? { ...form, id: editingAchievement.id } : form
      const res = await fetch('/api/admin/achievements', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowModal(false)
        setEditingAchievement(null)
        setForm({ name: '', description: '', icon: '🏆', type: 'FLOOR', requirement: 10, points: 10 })
        fetchAchievements()
      }
    } catch (error) {
      console.error('Failed to save achievement:', error)
    }
  }


  const handleDelete = async (id: string) => {
    if (!confirm('Hapus achievement ini?')) return
    try {
      await fetch('/api/admin/achievements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      })
      fetchAchievements()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const openEdit = (achievement: Achievement) => {
    setEditingAchievement(achievement)
    setForm({ name: achievement.name, description: achievement.description, icon: achievement.icon, type: achievement.type, requirement: achievement.requirement, points: achievement.points })
    setShowModal(true)
  }

  if (isLoading || !user) return <LoadingScreen />

  const typeLabels: Record<string, string> = { FLOOR: 'Lantai', ACCURACY: 'Akurasi', STREAK: 'Streak', MATERIAL: 'Materi', SPECIAL: 'Spesial' }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/dashboard" className="text-text-secondary hover:text-white text-sm mb-2 inline-block">← Kembali ke Dashboard</Link>
            <h1 className="text-2xl font-bold text-white">🏆 Kelola Achievements</h1>
          </div>
          <button onClick={() => { setEditingAchievement(null); setForm({ name: '', description: '', icon: '🏆', type: 'FLOOR', requirement: 10, points: 10 }); setShowModal(true) }} className="px-4 py-2 bg-uni-primary rounded-lg text-white hover:bg-uni-primary/80 transition-colors">
            + Tambah Achievement
          </button>
        </div>

        {loading ? (
          <div className="text-center text-text-secondary py-8">Loading...</div>
        ) : achievements.length === 0 ? (
          <GlassCard className="p-6 text-center text-text-secondary">Belum ada achievement. Klik tombol di atas untuk menambah.</GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <motion.div key={achievement.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <GlassCard className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{achievement.name}</h3>
                      <p className="text-sm text-text-secondary">{achievement.description}</p>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="px-2 py-1 bg-uni-primary/20 rounded text-uni-primary">{typeLabels[achievement.type]}</span>
                        <span className="px-2 py-1 bg-uni-accent/20 rounded text-uni-accent">Target: {achievement.requirement}</span>
                        <span className="px-2 py-1 bg-uni-warning/20 rounded text-uni-warning">{achievement.points} poin</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                    <button onClick={() => openEdit(achievement)} className="text-sm text-text-secondary hover:text-white">Edit</button>
                    <button onClick={() => handleDelete(achievement.id)} className="text-sm text-red-400 hover:text-red-300">Hapus</button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingAchievement ? 'Edit Achievement' : 'Tambah Achievement'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Nama</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-uni-bg-secondary/50 border border-white/10 rounded-lg text-white" required />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Deskripsi</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-uni-bg-secondary/50 border border-white/10 rounded-lg text-white" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Icon (emoji)</label>
              <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-full px-3 py-2 bg-uni-bg-secondary/50 border border-white/10 rounded-lg text-white" required />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Tipe</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 bg-uni-bg-secondary/50 border border-white/10 rounded-lg text-white">
                <option value="FLOOR">Lantai</option>
                <option value="ACCURACY">Akurasi</option>
                <option value="STREAK">Streak</option>
                <option value="MATERIAL">Materi</option>
                <option value="SPECIAL">Spesial</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Requirement</label>
              <input type="number" value={form.requirement} onChange={(e) => setForm({ ...form, requirement: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-uni-bg-secondary/50 border border-white/10 rounded-lg text-white" required />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Poin Reward</label>
              <input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-uni-bg-secondary/50 border border-white/10 rounded-lg text-white" required />
            </div>
          </div>
          <button type="submit" className="w-full py-2 bg-uni-primary rounded-lg text-white hover:bg-uni-primary/80 transition-colors">
            {editingAchievement ? 'Simpan Perubahan' : 'Tambah Achievement'}
          </button>
        </form>
      </Modal>
    </main>
  )
}
