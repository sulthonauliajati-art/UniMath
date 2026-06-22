'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
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
  summaryContent?: string | null
  fullContent?: string | null
  hasSummaryContent?: boolean
  hasFullContent?: boolean
}

const GRADE_OPTIONS = [
  { value: '10', label: 'Kelas 10 (SMA)' },
  { value: '11', label: 'Kelas 11 (SMA)' },
  { value: '12', label: 'Kelas 12 (SMA)' },
]

type ContentTab = 'summary' | 'full'

const EMPTY_FORM = {
  title: '',
  description: '',
  grade: '10',
  videoUrl: '',
  summaryUrl: '',
  fullUrl: '',
  summaryContent: '',
  fullContent: '',
}

export default function AdminMaterialsPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const { showToast } = useToast()

  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeContentTab, setActiveContentTab] = useState<ContentTab>('summary')
  const [gradeFilter, setGradeFilter] = useState<'all' | '10' | '11' | '12'>('all')

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
      showToast('Gagal memuat daftar materi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

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

      showToast(editingId ? 'Materi berhasil diperbarui' : 'Materi baru ditambahkan', 'success')
      await fetchMaterials()
      resetForm()
    } catch (error) {
      console.error('Failed to save material:', error)
      setError('Gagal menyimpan materi')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (material: Material) => {
    setForm({
      title: material.title,
      description: material.description || '',
      grade: material.grade || '10',
      videoUrl: material.videoUrl || '',
      summaryUrl: material.summaryUrl || '',
      fullUrl: material.fullUrl || '',
      summaryContent: material.summaryContent || '',
      fullContent: material.fullContent || '',
    })
    setEditingId(material.id)
    setShowForm(true)
    setActiveContentTab('summary')
    // Scroll form into view on mobile
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Yakin ingin menghapus "${title}"? Semua konten ringkas & full akan ikut terhapus.`)) return

    try {
      await fetch(`/api/admin/materials/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      showToast('Materi dihapus', 'success')
      fetchMaterials()
    } catch (error) {
      console.error('Failed to delete material:', error)
      showToast('Gagal menghapus materi', 'error')
    }
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
    setError('')
    setActiveContentTab('summary')
  }

  const openNewForm = () => {
    resetForm()
    setForm(EMPTY_FORM)
    setShowForm(true)
    setActiveContentTab('summary')
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  // Group materials by grade for tidier display
  const groupedMaterials = useMemo(() => {
    const filtered =
      gradeFilter === 'all' ? materials : materials.filter((m) => m.grade === gradeFilter)

    const grouped = new Map<string, Material[]>()
    for (const mat of filtered) {
      const key = mat.grade || 'unknown'
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(mat)
    }
    // Sort grade keys (10, 11, 12, then others)
    return Array.from(grouped.entries()).sort(([a], [b]) => {
      const na = parseInt(a, 10)
      const nb = parseInt(b, 10)
      if (isNaN(na) && isNaN(nb)) return a.localeCompare(b)
      if (isNaN(na)) return 1
      if (isNaN(nb)) return -1
      return na - nb
    })
  }, [materials, gradeFilter])

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

      <div className="relative z-10 p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-text-secondary hover:text-white">
              ← Kembali
            </Link>
            <h1 className="text-2xl font-bold text-white">📚 Kelola Materi</h1>
            <span className="text-sm text-text-secondary hidden sm:inline">
              {materials.length} materi
            </span>
          </div>
          {!showForm && <NeonButton onClick={openNewForm}>+ Tambah Materi</NeonButton>}
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <GlassCard className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    {editingId ? '✏️ Edit Materi' : '➕ Tambah Materi Baru'}
                  </h3>
                  {editingId && (
                    <span className="text-xs text-text-muted font-mono">ID: {editingId}</span>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Row 1: Title + Grade */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Judul Materi"
                      placeholder="Contoh: Diskon dan Harga Akhir"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">
                        Tingkat Kelas
                      </label>
                      <select
                        value={form.grade}
                        onChange={(e) => setForm({ ...form, grade: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-uni-primary focus:outline-none transition-colors"
                      >
                        {GRADE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-uni-bg">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <Input
                    label="Deskripsi Singkat"
                    placeholder="Deskripsi singkat materi yang muncul di kartu"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />

                  {/* Links block */}
                  <div className="space-y-4 p-4 bg-black/30 border border-white/5 rounded-lg">
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                      🔗 Tautan Media (Opsional)
                    </p>
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
                  </div>

                  {/* Content tabs: Materi Ringkas vs Materi Full */}
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">
                      Isi Konten Materi (Markdown)
                    </label>
                    <div className="flex gap-1 p-1 bg-black/40 border border-white/10 rounded-lg mb-3 w-full sm:w-auto sm:inline-flex">
                      <TabButton
                        active={activeContentTab === 'summary'}
                        onClick={() => setActiveContentTab('summary')}
                        label="📝 Materi Ringkas"
                        filled={!!form.summaryContent.trim()}
                      />
                      <TabButton
                        active={activeContentTab === 'full'}
                        onClick={() => setActiveContentTab('full')}
                        label="📖 Materi Full"
                        filled={!!form.fullContent.trim()}
                      />
                    </div>

                    {activeContentTab === 'summary' ? (
                      <MarkdownTextarea
                        key="summary-ta"
                        value={form.summaryContent}
                        onChange={(v) => setForm({ ...form, summaryContent: v })}
                        placeholder="# Ringkasan Materi&#10;&#10;Tulis ringkasan singkat dalam format Markdown di sini. Ringkasan ini ditampilkan saat siswa butuh review cepat."
                        helper="Singkat, padat, fokus pada konsep inti. Muncul saat siswa butuh review cepat."
                      />
                    ) : (
                      <MarkdownTextarea
                        key="full-ta"
                        value={form.fullContent}
                        onChange={(v) => setForm({ ...form, fullContent: v })}
                        placeholder="# Materi Lengkap&#10;&#10;Tulis materi lengkap dengan contoh soal dan penjelasan mendalam di sini (Markdown)."
                        helper="Lengkap dengan contoh, langkah-langkah, dan kesalahan umum. Muncul saat siswa di-redirect Wajib Belajar."
                      />
                    )}
                  </div>

                  {error && (
                    <div className="p-3 bg-uni-error/10 border border-uni-error/30 rounded-lg">
                      <p className="text-uni-error text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <NeonButton type="submit" variant="primary" loading={saving}>
                      💾 Simpan
                    </NeonButton>
                    <NeonButton type="button" variant="ghost" onClick={resetForm}>
                      Batal
                    </NeonButton>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grade filter */}
        {!loading && materials.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-text-secondary uppercase tracking-wider mr-1">
              Filter:
            </span>
            <FilterChip
              active={gradeFilter === 'all'}
              onClick={() => setGradeFilter('all')}
              label={`Semua (${materials.length})`}
            />
            {(['10', '11', '12'] as const).map((g) => {
              const count = materials.filter((m) => m.grade === g).length
              if (count === 0) return null
              return (
                <FilterChip
                  key={g}
                  active={gradeFilter === g}
                  onClick={() => setGradeFilter(g)}
                  label={`Kelas ${g} (${count})`}
                />
              )
            })}
          </div>
        )}

        {/* Materials List */}
        {loading ? (
          <div className="text-center text-text-secondary py-12">Memuat materi…</div>
        ) : materials.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-text-secondary mb-4">Belum ada materi</p>
            <NeonButton onClick={openNewForm}>Tambah Materi Pertama</NeonButton>
          </GlassCard>
        ) : groupedMaterials.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-text-secondary">Tidak ada materi untuk filter ini.</p>
          </GlassCard>
        ) : (
          <div className="space-y-8">
            {groupedMaterials.map(([grade, list]) => (
              <section key={grade}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-uni-primary uppercase tracking-wider">
                    Kelas {grade} {isNaN(parseInt(grade)) ? '' : '· SMA'}
                  </h2>
                  <span className="text-xs text-text-muted">{list.length} materi</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-uni-primary/30 to-transparent" />
                </div>

                <div className="space-y-2.5">
                  {list.map((material, index) => (
                    <motion.div
                      key={material.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    >
                      <MaterialRow
                        material={material}
                        onEdit={() => handleEdit(material)}
                        onDelete={() => handleDelete(material.id, material.title)}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

/* ─────────────────────────────────────────────────────────────── */

function MaterialRow({
  material,
  onEdit,
  onDelete,
}: {
  material: Material
  onEdit: () => void
  onDelete: () => void
}) {
  const isRemedial = material.id.startsWith('R')
  return (
    <GlassCard className="p-4 hover:border-uni-primary/60 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="font-semibold text-white truncate">{material.title}</h3>
            <span className="text-xs font-mono text-text-muted bg-white/5 px-1.5 py-0.5 rounded">
              {material.id}
            </span>
            {isRemedial && (
              <span className="text-xs font-semibold text-uni-warning bg-uni-warning/15 border border-uni-warning/30 px-1.5 py-0.5 rounded">
                REMEDIAL
              </span>
            )}
            <span className="text-xs font-semibold text-uni-primary bg-uni-primary/15 border border-uni-primary/30 px-1.5 py-0.5 rounded">
              Kelas {material.grade}
            </span>
            {material.questionCount !== undefined && (
              <span className="text-xs font-semibold text-uni-accent bg-uni-accent/15 border border-uni-accent/30 px-1.5 py-0.5 rounded">
                {material.questionCount} soal
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary line-clamp-1 mb-2">
            {material.description || 'Tidak ada deskripsi'}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
            <ContentBadge filled={!!material.hasSummaryContent} label="Ringkas" icon="📝" />
            <ContentBadge filled={!!material.hasFullContent} label="Full" icon="📖" />
            {material.videoUrl && <span>🎬 Video</span>}
            {material.summaryUrl && <span>📄 PDF Ringkas</span>}
            {material.fullUrl && <span>📕 PDF Full</span>}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            title="Edit materi"
            className="p-2 text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            title="Hapus materi"
            className="p-2 text-text-secondary hover:text-uni-error hover:bg-uni-error/10 rounded-lg transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>
    </GlassCard>
  )
}

function ContentBadge({ filled, label, icon }: { filled: boolean; label: string; icon: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium ${
        filled
          ? 'bg-uni-success/10 border-uni-success/30 text-uni-success'
          : 'bg-white/3 border-white/10 text-text-muted'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {filled ? <span>✓</span> : <span className="opacity-60">—</span>}
    </span>
  )
}

function TabButton({
  active,
  onClick,
  label,
  filled,
}: {
  active: boolean
  onClick: () => void
  label: string
  filled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
        active
          ? 'bg-uni-primary/20 text-uni-primary shadow-[0_0_12px_-4px_rgba(0,229,255,0.6)]'
          : 'text-text-secondary hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
      {filled && (
        <span className="w-1.5 h-1.5 rounded-full bg-uni-success shadow-[0_0_6px_var(--success)]" />
      )}
    </button>
  )
}

function MarkdownTextarea({
  value,
  onChange,
  placeholder,
  helper,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  helper?: string
}) {
  const lineCount = value ? value.split('\n').length : 0
  const charCount = value.length
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={12}
        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-sm leading-relaxed placeholder:text-text-muted/60 focus:border-uni-primary focus:outline-none transition-colors resize-y min-h-[240px]"
        spellCheck={false}
      />
      <div className="flex flex-wrap justify-between gap-2 mt-1.5 text-xs text-text-muted">
        {helper && <span>{helper}</span>}
        <span className="ml-auto tabular-nums">
          {lineCount} baris · {charCount} karakter
        </span>
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        active
          ? 'bg-uni-primary/20 border-uni-primary/60 text-uni-primary shadow-[0_0_10px_-4px_rgba(0,229,255,0.7)]'
          : 'bg-white/3 border-white/10 text-text-secondary hover:border-white/20 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}
