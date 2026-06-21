'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth/context'

interface Material {
  id: string
  title: string
  questionCount: number
}

interface Question {
  id: string
  materialId: string
  mode: string
  indicator: string
  difficulty: number
  questionType: string | null
  question: string
  correct: string
}

const MODE_LABELS: Record<string, string> = {
  PRACTICE: '🎯 Latihan',
  PRETEST: '📝 Pre-test',
  POSTTEST: '✅ Post-test',
  ALL: '🔄 Semua',
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Mudah',
  2: 'Sedang',
  3: 'Sulit',
}

export default function AdminQuestionsPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const { showToast } = useToast()

  const [materials, setMaterials] = useState<Material[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportFilter, setExportFilter] = useState<string>('__ALL__')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [headerWarnings, setHeaderWarnings] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/admin/login')
    }
  }, [user, isLoading, router])

  const fetchMaterials = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/admin/materials', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setMaterials(data.materials || [])
      if (data.materials?.length > 0 && !selectedMaterial) {
        setSelectedMaterial(data.materials[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error)
      showToast('Gagal memuat daftar materi', 'error')
    } finally {
      setLoading(false)
    }
  }, [token, selectedMaterial, showToast])

  const fetchQuestions = useCallback(
    async (materialId: string) => {
      if (!token) return
      try {
        const res = await fetch(`/api/admin/questions?materialId=${materialId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setQuestions(data.questions || [])
      } catch (error) {
        console.error('Failed to fetch questions:', error)
      }
    },
    [token]
  )

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  useEffect(() => {
    if (selectedMaterial) fetchQuestions(selectedMaterial)
  }, [selectedMaterial, fetchQuestions])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file || !selectedMaterial || !token) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('File harus berformat .csv', 'error')
      return
    }

    setUploading(true)
    setValidationErrors([])
    setHeaderWarnings([])

    const formData = new FormData()
    formData.append('file', file)
    formData.append('materialId', selectedMaterial)

    try {
      const res = await fetch('/api/admin/questions/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        const errs = data.error?.errors as string[] | undefined
        const warns = data.error?.headerWarnings as string[] | undefined
        if (Array.isArray(errs) && errs.length > 0) setValidationErrors(errs)
        if (Array.isArray(warns) && warns.length > 0) setHeaderWarnings(warns)
        showToast(data.error?.message || 'Upload gagal', 'error', 5000)
        return
      }

      showToast(`Berhasil upload ${data.count} soal`, 'success')
      if (Array.isArray(data.headerWarnings) && data.headerWarnings.length > 0) {
        setHeaderWarnings(data.headerWarnings)
      }
      await fetchQuestions(selectedMaterial)
      await fetchMaterials()
    } catch (error) {
      console.error('Upload error:', error)
      showToast('Koneksi gagal saat upload', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Yakin ingin menghapus SEMUA soal di materi ini?')) return
    try {
      const res = await fetch(`/api/admin/questions?materialId=${selectedMaterial}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Gagal menghapus soal')
      showToast('Semua soal berhasil dihapus', 'success')
      await fetchQuestions(selectedMaterial)
      await fetchMaterials()
    } catch (error) {
      console.error('Delete error:', error)
      showToast('Gagal menghapus soal', 'error')
    }
  }

  const downloadTemplate = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/admin/questions/template', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Gagal mengunduh template')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'unimath_template_soal_v2.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Template CSV v2 (A–E) berhasil diunduh', 'success')
    } catch (error) {
      console.error('Template download error:', error)
      showToast('Gagal mengunduh template', 'error')
    }
  }

  const exportQuestions = async () => {
    if (!token) return
    setExporting(true)
    try {
      const params = exportFilter !== '__ALL__' ? `?materialId=${exportFilter}` : ''
      const res = await fetch(`/api/admin/questions/export${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Gagal mengekspor soal')
      const blob = await res.blob()
      const now = new Date().toISOString().slice(0, 10)
      const suffix = exportFilter !== '__ALL__' ? `_${exportFilter}` : '_semua'
      const filename = `unimath_soal_export${suffix}_${now}.csv`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast(`Export soal berhasil: ${filename}`, 'success')
    } catch (error) {
      console.error('Export error:', error)
      showToast('Gagal mengekspor soal', 'error')
    } finally {
      setExporting(false)
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

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-text-secondary hover:text-white">
              ← Kembali
            </Link>
            <h1 className="text-2xl font-bold text-white">❓ Kelola Soal</h1>
          </div>
        </div>

        {/* ── Upload Section ───────────────────────────────────────── */}
        <GlassCard className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upload Soal dari CSV</h3>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Pilih Materi</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-uni-primary focus:outline-none transition-colors"
              >
                {materials.length === 0 && <option value="">(belum ada materi)</option>}
                {materials.map((mat) => (
                  <option key={mat.id} value={mat.id} className="bg-uni-bg">
                    {mat.title} ({mat.questionCount} soal)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Upload File CSV</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                disabled={uploading || !selectedMaterial}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-uni-primary file:text-white disabled:opacity-50"
              />
              {uploading && (
                <p className="text-xs text-uni-primary mt-2 flex items-center gap-2">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
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
                  Memvalidasi & mengupload…
                </p>
              )}
            </div>
          </div>

          {/* Header warnings (non-blocking) */}
          {headerWarnings.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-300 font-semibold mb-1">⚠️ Peringatan Header:</p>
              <ul className="text-xs text-yellow-200 list-disc list-inside space-y-0.5">
                {headerWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Validation errors (per row) */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-uni-error/10 border border-uni-error/30 rounded-lg">
              <p className="text-xs text-uni-error font-semibold mb-2">
                ❌ {validationErrors.length} error ditemukan:
              </p>
              <div className="max-h-40 overflow-y-auto">
                <ul className="text-xs text-red-200 list-disc list-inside space-y-0.5">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap items-center">
            <NeonButton variant="secondary" onClick={downloadTemplate}>
              📥 Download Template CSV
            </NeonButton>
            {questions.length > 0 && (
              <NeonButton variant="ghost" onClick={handleDeleteAll}>
                🗑️ Hapus Semua Soal
              </NeonButton>
            )}
          </div>

          {/* ── Export Section ──────────────────────────────────── */}
          <div className="mt-4 p-4 bg-green-900/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-300 font-semibold mb-3">📤 Export Soal ke CSV (Arsip Lengkap)</p>
            <div className="flex gap-2 flex-wrap items-center">
              <select
                value={exportFilter}
                onChange={(e) => setExportFilter(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-green-400 focus:outline-none transition-colors"
              >
                <option value="__ALL__" className="bg-uni-bg">📦 Semua Materi</option>
                {materials.map((mat) => (
                  <option key={mat.id} value={mat.id} className="bg-uni-bg">
                    {mat.title} ({mat.questionCount} soal)
                  </option>
                ))}
              </select>
              <NeonButton
                variant="secondary"
                onClick={exportQuestions}
                disabled={exporting}
              >
                {exporting ? '⏳ Mengekspor...' : '⬇️ Export CSV'}
              </NeonButton>
            </div>
            <p className="text-xs text-text-muted mt-2">
              File export berisi kolom lengkap: id, judulMateri, semua opsi A–E, kunci jawaban, hint, dll.
            </p>
          </div>

          <details className="mt-4 p-4 bg-uni-bg-secondary/30 rounded-lg" open>
            <summary className="cursor-pointer text-sm text-text-secondary font-semibold">
              📖 Panduan Format CSV v2 (klik untuk tutup)
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs text-text-secondary mb-1">Urutan kolom v2 (header wajib ada di baris 1) — <b className="text-uni-primary">16 kolom</b>:</p>
                <code className="block text-[11px] text-uni-primary bg-black/40 p-2 rounded break-all">
                  mode, indicator, difficulty, questionType, question, optA, optB, optC, optD, <b>optE</b>, correct, hint1, hint2, hint3, explanation, remedialMaterialId
                </code>
              </div>
              <ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
                <li>
                  <b className="text-text-secondary">mode</b>: PRACTICE / PRETEST / POSTTEST / ALL
                </li>
                <li>
                  <b className="text-text-secondary">indicator</b>: I1 / I2 / I3 / I4
                </li>
                <li>
                  <b className="text-text-secondary">difficulty</b>: 1/2/3 atau MUDAH/SEDANG/SULIT
                </li>
                <li>
                  <b className="text-text-secondary">questionType</b>: PG atau URAIAN
                </li>
                <li>
                  <b className="text-green-400">optE</b>: opsi E — <b className="text-green-300">WAJIB untuk soal PG</b> (posisi ke-10, sebelum correct)
                </li>
                <li>
                  <b className="text-text-secondary">correct</b>: A/B/C/D/<b className="text-green-400">E</b> untuk PG (boleh kosong untuk URAIAN)
                </li>
                <li>
                  <b className="text-text-secondary">hint1/2/3</b>: dipakai saat siswa salah 1/2/3 kali (boleh kosong)
                </li>
                <li>
                  <b className="text-text-secondary">remedialMaterialId</b>: materi remedial kalau salah 3x (boleh kosong)
                </li>
                <li>Huruf besar/kecil enum tidak dibedakan (mudah/MUDAH sama-sama valid).</li>
                <li className="text-yellow-300/80">⚠️ Format lama (tanpa optE, 15 kolom) masih diterima — optE akan diisi kosong otomatis.</li>
              </ul>
            </div>
          </details>
        </GlassCard>

        {/* ── Questions List ─────────────────────────────────────── */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Daftar Soal ({questions.length})</h3>

          {questions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-text-secondary">Belum ada soal untuk materi ini</p>
              <p className="text-xs text-text-muted mt-1">
                Download template, isi, lalu upload untuk menambah soal
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {questions.map((q, index) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(index * 0.01, 0.3) }}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3 flex-wrap">
                    <span className="text-[10px] bg-uni-primary/20 text-uni-primary px-2 py-0.5 rounded font-semibold">
                      {MODE_LABELS[q.mode] || q.mode}
                    </span>
                    <span className="text-[10px] bg-uni-accent/20 text-uni-accent px-2 py-0.5 rounded font-semibold">
                      {q.indicator}
                    </span>
                    <span className="text-[10px] bg-uni-warning/20 text-uni-warning px-2 py-0.5 rounded font-semibold">
                      {DIFFICULTY_LABELS[q.difficulty] || `Lv.${q.difficulty}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm line-clamp-2">{q.question}</p>
                      <p className="text-xs text-text-muted mt-1">Jawaban: {q.correct}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </main>
  )
}
