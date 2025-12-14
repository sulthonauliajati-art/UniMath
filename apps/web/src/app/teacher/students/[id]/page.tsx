'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/lib/auth/context'

interface StudentData {
  id: string
  name: string
  nisn: string
  passwordStatus: string
  stats: {
    totalFloors: number
    totalSessions: number
    accuracy: number
  }
  materialProgress: Array<{
    materialId: string
    materialName: string
    progress: number
  }>
}

export default function StudentDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [student, setStudent] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'TEACHER')) {
      router.push('/teacher/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function fetchStudent() {
      if (!token || !id) return
      try {
        const res = await fetch(`/api/teacher/students/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.student) {
          setStudent(data.student)
        }
      } catch (error) {
        console.error('Failed to fetch student:', error)
      } finally {
        setLoading(false)
      }
    }
    if (user && token) {
      fetchStudent()
    }
  }, [user, token, id])

  const handleResetPassword = async () => {
    if (!token || !id) return
    if (!confirm('Yakin ingin reset password siswa ini? Siswa harus membuat password baru saat login.')) {
      return
    }
    
    setResetting(true)
    setMessage('')
    try {
      const res = await fetch(`/api/teacher/students/${id}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setMessage('Password berhasil direset. Siswa harus membuat password baru saat login.')
        if (student) {
          setStudent({ ...student, passwordStatus: 'UNSET' })
        }
      } else {
        setMessage(data.error?.message || 'Gagal reset password')
      }
    } catch (error) {
      console.error('Failed to reset password:', error)
      setMessage('Terjadi kesalahan')
    } finally {
      setResetting(false)
    }
  }

  if (isLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-uni-bg">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-uni-bg">
        <div className="text-white">Siswa tidak ditemukan</div>
      </div>
    )
  }

  const stats = student.stats
  const materialProgress = student.materialProgress || []

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
            ← Kembali
          </button>
          <h1 className="text-2xl font-bold text-white">Detail Siswa</h1>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-uni-primary to-uni-accent rounded-full flex items-center justify-center">
                <span className="text-3xl">👤</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{student.name}</h2>
                  {student.passwordStatus === 'UNSET' && (
                    <span className="text-xs bg-uni-warning/20 text-uni-warning px-2 py-0.5 rounded">
                      Belum aktif
                    </span>
                  )}
                </div>
                <p className="text-text-secondary">NISN: {student.nisn}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-uni-bg-secondary/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-uni-primary">{stats.totalFloors}</div>
                <div className="text-xs text-text-secondary">Lantai</div>
              </div>
              <div className="bg-uni-bg-secondary/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-uni-accent">{stats.accuracy}%</div>
                <div className="text-xs text-text-secondary">Akurasi</div>
              </div>
              <div className="bg-uni-bg-secondary/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.totalSessions}</div>
                <div className="text-xs text-text-secondary">Sesi</div>
              </div>
            </div>

            {/* Reset Password */}
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Password</p>
                  <p className="text-white">
                    {student.passwordStatus === 'UNSET' ? 'Belum diatur' : 'Sudah diatur'}
                  </p>
                </div>
                <NeonButton
                  variant="secondary"
                  size="sm"
                  onClick={handleResetPassword}
                  disabled={resetting || student.passwordStatus === 'UNSET'}
                >
                  {resetting ? 'Mereset...' : 'Reset Password'}
                </NeonButton>
              </div>
              {message && (
                <p className={`text-sm mt-2 ${message.includes('berhasil') ? 'text-uni-success' : 'text-uni-error'}`}>
                  {message}
                </p>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Progress per Material */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Progress per Materi</h3>
            {materialProgress.length === 0 ? (
              <p className="text-text-secondary text-center py-4">Belum ada progress latihan</p>
            ) : (
              <div className="space-y-4">
                {materialProgress.map((material, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-text-secondary">{material.materialName}</span>
                      <span className="text-sm text-uni-primary">{material.progress}%</span>
                    </div>
                    <ProgressBar value={material.progress} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </main>
  )
}
