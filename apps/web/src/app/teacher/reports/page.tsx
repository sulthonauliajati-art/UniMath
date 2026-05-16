'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface Summary {
  totalFloors: number
  avgAccuracy: number
  totalSessions: number
}

interface TopStudent {
  id: string
  name: string
  floors: number
  accuracy: number
}

interface StudentReport {
  ready: boolean
  studentName: string
  totalFloors: number
  floorsNeeded?: number
  minFloors?: number
  overallAccuracy?: number
  strengths?: string[]
  weaknesses?: string[]
  recommendations?: string[]
  byIndicator?: { indicator: string; label: string; accuracy: number }[]
  byDifficulty?: { difficulty: number; label: string; accuracy: number }[]
}

export default function TeacherReportsPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [topStudents, setTopStudents] = useState<TopStudent[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null)
  const [studentReports, setStudentReports] = useState<Record<string, StudentReport>>({})
  const [loadingReport, setLoadingReport] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'TEACHER')) {
      router.push('/teacher/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function fetchReports() {
      if (!token) return
      try {
        const res = await fetch('/api/teacher/reports', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()

        if (data.summary) {
          setSummary(data.summary)
          setTopStudents(data.topStudents || [])
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error)
      } finally {
        setLoadingData(false)
      }
    }

    if (user && token) {
      fetchReports()
    }
  }, [user, token])

  const handleToggleStudent = async (studentId: string) => {
    if (expandedStudentId === studentId) {
      setExpandedStudentId(null)
      return
    }
    setExpandedStudentId(studentId)

    // Fetch report if not cached
    if (!studentReports[studentId] && token) {
      setLoadingReport(studentId)
      try {
        const res = await fetch(`/api/teacher/student-report?studentId=${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setStudentReports(prev => ({ ...prev, [studentId]: data }))
        }
      } catch (error) {
        console.error('Failed to fetch student report:', error)
      } finally {
        setLoadingReport(null)
      }
    }
  }

  // P0 Fix: Export CSV using fetch + blob instead of window.open
  const handleExportCSV = async () => {
    if (!token) return
    setExporting(true)
    setExportError('')
    
    try {
      const res = await fetch('/api/teacher/export?format=csv', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message || 'Gagal mengunduh laporan')
      }
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laporan_siswa_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
      setExportError(error instanceof Error ? error.message : 'Gagal mengunduh laporan')
    } finally {
      setExporting(false)
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
            <h1 className="text-2xl font-bold text-white">Rekap & Laporan</h1>
          </div>
          <div className="flex items-center gap-3">
            {exportError && (
              <span className="text-uni-error text-sm">{exportError}</span>
            )}
            <NeonButton
              variant="secondary"
              onClick={handleExportCSV}
              disabled={exporting}
            >
              {exporting ? '⏳ Mengunduh...' : '📥 Export CSV'}
            </NeonButton>
          </div>
        </div>

        {loadingData ? (
          <LoadingScreen fullScreen={false} />
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <GlassCard className="p-4 text-center">
                <div className="text-2xl font-bold text-uni-primary">{summary?.totalFloors || 0}</div>
                <div className="text-xs text-text-secondary">Total Lantai</div>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <div className="text-2xl font-bold text-uni-accent">{summary?.avgAccuracy || 0}%</div>
                <div className="text-xs text-text-secondary">Rata-rata Akurasi</div>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{summary?.totalSessions || 0}</div>
                <div className="text-xs text-text-secondary">Sesi Latihan</div>
              </GlassCard>
            </div>

            {/* Top Students with expandable detail */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-1">🏆 Daftar Siswa</h3>
                <p className="text-xs text-text-secondary mb-4">Klik nama siswa untuk melihat analisis performa</p>
                {topStudents.length === 0 ? (
                  <div className="text-center text-text-secondary py-8">
                    <p>Belum ada data siswa</p>
                    <p className="text-sm text-text-muted mt-2">
                      Tambahkan siswa ke kelas untuk melihat laporan
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topStudents.map((student, index) => {
                      const isExpanded = expandedStudentId === student.id
                      const report = studentReports[student.id]
                      const isLoadingThis = loadingReport === student.id

                      return (
                        <div key={student.id}>
                          <button
                            onClick={() => handleToggleStudent(student.id)}
                            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left ${
                              isExpanded
                                ? 'bg-cyan-500/10 border border-cyan-400/30'
                                : 'hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            <div className="w-8 h-8 bg-uni-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-uni-primary flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between mb-1">
                                <span className="text-white font-medium truncate">{student.name}</span>
                                <span className="text-text-secondary text-sm flex-shrink-0 ml-2">{student.floors} lantai</span>
                              </div>
                              <ProgressBar value={student.accuracy} size="sm" />
                            </div>
                            <motion.svg
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              className="w-4 h-4 text-slate-400 flex-shrink-0"
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </motion.svg>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="ml-12 mr-4 mb-3 mt-1 p-4 rounded-xl bg-black/20 border border-white/5">
                                  {isLoadingThis ? (
                                    <div className="text-center text-text-secondary text-sm py-3">Memuat analisis...</div>
                                  ) : !report ? (
                                    <div className="text-center text-text-secondary text-sm py-3">Gagal memuat data</div>
                                  ) : !report.ready ? (
                                    <div className="text-center py-3">
                                      <p className="text-text-secondary text-sm">
                                        Belum cukup data — {report.floorsNeeded} lantai lagi untuk membuka analisis.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      {/* Overall */}
                                      <div className="text-center">
                                        <span className="text-2xl font-bold text-cyan-300">{report.overallAccuracy}%</span>
                                        <span className="text-xs text-text-secondary ml-2">akurasi keseluruhan</span>
                                      </div>

                                      {/* Strengths & Weaknesses side by side */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-400/20">
                                          <h5 className="text-emerald-300 font-semibold text-xs mb-2">💪 Keunggulan</h5>
                                          <ul className="space-y-1">
                                            {report.strengths?.map((s, i) => (
                                              <li key={i} className="text-xs text-slate-300">✓ {s}</li>
                                            ))}
                                          </ul>
                                        </div>
                                        <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-400/20">
                                          <h5 className="text-orange-300 font-semibold text-xs mb-2">⚠️ Kelemahan</h5>
                                          <ul className="space-y-1">
                                            {report.weaknesses?.map((w, i) => (
                                              <li key={i} className="text-xs text-slate-300">● {w}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>

                                      {/* Recommendations */}
                                      <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-400/20">
                                        <h5 className="text-cyan-300 font-semibold text-xs mb-2">💡 Rekomendasi</h5>
                                        <ul className="space-y-1">
                                          {report.recommendations?.map((r, i) => (
                                            <li key={i} className="text-xs text-slate-300">→ {r}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </>
        )}
      </div>
    </main>
  )
}
