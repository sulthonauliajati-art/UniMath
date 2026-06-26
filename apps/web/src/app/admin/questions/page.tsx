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

type QuestionMode = 'PRACTICE' | 'PRETEST' | 'POSTTEST'
type MainTab = 'practice' | 'evaluation'

const MAIN_TABS: { key: MainTab; label: string; emoji: string; desc: string }[] = [
  { key: 'practice', label: 'Latihan', emoji: '🎯', desc: 'Soal mode latihan dengan hint & remedial' },
  { key: 'evaluation', label: 'Evaluasi', emoji: '📝', desc: 'Soal Pre-test & Post-test — wajib tepat 10 soal total' },
]

const EVAL_SUB_TABS: { key: QuestionMode; label: string; emoji: string }[] = [
  { key: 'PRETEST', label: 'Pre-test', emoji: '📝' },
  { key: 'POSTTEST', label: 'Post-test', emoji: '✅' },
]

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
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('practice')
  const [activeEvalSubMode, setActiveEvalSubMode] = useState<QuestionMode>('PRETEST')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportFilter, setExportFilter] = useState<string>('__ALL__')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [headerWarnings, setHeaderWarnings] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Derived active mode — disinkronkan dari main tab + sub tab
  const activeMode: QuestionMode = activeMainTab === 'practice' ? 'PRACTICE' : activeEvalSubMode
  const isEvaluation = activeMainTab === 'evaluation'

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
    } catch {
      showToast('Gagal memuat daftar materi', 'error')
    } finally {
      setLoading(false)
    }
  }, [token, selectedMaterial, showToast])

  const fetchQuestions = useCallback(
    async (materialId: string) => {
      if (!token) return
      try {
        const res = await fetch(
          `/api/admin/questions?materialId=${materialId}&mode=${activeMode}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const data = await res.json()
        setQuestions(data.questions || [])
      } catch {
        // silent
      }
    },
    [token, activeMode]
  )

  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  // Auto-set material untuk tab Evaluasi (pakai material pertama sbg container)
  useEffect(() => {
    if (isEvaluation && materials.length > 0 && selectedMaterial !== materials[0].id) {
      setSelectedMaterial(materials[0].id)
    }
  }, [isEvaluation, materials, selectedMaterial])

  useEffect(() => {
    if (selectedMaterial) fetchQuestions(selectedMaterial)
  }, [selectedMaterial, activeMode, fetchQuestions])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    const isBulk = selectedMaterial === '__BULK__'
    if (!file || (!isBulk && !selectedMaterial) || !token) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('File harus berformat .csv', 'error')
      return
    }

    setUploading(true)
    setValidationErrors([])
    setHeaderWarnings([])

    const formData = new FormData()
    formData.append('file', file)
    formData.append('materialId', isBulk ? '' : selectedMaterial)
    formData.append('mode', activeMode)

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

      const skipped = data.skippedDuplicates || 0
      let msg = `✅ ${data.count} soal berhasil diimpor`
      if (skipped > 0) msg += ` (${skipped} duplikat dilewati)`
      if (data.byMaterial && Object.keys(data.byMaterial).length > 1) {
        const breakdown = Object.entries(data.byMaterial as Record<string, number>)
          .map(([id, n]) => `${id}: ${n}`)
          .join(', ')
        msg += `\n📍 ${breakdown}`
      }
      showToast(msg, 'success', 8000)
      if (Array.isArray(data.headerWarnings) && data.headerWarnings.length > 0) {
        setHeaderWarnings(data.headerWarnings)
      }
      if (!isBulk) await fetchQuestions(selectedMaterial)
      await fetchMaterials()
    } catch {
      showToast('Koneksi gagal saat upload', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAll = async () => {
    const tabLabel = MODE_LABELS[activeMode] || activeMode
    const confirmMsg = isEvaluation
      ? `Yakin ingin menghapus SEMUA soal ${tabLabel} secara global?`
      : `Yakin ingin menghapus SEMUA soal ${tabLabel} di materi ini?`
    if (!confirm(confirmMsg)) return

    try {
      const params = new URLSearchParams({ materialId: selectedMaterial })
      if (isEvaluation) params.set('mode', activeMode)
      const res = await fetch(`/api/admin/questions?${params}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Gagal menghapus soal')
      showToast('Semua soal berhasil dihapus', 'success')
      await fetchQuestions(selectedMaterial)
      await fetchMaterials()
    } catch {
      showToast('Gagal menghapus soal', 'error')
    }
  }

  const downloadTemplate = async () => {
    if (!token) return
    try {
      const res = await fetch(`/api/admin/questions/template?mode=${activeMode}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Gagal mengunduh template')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `unimath_template_${activeMode.toLowerCase()}_v2.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Template CSV berhasil diunduh', 'success')
    } catch {
      showToast('Gagal mengunduh template', 'error')
    }
  }

  const exportQuestions = async () => {
    if (!token) return
    setExporting(true)
    try {
      const params = new URLSearchParams()
      // Evaluation: export by container material (global)
      if (isEvaluation) {
        params.set('materialId', selectedMaterial)
      } else if (exportFilter !== '__ALL__') {
        params.set('materialId', exportFilter)
      }
      params.set('mode', activeMode)
      const res = await fetch(`/api/admin/questions/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Gagal mengekspor soal')
      const blob = await res.blob()
      const now = new Date().toISOString().slice(0, 10)
      const suffix = isEvaluation ? `_${activeMode.toLowerCase()}` : exportFilter !== '__ALL__' ? `_${exportFilter}` : '_semua'
      const filename = `unimath_soal_${activeMode.toLowerCase()}${suffix}_${now}.csv`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast(`Export soal berhasil: ${filename}`, 'success')
    } catch {
      showToast('Gagal mengekspor soal', 'error')
    } finally {
      setExporting(false)
    }
  }

  const isPreOrPost = activeMode === 'PRETEST' || activeMode === 'POSTTEST'
  const requiredCount = isPreOrPost ? 10 : undefined
  const questionCountOk = !isPreOrPost || questions.length === 10
  const activeLabel = MODE_LABELS[activeMode] || activeMode
  const activeEmoji = isPreOrPost
    ? EVAL_SUB_TABS.find(s => s.key === activeMode)?.emoji || '📝'
    : '🎯'
  const activeDesc = isPreOrPost
    ? `Soal ${activeMode === 'PRETEST' ? 'pre-test' : 'post-test'} — wajib tepat 10 soal total`
    : 'Soal mode latihan dengan hint & remedial'

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-text-secondary hover:text-white">← Kembali</Link>
            <h1 className="text-2xl font-bold text-white">❓ Kelola Soal</h1>
          </div>
        </div>

        {/* ═══ Main Tabs (2 tab: Latihan / Evaluasi) ═══ */}
        <div className="flex gap-1 mb-3 bg-black/30 rounded-xl p-1 border border-white/5">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveMainTab(tab.key)}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeMainTab === tab.key
                  ? 'bg-uni-primary/20 text-uni-primary border border-uni-primary/40 shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="mr-1.5">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ Sub-Navigation Pills (hanya muncul saat Tab Evaluasi aktif) ═══ */}
        {activeMainTab === 'evaluation' && (
          <div className="flex items-center gap-2 mb-4 pl-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mr-1">Sub-mode:</span>
            <div className="flex gap-1 bg-slate-800/60 rounded-lg p-0.5 border border-slate-700/30">
              {EVAL_SUB_TABS.map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => setActiveEvalSubMode(sub.key)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                    activeEvalSubMode === sub.key
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
                  }`}
                >
                  <span className="mr-1">{sub.emoji}</span>
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode Info Banner */}
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          isPreOrPost
            ? questionCountOk
              ? 'bg-green-500/10 border border-green-500/20 text-green-300'
              : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300'
            : 'bg-uni-primary/5 border border-uni-primary/10 text-text-secondary'
        }`}>
          <p>
            <b>{activeEmoji} Mode {activeLabel}:</b> {activeDesc}
            {isPreOrPost && (
              <span className="ml-2 font-bold">
                — {questions.length}/{requiredCount} soal
                {!questionCountOk && ' ⚠️ Butuh tepat 10 soal!'}
                {questionCountOk && ' ✅'}
              </span>
            )}
          </p>
        </div>

        {/* Upload Section */}
        <GlassCard className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">📤 Upload Soal dari CSV</h3>
          <div className={`grid ${isEvaluation ? 'grid-cols-1' : 'md:grid-cols-2'} gap-4 mb-4`}>
            {/* Material dropdown — disembunyikan di tab Evaluasi */}
            {!isEvaluation && (
              <div>
                <label htmlFor="admin-material-select" className="block text-sm text-text-secondary mb-2">Pilih Materi</label>
                <select
                  id="admin-material-select"
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-uni-primary focus:outline-none transition-colors"
                >
                  <option value="__BULK__" className="bg-uni-bg font-bold">📦 Semua Materi (dari file export 20 kolom)</option>
                  <option value="" disabled className="bg-uni-bg text-gray-500">── atau pilih 1 materi ──</option>
                  {materials.length === 0 && <option value="">(belum ada materi)</option>}
                  {materials.map((mat) => (
                    <option key={mat.id} value={mat.id} className="bg-uni-bg">{mat.title} ({mat.questionCount} soal)</option>
                  ))}
                </select>
                {selectedMaterial === '__BULK__' && (
                  <p className="text-xs text-cyan-400 mt-1.5">⚡ Mode multi-materi: materialId dibaca otomatis dari kolom CSV</p>
                )}
              </div>
            )}
            <div>
              <label htmlFor="admin-csv-upload" className="block text-sm text-text-secondary mb-2">
                Upload File CSV
                {isEvaluation && <span className="ml-2 text-[10px] text-cyan-400/70 font-normal">— Soal global (semua materi)</span>}
              </label>
              <input
                id="admin-csv-upload"
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                disabled={uploading || (!isEvaluation && !selectedMaterial)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-uni-primary file:text-white disabled:opacity-50"
              />
              {uploading && (
                <p className="text-xs text-uni-primary mt-2 flex items-center gap-2" role="status">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Memvalidasi & mengupload…
                </p>
              )}
            </div>
          </div>

          {headerWarnings.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg" role="alert">
              <p className="text-xs text-yellow-300 font-semibold mb-1">⚠️ Peringatan Header:</p>
              <ul className="text-xs text-yellow-200 list-disc list-inside space-y-0.5">{headerWarnings.map((w, i) => (<li key={i}>{w}</li>))}</ul>
            </div>
          )}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-uni-error/10 border border-uni-error/30 rounded-lg" role="alert">
              <p className="text-xs text-uni-error font-semibold mb-2">❌ {validationErrors.length} error ditemukan:</p>
              <div className="max-h-40 overflow-y-auto">
                <ul className="text-xs text-red-200 list-disc list-inside space-y-0.5">{validationErrors.map((err, i) => (<li key={i}>{err}</li>))}</ul>
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap items-center">
            <NeonButton variant="secondary" onClick={downloadTemplate}>📥 Download Template CSV</NeonButton>
            {questions.length > 0 && (
              <NeonButton variant="ghost" onClick={handleDeleteAll}>🗑️ Hapus Semua Soal</NeonButton>
            )}
          </div>

          <div className="mt-4 p-4 bg-green-900/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-300 font-semibold mb-3">📤 Export Soal ke CSV (Arsip Lengkap)</p>
            <div className="flex gap-2 flex-wrap items-center">
              {/* Material filter — disembunyikan di tab Evaluasi (export global by mode) */}
              {!isEvaluation && (
                <select value={exportFilter} onChange={(e) => setExportFilter(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-green-400 focus:outline-none transition-colors">
                  <option value="__ALL__" className="bg-uni-bg">📦 Semua Materi</option>
                  {materials.map((mat) => (<option key={mat.id} value={mat.id} className="bg-uni-bg">{mat.title} ({mat.questionCount} soal)</option>))}
                </select>
              )}
              <NeonButton variant="secondary" onClick={exportQuestions} disabled={exporting}>
                {exporting ? '⏳ Mengekspor...' : '⬇️ Export CSV'}
              </NeonButton>
              {isEvaluation && (
                <span className="text-[10px] text-green-400/60">Mengekspor semua soal {activeLabel.toLowerCase()} (global)</span>
              )}
            </div>
          </div>

          <details className="mt-4 p-4 bg-uni-bg-secondary/30 rounded-lg" open>
            <summary className="cursor-pointer text-sm text-text-secondary font-semibold">📖 Panduan Format CSV v2</summary>
            <div className="mt-3 space-y-3">
              <code className="block text-xs text-uni-primary bg-black/40 p-2 rounded break-all">mode, indicator, difficulty, questionType, question, optA, optB, optC, optD, optE, correct, hint1, hint2, hint3, explanation, remedialMaterialId</code>
              <ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
                <li><b className="text-text-secondary">mode</b>: PRACTICE / PRETEST / POSTTEST / ALL</li>
                <li><b className="text-green-400">optE</b>: opsi E — WAJIB untuk soal PG</li>
                {isPreOrPost && <li className="text-yellow-300/80">⚠️ <b>{activeLabel}</b>: wajib tepat 10 soal total.</li>}
              </ul>
            </div>
          </details>
        </GlassCard>

        {/* Questions List */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Daftar Soal {activeLabel} ({questions.length})
            {isPreOrPost && !questionCountOk && <span className="text-yellow-300 text-sm ml-2">⚠️ Butuh tepat 10 soal</span>}
          </h3>
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-text-secondary">
                {isEvaluation
                  ? `Belum ada soal ${activeLabel} (global)`
                  : `Belum ada soal ${activeLabel} untuk materi ini`}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {isEvaluation
                  ? 'Download template, isi tepat 10 soal total, lalu upload'
                  : 'Download template, isi 10 soal (untuk pre/post-test), lalu upload'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {questions.map((q, index) => (
                <motion.div key={q.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(index * 0.01, 0.3) }} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <div className="flex items-start gap-3 flex-wrap">
                    <span className="text-xs bg-uni-primary/20 text-uni-primary px-2 py-0.5 rounded font-semibold">{MODE_LABELS[q.mode] || q.mode}</span>
                    <span className="text-xs bg-uni-accent/20 text-uni-accent px-2 py-0.5 rounded font-semibold">{q.indicator}</span>
                    <span className="text-xs bg-uni-warning/20 text-uni-warning px-2 py-0.5 rounded font-semibold">{DIFFICULTY_LABELS[q.difficulty] || `Lv.${q.difficulty}`}</span>
                    <span className="text-xs text-text-muted ml-auto">#{index + 1}</span>
                    <div className="w-full min-w-0">
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
