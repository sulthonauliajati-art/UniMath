'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface StudentStat {
  id: string
  name: string
  nisn: string | null
  totalPoints: number | null
  totalSessions: number
  highestFloor: number
  accuracy: number
  totalAttempts: number
  lastPracticeAt: string | null
  passwordStatus: string | null
}

interface Material {
  id: string
  title: string
  order: number
}

type ExportType = 'practice' | 'research'
type ResearchFilter = 'ALL' | 'PRETEST' | 'POSTTEST'

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function AdminReportsClient() {
  const { user, token, isLoading } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  // Redirect jika bukan admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/admin/login')
    }
  }, [user, isLoading, router])

  const [students, setStudents] = useState<StudentStat[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [search, setSearch] = useState('')

  // Filter state untuk export
  const [filterStudentId, setFilterStudentId] = useState('')
  const [filterMaterialId, setFilterMaterialId] = useState('')
  const [researchFilter, setResearchFilter] = useState<ResearchFilter>('ALL')

  const [downloading, setDownloading] = useState<ExportType | null>(null)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const [usersRes, matsRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/materials', { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (usersRes.ok) {
        const data = await usersRes.json()
        setStudents(data.students || [])
      }
      if (matsRes.ok) {
        const data = await matsRes.json()
        setMaterials(
          (data.materials || []).sort((a: Material, b: Material) => a.order - b.order)
        )
      }
    } catch (err) {
      showToast('Gagal memuat data', 'error')
    } finally {
      setLoadingData(false)
    }
  }, [token, showToast])

  useEffect(() => {
    if (token) fetchData()
  }, [token, fetchData])

  const handleDownload = async (type: ExportType) => {
    if (!token) return
    setDownloading(type)
    try {
      let url = ''
      if (type === 'practice') {
        const params = new URLSearchParams()
        if (filterStudentId) params.set('studentId', filterStudentId)
        if (filterMaterialId) params.set('materialId', filterMaterialId)
        url = `/api/admin/export/practice?${params.toString()}`
      } else {
        const params = new URLSearchParams()
        if (researchFilter !== 'ALL') params.set('testType', researchFilter)
        if (filterStudentId) params.set('studentId', filterStudentId)
        if (filterMaterialId) params.set('materialId', filterMaterialId)
        url = `/api/admin/export/research?${params.toString()}`
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.error?.message || 'Gagal mengunduh file')
      }

      // Trigger download
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const now = new Date().toISOString().slice(0, 10)
      a.href = objectUrl
      a.download = type === 'practice'
        ? `rekap_latihan_${now}.csv`
        : `rekap_penelitian_${researchFilter.toLowerCase()}_${now}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)

      showToast('File berhasil diunduh!', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengunduh', 'error')
    } finally {
      setDownloading(null)
    }
  }

  if (isLoading || !user) return <LoadingScreen />

  const q = search.trim().toLowerCase()
  const filteredStudents = q
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.nisn || '').toLowerCase().includes(q)
      )
    : students

  const totalStudents = students.length
  const totalSessions = students.reduce((acc, s) => acc + s.totalSessions, 0)
  const totalAttempts = students.reduce((acc, s) => acc + s.totalAttempts, 0)
  const avgAccuracy =
    students.filter((s) => s.totalAttempts > 0).length > 0
      ? Math.round(
          students
            .filter((s) => s.totalAttempts > 0)
            .reduce((acc, s) => acc + s.accuracy, 0) /
            students.filter((s) => s.totalAttempts > 0).length
        )
      : 0

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />

      <div className="relative z-10 p-4 sm:p-6 max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <Link
              href="/admin/dashboard"
              className="text-text-secondary hover:text-white text-sm mb-2 inline-block"
            >
              ← Kembali ke Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white">📊 Export & Rekap Data</h1>
            <p className="text-text-secondary text-sm mt-1">
              Download data latihan dan penelitian siswa dalam format CSV
            </p>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Siswa', value: totalStudents, icon: '👥', color: 'text-cyan-300' },
            { label: 'Total Sesi Latihan', value: totalSessions, icon: '🎮', color: 'text-emerald-300' },
            { label: 'Total Attempt', value: totalAttempts, icon: '📝', color: 'text-amber-300' },
            { label: 'Akurasi Rata-rata', value: `${avgAccuracy}%`, icon: '🎯', color: 'text-purple-300' },
          ].map((stat) => (
            <GlassCard key={stat.label} className="p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-text-secondary mt-1">{stat.label}</div>
            </GlassCard>
          ))}
        </div>

        {/* ── Export Controls ── */}
        <GlassCard className="p-5 mb-6">
          <h2 className="text-white font-semibold text-lg mb-4">⬇️ Download Data</h2>

          {/* Filter row */}
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Filter Siswa (opsional)</label>
              <select
                value={filterStudentId}
                onChange={(e) => setFilterStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-uni-primary focus:outline-none"
              >
                <option value="">Semua Siswa</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.nisn ? `(${s.nisn})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Filter Materi (opsional)</label>
              <select
                value={filterMaterialId}
                onChange={(e) => setFilterMaterialId(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-uni-primary focus:outline-none"
              >
                <option value="">Semua Materi</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.order}. {m.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Filter Tipe Tes (khusus Penelitian)</label>
              <select
                value={researchFilter}
                onChange={(e) => setResearchFilter(e.target.value as ResearchFilter)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-uni-primary focus:outline-none"
              >
                <option value="ALL">Semua (Pre & Post Test)</option>
                <option value="PRETEST">Pre-Test saja</option>
                <option value="POSTTEST">Post-Test saja</option>
              </select>
            </div>
          </div>

          {/* Download buttons */}
          <div className="grid sm:grid-cols-2 gap-3">
            {/* Practice Export */}
            <div className="p-4 bg-black/30 border border-cyan-500/20 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">🎮</span>
                <div>
                  <h3 className="text-white font-semibold">Data Latihan (Practice)</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Semua attempt latihan siswa: NISN, kelas, session, floor, jawaban, XP, accuracy
                  </p>
                </div>
              </div>
              <div className="text-xs text-text-muted mb-3 bg-black/20 rounded-lg p-2 font-mono">
                rekap_latihan_[tanggal].csv
              </div>
              <button
                onClick={() => handleDownload('practice')}
                disabled={downloading !== null}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold text-sm hover:from-cyan-400 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              >
                {downloading === 'practice' ? '⏳ Menyiapkan…' : '⬇️ Download CSV Latihan'}
              </button>
            </div>

            {/* Research Export */}
            <div className="p-4 bg-black/30 border border-uni-accent/20 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">🔬</span>
                <div>
                  <h3 className="text-white font-semibold">Data Penelitian (Pre/Post Test)</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Semua jawaban tes siswa: NISN, kelas, indikator, jawaban, skor, waktu respons
                  </p>
                </div>
              </div>
              <div className="text-xs text-text-muted mb-3 bg-black/20 rounded-lg p-2 font-mono">
                rekap_penelitian_[tipe]_[tanggal].csv
              </div>
              <button
                onClick={() => handleDownload('research')}
                disabled={downloading !== null}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-uni-accent to-uni-accent text-white font-semibold text-sm hover:from-uni-primary hover:to-uni-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_12px_rgba(147,51,234,0.3)]"
              >
                {downloading === 'research' ? '⏳ Menyiapkan…' : '⬇️ Download CSV Penelitian'}
              </button>
            </div>
          </div>

          <p className="text-xs text-text-muted mt-3 text-center">
            💡 File CSV menggunakan encoding UTF-8 BOM — bisa langsung dibuka di Excel tanpa karakter rusak
          </p>
        </GlassCard>

        {/* ── Student Detail Table ── */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-white font-semibold text-lg">📋 Detail Progress Siswa</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / NISN…"
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-text-muted text-sm focus:border-uni-primary focus:outline-none min-w-[220px]"
            />
          </div>

          {loadingData ? (
            <div className="text-center text-text-secondary py-8">Memuat data…</div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center text-text-secondary py-8">
              {students.length === 0 ? 'Belum ada siswa terdaftar' : 'Tidak ada siswa yang cocok'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-3 text-text-secondary font-medium text-xs uppercase tracking-wider">Nama</th>
                    <th className="text-left py-2 px-3 text-text-secondary font-medium text-xs uppercase tracking-wider">NISN</th>
                    <th className="text-center py-2 px-3 text-text-secondary font-medium text-xs uppercase tracking-wider">XP</th>
                    <th className="text-center py-2 px-3 text-text-secondary font-medium text-xs uppercase tracking-wider">Sesi</th>
                    <th className="text-center py-2 px-3 text-text-secondary font-medium text-xs uppercase tracking-wider">Lantai Maks</th>
                    <th className="text-center py-2 px-3 text-text-secondary font-medium text-xs uppercase tracking-wider">Attempt</th>
                    <th className="text-center py-2 px-3 text-text-secondary font-medium text-xs uppercase tracking-wider">Akurasi</th>
                    <th className="text-left py-2 px-3 text-text-secondary font-medium text-xs uppercase tracking-wider">Terakhir Latihan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{s.name}</div>
                        <div className={`text-xs mt-0.5 ${s.passwordStatus === 'SET' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {s.passwordStatus === 'SET' ? '✓ Aktif' : '⚠ Belum set password'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-text-secondary font-mono text-xs">
                        {s.nisn || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-amber-300 font-bold">{s.totalPoints || 0}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-bold ${s.totalSessions > 0 ? 'text-cyan-300' : 'text-text-muted'}`}>
                          {s.totalSessions}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-bold ${s.highestFloor > 0 ? 'text-emerald-300' : 'text-text-muted'}`}>
                          {s.highestFloor > 0 ? `🏢 ${s.highestFloor}` : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-text-secondary">
                        {s.totalAttempts}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {s.totalAttempts > 0 ? (
                          <span className={`font-bold text-sm ${
                            s.accuracy >= 75 ? 'text-emerald-300' :
                            s.accuracy >= 50 ? 'text-amber-300' :
                            'text-red-300'
                          }`}>
                            {s.accuracy}%
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs">Belum latihan</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-text-secondary text-xs">
                        {formatDate(s.lastPracticeAt)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 text-xs text-text-muted text-right">
            Menampilkan {filteredStudents.length} dari {students.length} siswa
          </div>
        </GlassCard>
      </div>
    </main>
  )
}
