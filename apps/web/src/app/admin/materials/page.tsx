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

interface Material {
  id: string
  title: string
  description: string | null
  grade: string
  videoUrl: string | null
  summaryUrl: string | null
  fullUrl: string | null
  order: number
  isActive: boolean
  questionCount?: number
}

export default function AdminMaterialsPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    grade: '4',
    videoUrl: '',
    summaryUrl: '',
    fullUrl: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/admin/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    fetchMaterials()
  }, [token])

  const fetchMaterials = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/admin/materials', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setMaterials(data.materials || [])
    } catch (error) {
      console.error('Failed to fetch materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const url = editingId ? `/api/admin/materials/${editingId}` : '/api/admin/materials'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error.message)
        return
      }

      fetchMaterials()
      resetForm()
    } catch (error) {
      console.error('Failed to save material:', error)
      setError('Gagal menyimpan materi')
    }
  }

  const handleEdit = (material: Material) => {
    setForm({
      title: material.title,
      description: material.description || '',
      grade: material.grade,
      videoUrl: material.videoUrl || '',
      summaryUrl: material.summaryUrl || '',
      fullUrl: material.fullUrl || '',
    })
    setEditingId(material.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus materi ini?')) return

    try {
      await fetch(`/api/admin/materials/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchMaterials()
    } catch (error) {
      console.error('Failed to delete material:', error)
    }
  }

  const resetForm = () => {
    setForm({ title: '', description: '', grade: '4', videoUrl: '', summaryUrl: '', fullUrl: '' })
    setEditingId(null)
    setShowForm(false)
    setError('')
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-text-secondary hover:text-white">
              ← Kembali
            </Link>
            <h1 className="text-2xl font-bold text-white">📚 Kelola Materi</h1>
          </div>
          <NeonButton onClick={() => setShowForm(true)}>+ Tambah Materi</NeonButton>
        </div>

        {/* Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingId ? 'Edit Materi' : 'Tambah Materi Baru'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Judul Materi"
                    placeholder="Contoh: Penjumlahan Dasar"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Tingkat Kelas</label>
                    <select
                      value={form.grade}
                      onChange={(e) => setForm({ ...form, grade: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                    >
                      {[1, 2, 3, 4, 5, 6].map((g) => (
                        <option key={g} value={g} className="bg-uni-bg">Kelas {g}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  label="Deskripsi"
                  placeholder="Deskripsi singkat materi"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <Input
                  label="Link Video YouTube"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                />
                <Input
                  label="Link PDF Ringkasan (Google Drive)"
                  placeholder="https://drive.google.com/file/d/..."
                  value={form.summaryUrl}
                  onChange={(e) => setForm({ ...form, summaryUrl: e.target.value })}
                />
                <Input
                  label="Link PDF Lengkap (Google Drive)"
                  placeholder="https://drive.google.com/file/d/..."
                  value={form.fullUrl}
                  onChange={(e) => setForm({ ...form, fullUrl: e.target.value })}
                />
                {error && <p className="text-uni-error text-sm">{error}</p>}
                <div className="flex gap-2">
                  <NeonButton type="submit" variant="primary">Simpan</NeonButton>
                  <NeonButton type="button" variant="ghost" onClick={resetForm}>Batal</NeonButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* Materials List */}
        {loading ? (
          <div className="text-center text-text-secondary py-8">Loading...</div>
        ) : materials.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-text-secondary mb-4">Belum ada materi</p>
            <NeonButton onClick={() => setShowForm(true)}>Tambah Materi Pertama</NeonButton>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {materials.map((material, index) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{material.title}</h3>
                        <span className="text-xs bg-uni-primary/20 text-uni-primary px-2 py-0.5 rounded">
                          Kelas {material.grade}
                        </span>
                        {material.questionCount !== undefined && (
                          <span className="text-xs bg-uni-accent/20 text-uni-accent px-2 py-0.5 rounded">
                            {material.questionCount} soal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary">{material.description || 'Tidak ada deskripsi'}</p>
                      <div className="flex gap-4 mt-2 text-xs text-text-muted">
                        {material.videoUrl && <span>🎬 Video</span>}
                        {material.summaryUrl && <span>📄 Ringkasan</span>}
                        {material.fullUrl && <span>📖 Lengkap</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(material)}
                        className="p-2 text-text-secondary hover:text-white"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(material.id)}
                        className="p-2 text-text-secondary hover:text-uni-error"
                      >
                        🗑️
                      </button>
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
