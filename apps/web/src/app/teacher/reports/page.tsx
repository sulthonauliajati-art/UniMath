'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/lib/auth/context'

interface Summary {
  totalFloors: number
  avgAccuracy: number
  totalSessions: number
}

interface TopStudent {
  name: string
  floors: number
  accuracy: number
}

export default function TeacherReportsPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [topStudents, setTopStudents] = useState<TopStudent[]>([])
  const [loadingData, setLoadingData] = useState(true)

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/teacher/dashboard" className="text-text-secondary hover:text-white">
              ← Kembali
            </Link>
            <h1 className="text-2xl font-bold text-white">Rekap & Laporan</h1>
          </div>
          <NeonButton
            variant="secondary"
            onClick={() => {
              window.open(`/api/teacher/export?format=csv`, '_blank')
            }}
          >
            📥 Export CSV
          </NeonButton>
        </div>

        {loadingData ? (
          <div className="text-center text-text-secondary py-8">Memuat data...</div>
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

            {/* Top Students */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">🏆 Top Siswa</h3>
                {topStudents.length === 0 ? (
                  <div className="text-center text-text-secondary py-8">
                    <p>Belum ada data siswa</p>
                    <p className="text-sm text-text-muted mt-2">
                      Tambahkan siswa ke kelas untuk melihat laporan
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topStudents.map((student, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-uni-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-uni-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-white font-medium">{student.name}</span>
                            <span className="text-text-secondary text-sm">{student.floors} lantai</span>
                          </div>
                          <ProgressBar value={student.accuracy} size="sm" />
                        </div>
                      </div>
                    ))}
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
