'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
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

interface ImportSummary {
  totalRows: number
  materialsCreated: number
  materialsExisting: number
  contentsCleared: number
  contentsImported: number
  contentsSkipped: number
  errors: number
}

export default function AdminMaterialsPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // ── Import CSV state ──
  const [importing, setImporting] = useState(false)
  const [lastImportSummary, setLastImportSummary] = useState<ImportSummary | null>(null)

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

  // ── CSV Import handlers ────────────────────────────────────────────
  const handleImportClick = () => {
    if (importing) return
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset input so selecting the same file again still triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (!file) return
    if (!token) {
      showToast('Session habis. Silakan login ulang.', 'error')
      return
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('File harus berformat .csv', 'error')
      return
    }

    setImporting(true)
    setLastImportSummary(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/materials/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        const message = data?.error?.message || 'Gagal mengimpor CSV'
        showToast(message, 'error', 5000)
        return
      }

      const summary: ImportSummary = data.summary
      setLastImportSummary(summary)

      showToast(
        `Berhasil import ${summary.contentsImported} konten dari ${summary.totalRows} baris`,
        'success',
        4500
      )

      if (summary.errors > 0) {
        showToast(`${summary.errors} baris gagal diproses (cek ringkasan)`, 'warning', 5000)
      }

      // Refresh the materials list to surface newly created records
      await fetchMaterials()
    } catch (err) {
      console.error('Import CSV failed:', err)
      showToast('Koneksi gagal saat mengimpor', 'error')
    } finally {
      setImporting(false)
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

      {/* Hidden file input driven by the Import button */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileSelected}
        aria-hidden
      />

      <div className="relative z-10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-text-secondary hover:text-white">
              ← Kembali
            </Link>
            <h1 className="text-2xl font-bold text-white">📚 Kelola Materi</h1>
          </div>

          <div className="flex items-center gap-2">
            <NeonButton
              variant="secondary"
              onClick={handleImportClick}
              disabled={importing}
              glow={false}
            >
              {importing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Mengimpor...
                </span>
              ) : (
                <span className="flex items-center gap-2">📥 Import CSV</span>
              )}
            </NeonButton>
            <NeonButton onClick={() => setShowForm(true)} disabled={importing}>
              + Tambah Materi
            </NeonButton>
          </div>
        </div>

        {/* Last import summary banner */}
        {lastImportSummary && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <GlassCard className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-uni-primary font-semibold">Hasil Import:</span>
                  <SummaryPill
                    label="Konten"
                    value={lastImportSummary.contentsImported}
                    tone="primary"
                  />
                  <SummaryPill
                    label="Materi baru"
                    value={lastImportSummary.materialsCreated}
                    tone="accent"
                  />
                  <SummaryPill
                    label="Lewati"
                    value={lastImportSummary.contentsSkipped}
                    tone="muted"
                  />
                  <SummaryPill
                    label="Error"
                    value={lastImportSummary.errors}
                    tone={lastImportSummary.errors > 0 ? 'error' : 'muted'}
                  />
                </div>
                <button
                  onClick={() => setLastImportSummary(null)}
                  className="text-text-secondary hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
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
                        <option key={g} value={g} className="bg-uni-bg">
                          Kelas {g}
                        </option>
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
                  <NeonButton type="submit" variant="primary">
                    Simpan
                  </NeonButton>
                  <NeonButton type="button" variant="ghost" onClick={resetForm}>
                    Batal
                  </NeonButton>
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
                      <p className="text-sm text-text-secondary">
                        {material.description || 'Tidak ada deskripsi'}
                      </p>
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

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'primary' | 'accent' | 'muted' | 'error'
}) {
  const toneClasses = {
    primary: 'bg-uni-primary/15 border-uni-primary/40 text-uni-primary',
    accent: 'bg-uni-accent/15 border-uni-accent/40 text-uni-accent',
    muted: 'bg-white/5 border-white/15 text-text-secondary',
    error: 'bg-uni-error/15 border-uni-error/40 text-uni-error',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${toneClasses[tone]}`}
    >
      <span className="opacity-75">{label}</span>
      <span className="font-bold">{value}</span>
    </span>
  )
}
