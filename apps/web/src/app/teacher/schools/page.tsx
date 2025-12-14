'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth/context'
import { useToast } from '@/components/ui/Toast'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface School {
  id: string
  name: string
  ownerTeacherId: string
  createdAt: string
  isOwner: boolean
  classCount?: number
}

export default function TeacherSchoolsPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const { showToast } = useToast()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newSchoolName, setNewSchoolName] = useState('')
  const [error, setError] = useState('')
  // P1 Fix: Edit school state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'TEACHER')) {
      router.push('/teacher/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function fetchSchools() {
      if (!token) return
      try {
        const res = await fetch('/api/teacher/schools', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setSchools(data.schools || [])
      } catch (error) {
        console.error('Failed to fetch schools:', error)
      } finally {
        setLoading(false)
      }
    }
    if (user && token) {
      fetchSchools()
    }
  }, [user, token])

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setError('')

    try {
      const res = await fetch('/api/teacher/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newSchoolName }),
      })
      const data = await res.json()

      if (data.school) {
        setSchools([...schools, data.school])
        setShowForm(false)
        setNewSchoolName('')
        showToast('Sekolah berhasil dibuat!', 'success')
      } else {
        setError(data.error?.message || 'Gagal membuat sekolah')
        showToast(data.error?.message || 'Gagal membuat sekolah', 'error')
      }
    } catch (error) {
      console.error('Failed to create school:', error)
      setError('Terjadi kesalahan')
    }
  }

  // P1 Fix: Edit school name
  const handleEditSchool = async (schoolId: string) => {
    if (!token || !editName.trim()) return
    setSaving(true)
    
    try {
      const res = await fetch(`/api/teacher/schools/${schoolId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName }),
      })
      const data = await res.json()
      
      if (data.success) {
        setSchools(schools.map(s => s.id === schoolId ? { ...s, name: editName } : s))
        setEditingId(null)
        setEditName('')
        showToast('Nama sekolah berhasil diubah!', 'success')
      } else {
        setError(data.error?.message || 'Gagal mengubah nama sekolah')
        showToast(data.error?.message || 'Gagal mengubah nama sekolah', 'error')
      }
    } catch (err) {
      console.error('Failed to edit school:', err)
      setError('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !user) {
    return <LoadingScreen />
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/teacher/dashboard" className="text-text-secondary hover:text-white">
              ← Kembali
            </Link>
            <h1 className="text-2xl font-bold text-white">Kelola Sekolah</h1>
          </div>
          <NeonButton onClick={() => setShowForm(true)}>+ Tambah Sekolah</NeonButton>
        </div>

        {/* Create School Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Buat Sekolah Baru</h3>
              <form onSubmit={handleCreateSchool} className="space-y-4">
                <Input
                  label="Nama Sekolah"
                  placeholder="Contoh: SD Negeri 1 Jakarta"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  error={error}
                  required
                />
                <div className="flex gap-2">
                  <NeonButton type="submit" variant="primary">
                    Simpan
                  </NeonButton>
                  <NeonButton type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    Batal
                  </NeonButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* Schools List */}
        {loading ? (
          <div className="text-center text-text-secondary py-8">Loading...</div>
        ) : schools.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <div className="text-4xl mb-4">🏫</div>
            <p className="text-text-secondary mb-4">Belum ada sekolah</p>
            <p className="text-sm text-text-muted mb-6">
              Buat sekolah untuk mulai mengelola kelas dan siswa
            </p>
            <NeonButton onClick={() => setShowForm(true)}>Buat Sekolah Pertama</NeonButton>
          </GlassCard>
        ) : (
          /* P1 Fix: Schools list with edit functionality */
          <div className="space-y-4">
            {schools.map((school, index) => (
              <motion.div
                key={school.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {editingId === school.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-uni-primary"
                            autoFocus
                          />
                          <button
                            onClick={() => handleEditSchool(school.id)}
                            disabled={saving || !editName.trim()}
                            className="px-3 py-2 text-sm bg-uni-success/20 text-uni-success hover:bg-uni-success/30 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {saving ? '...' : 'Simpan'}
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditName('') }}
                            className="px-3 py-2 text-sm bg-white/10 text-text-secondary hover:text-white rounded-lg transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-white truncate">{school.name}</h3>
                            {school.isOwner && (
                              <span className="px-2 py-0.5 text-xs bg-uni-primary/20 text-uni-primary rounded flex-shrink-0">
                                Pemilik
                              </span>
                            )}
                            {school.isOwner && (
                              <button
                                onClick={() => { setEditingId(school.id); setEditName(school.name) }}
                                className="p-1 text-text-secondary hover:text-uni-primary transition-colors"
                                title="Edit nama sekolah"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary">
                            Dibuat: {new Date(school.createdAt).toLocaleDateString('id-ID')}
                          </p>
                        </>
                      )}
                    </div>
                    <Link href="/teacher/classes">
                      <NeonButton variant="ghost" size="sm">
                        Lihat Kelas →
                      </NeonButton>
                    </Link>
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
