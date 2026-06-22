'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground, TowerBackground, GlassCard } from '@/components/ui'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface Stats {
  totalFloors: number
  totalSessions: number
  totalAttempts: number
  correctAttempts: number
  accuracy: number
}

interface MaterialProgress {
  id: string
  name: string
  progress: number
}

interface IndicatorStat { indicator: string; label: string; correct: number; total: number; accuracy: number }
interface DifficultyStat { difficulty: number; label: string; correct: number; total: number; accuracy: number }
interface MaterialStat { materialId: string; title: string; correct: number; total: number; accuracy: number }

interface ReportData {
  ready: boolean
  totalFloors: number
  minFloors?: number
  floorsNeeded?: number
  totalAttempts?: number
  overallAccuracy?: number
  byIndicator?: IndicatorStat[]
  byDifficulty?: DifficultyStat[]
  byMaterial?: MaterialStat[]
  strengths?: string[]
  weaknesses?: string[]
  recommendations?: string[]
}

export default function StudentProfile() {
  const router = useRouter()
  const { user, token, isLoading, updateUser } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [materialProgress, setMaterialProgress] = useState<MaterialProgress[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [report, setReport] = useState<ReportData | null>(null)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function fetchStats() {
      if (!token) return

      try {
        // Parallel fetch: stats + report — setengah latency
        const [res, reportRes] = await Promise.all([
          fetch('/api/student/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/student/report', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const data = await res.json()
        if (data.stats) {
          setStats(data.stats)
          setMaterialProgress(data.materialProgress || [])
        }

        if (reportRes.ok) {
          const reportData = await reportRes.json()
          setReport(reportData)
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

  const handleEditProfile = async () => {
    if (!editing) {
      setEditName(user?.name || '')
      setEditing(true)
      return
    }

    if (!editName.trim()) return
    setSaving(true)

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName }),
      })
      const data = await res.json()
      if (data.success && updateUser) {
        updateUser({ ...user!, name: editName })
      }
      setEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !user) {
    return <LoadingScreen />
  }

  return (
    <main className="relative min-h-[100dvh] bg-uni-bg overflow-hidden flex flex-col pb-24">
      <StarryBackground density="high" />
      <TowerBackground variant="flat" />
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-30 flex justify-between items-center">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-uni-primary to-uni-accent flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.3)]">
            <span className="text-white font-bold text-lg leading-none">U</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide hidden sm:block">Unimath</span>
        </div>

        {/* Right: Static Info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
             <div className="text-white font-semibold text-sm">{user.name}</div>
             <div className="text-uni-primary text-xs">Siswa Aktif</div>
          </div>
          <div className="w-10 h-10 rounded-full border border-uni-primary bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.2)] overflow-hidden">
             <span className="text-xl">🤖</span>
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full max-w-2xl mx-auto px-4 pt-28 pb-8 flex-grow flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/student/dashboard" className="w-10 h-10 flex items-center justify-center rounded-xl border border-uni-primary/30 bg-uni-bg-secondary text-white hover:bg-uni-primary/20 transition-colors shadow-[0_0_10px_rgba(0,229,255,0.1)]">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
             </svg>
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Profil Anda
            </h1>
            <div className="mt-2 flex items-center justify-center gap-2">
               <div className="h-px w-12 bg-uni-primary/50" />
               <div className="w-2 h-2 rotate-45 bg-uni-primary shadow-[0_0_5px_var(--primary-glow)]" />
               <div className="h-px w-12 bg-uni-primary/50" />
            </div>
          </div>
          <div className="w-10 h-10"></div> {/* Spacer */}
        </div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-6 sm:p-8 mb-6 sm:mb-8 glass-strong border-uni-primary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-uni-primary/10 rounded-bl-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 text-center sm:text-left">
              <div className="w-24 h-24 bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-full flex items-center justify-center border-2 border-uni-primary shadow-[0_0_15px_rgba(0,229,255,0.4)] flex-shrink-0 relative">
                <span className="text-4xl">🤖</span>
                <div className="absolute -bottom-2 bg-uni-accent text-white text-xs font-bold px-2 py-0.5 rounded-full border border-uni-bg shadow-[0_0_5px_rgba(0,119,255,0.5)]">LVL {stats?.totalFloors || 1}</div>
              </div>
              
              <div className="flex-1 min-w-0">
                {editing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-xl sm:text-2xl font-bold text-white bg-white/5 border border-uni-primary/30 px-3 py-1 rounded-lg w-full focus:outline-none focus:border-uni-primary mb-2 shadow-[inset_0_0_10px_rgba(0,229,255,0.1)] text-center sm:text-left"
                    autoFocus
                  />
                ) : (
                  <h2 className="text-xl sm:text-2xl font-bold text-white truncate mb-1">{user.name}</h2>
                )}
                <div className="inline-block px-3 py-1 bg-uni-primary/10 border border-uni-primary/20 rounded-full mb-1">
                  <p className="text-uni-primary text-sm font-medium tracking-wide">NISN: {user.nisn}</p>
                </div>
              </div>

              {/* Edit Actions */}
              <div className="flex gap-2 flex-shrink-0">
                {editing ? (
                  <>
                    <button
                      onClick={handleEditProfile}
                      disabled={saving || !editName.trim()}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-uni-success/20 border border-uni-success/50 text-uni-success hover:bg-uni-success hover:text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] disabled:opacity-50"
                      title="Simpan"
                    >
                      {saving ? '...' : '✓'}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-uni-error/10 border border-uni-error/30 text-uni-error hover:bg-uni-error hover:text-white transition-all"
                      title="Batal"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditProfile}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-uni-primary/10 border border-uni-primary/30 text-uni-primary hover:bg-uni-primary hover:text-white transition-all shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                    title="Edit Profil"
                  >
                    ✏️
                  </button>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="flex items-center gap-2 mb-4">
               <svg className="w-5 h-5 text-uni-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H4a2 2 0 00-2 2v6a2 2 0 002 2h3a2 2 0 002-2zm0 0V9a2 2 0 012-2h3a2 2 0 012 2v10m-6 0a2 2 0 002 2h3a2 2 0 002-2m0 0V5a2 2 0 012-2h3a2 2 0 012 2v14a2 2 0 01-2 2h-3a2 2 0 01-2-2z" />
               </svg>
               <h3 className="font-semibold text-white">Statistik</h3>
            </div>

            {loadingStats ? (
              <div className="text-center text-text-secondary py-6 sm:py-8 text-sm">Memuat statistik...</div>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-uni-bg-secondary/40 border border-uni-primary/20 rounded-xl p-4 text-center hover:bg-uni-primary/5 transition-colors">
                  <div className="text-2xl sm:text-3xl font-bold text-uni-primary mb-1 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">{stats.totalFloors}</div>
                  <div className="text-xs sm:text-xs text-text-secondary uppercase tracking-wider">Lantai Tercapai</div>
                </div>
                <div className="bg-uni-bg-secondary/40 border border-uni-accent/20 rounded-xl p-4 text-center hover:bg-uni-accent/5 transition-colors">
                  <div className="text-2xl sm:text-3xl font-bold text-uni-accent mb-1 drop-shadow-[0_0_8px_rgba(0,119,255,0.5)]">{stats.accuracy}%</div>
                  <div className="text-xs sm:text-xs text-text-secondary uppercase tracking-wider">Akurasi</div>
                </div>
                <div className="bg-uni-bg-secondary/40 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stats.totalSessions}</div>
                  <div className="text-xs sm:text-xs text-text-secondary uppercase tracking-wider">Sesi Latihan</div>
                </div>
                <div className="bg-uni-bg-secondary/40 border border-uni-success/20 rounded-xl p-4 text-center hover:bg-uni-success/5 transition-colors">
                  <div className="text-xl sm:text-2xl font-bold text-uni-success mb-1 drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]">
                    {stats.correctAttempts}/{stats.totalAttempts}
                  </div>
                  <div className="text-xs sm:text-xs text-text-secondary uppercase tracking-wider">Jawaban Benar</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-text-secondary py-6 sm:py-8 text-sm">
                Belum ada data latihan. Mulai latihan untuk melihat progress!
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Progress per Material */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard className="p-6 sm:p-8 glass-strong border-white/5">
            <div className="flex items-center gap-2 mb-2">
               <span className="text-xl">📚</span>
               <h3 className="text-base sm:text-lg font-bold text-white">Progress per Materi</h3>
            </div>
            <p className="text-xs text-text-secondary/70 mb-6 border-b border-white/5 pb-4">
              Akurasi soal dijawab benar dari total latihan per materi
            </p>
            
            {loadingStats ? (
              <div className="text-center text-text-secondary py-4 text-sm">Memuat...</div>
            ) : materialProgress.length > 0 ? (
              <div className="space-y-5">
                {materialProgress.map((material) => (
                  <div key={material.id} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-white group-hover:text-uni-primary transition-colors truncate mr-2">{material.name}</span>
                      <span className="text-xs font-bold text-uni-primary flex-shrink-0 bg-uni-primary/10 px-2 py-0.5 rounded shadow-[0_0_5px_rgba(0,229,255,0.2)]">{material.progress}%</span>
                    </div>
                    <ProgressBar value={material.progress} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center bg-black/20 rounded-xl p-6 border border-white/5">
                 <div className="text-3xl mb-2">📝</div>
                 <p className="text-text-secondary text-sm">Belum ada progress materi.</p>
                 <p className="text-text-secondary text-xs mt-1">Mulai latihan untuk melihat progress!</p>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* ── Performance Analysis Report ────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <GlassCard className="p-6 sm:p-8 glass-strong border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📊</span>
              <h3 className="text-base sm:text-lg font-bold text-white">Analisis Performa</h3>
            </div>
            <p className="text-xs text-text-secondary/70 mb-6 border-b border-white/5 pb-4">
              Keunggulan dan kelemahan berdasarkan riwayat latihan
            </p>

            {!report ? (
              <div className="text-center text-text-secondary py-4 text-sm">Memuat analisis...</div>
            ) : !report.ready ? (
              /* Not enough data yet */
              <div className="text-center py-6">
                <div className="text-4xl mb-3">🔒</div>
                <p className="text-white font-semibold mb-2">Analisis Belum Tersedia</p>
                <p className="text-text-secondary text-sm mb-4">
                  Selesaikan minimal <span className="text-cyan-300 font-bold">{report.minFloors || 15} lantai</span> untuk membuka analisis performa.
                </p>
                <div className="max-w-xs mx-auto">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-text-secondary">Progress</span>
                    <span className="text-cyan-300 font-semibold">{report.totalFloors} / {report.minFloors || 15}</span>
                  </div>
                  <ProgressBar value={Math.round((report.totalFloors / (report.minFloors || 15)) * 100)} size="sm" />
                  <p className="text-text-muted text-xs mt-2">{report.floorsNeeded} lantai lagi!</p>
                </div>
              </div>
            ) : (
              /* Full report */
              <div className="space-y-6">
                {/* Overall accuracy badge */}
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20">
                  <div className="text-3xl font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">{report.overallAccuracy}%</div>
                  <div className="text-xs text-text-secondary uppercase tracking-wider mt-1">Akurasi Keseluruhan</div>
                </div>

                {/* Strengths */}
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-400/20">
                  <h4 className="text-emerald-300 font-semibold text-sm flex items-center gap-2 mb-3">
                    <span>💪</span> Keunggulan
                  </h4>
                  <ul className="space-y-1.5">
                    {report.strengths?.map((s, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5 text-xs">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-400/20">
                  <h4 className="text-orange-300 font-semibold text-sm flex items-center gap-2 mb-3">
                    <span>⚠️</span> Perlu Diperkuat
                  </h4>
                  <ul className="space-y-1.5">
                    {report.weaknesses?.map((w, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5 text-xs">●</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* By Indicator */}
                {report.byIndicator && report.byIndicator.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                      <span>🎯</span> Akurasi per Indikator
                    </h4>
                    <div className="space-y-3">
                      {report.byIndicator.map((ind) => (
                        <div key={ind.indicator}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">{ind.label} ({ind.indicator})</span>
                            <span className={`font-bold ${ind.accuracy >= 75 ? 'text-emerald-300' : ind.accuracy < 50 ? 'text-orange-300' : 'text-cyan-300'}`}>{ind.accuracy}%</span>
                          </div>
                          <ProgressBar value={ind.accuracy} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* By Difficulty */}
                {report.byDifficulty && report.byDifficulty.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                      <span>⚡</span> Akurasi per Tingkat Kesulitan
                    </h4>
                    <div className="space-y-3">
                      {report.byDifficulty.map((d) => (
                        <div key={d.difficulty}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">{d.label}</span>
                            <span className={`font-bold ${d.accuracy >= 75 ? 'text-emerald-300' : d.accuracy < 50 ? 'text-orange-300' : 'text-cyan-300'}`}>{d.accuracy}%</span>
                          </div>
                          <ProgressBar value={d.accuracy} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-400/20">
                  <h4 className="text-cyan-300 font-semibold text-sm flex items-center gap-2 mb-3">
                    <span>💡</span> Rekomendasi
                  </h4>
                  <ul className="space-y-1.5">
                    {report.recommendations?.map((r, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-cyan-400 mt-0.5 text-xs">→</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </main>
  )
}
