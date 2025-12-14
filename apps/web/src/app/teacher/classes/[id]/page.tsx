'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { Input } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ConfirmModal } from '@/components/ui/Modal'
import { useAuth } from '@/lib/auth/context'
import { useToast } from '@/components/ui/Toast'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Class } from '@/lib/types'

interface StudentWithStats {
  id: string
  name: string
  nisn: string
  passwordStatus: string
  stats: { totalFloors: number; totalSessions: number; accuracy: number }
}

interface FoundStudent {
  id: string
  name: string
  nisn: string
}

export default function ClassDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { showToast } = useToast()
  const [classData, setClassData] = useState<Class | null>(null)
  const [students, setStudents] = useState<StudentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newStudentNisn, setNewStudentNisn] = useState('')
  const [newStudentName, setNewStudentName] = useState('')
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundStudent, setFoundStudent] = useState<FoundStudent | null>(null)
  const [nisnChecked, setNisnChecked] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // P1 Fix: Modal state for remove student confirmation
  const [removeModal, setRemoveModal] = useState<{ show: boolean; studentId: string; studentName: string }>({
    show: false,
    studentId: '',
    studentName: '',
  })

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'TEACHER')) {
      router.push('/teacher/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function fetchClassDetail() {
      try {
        const res = await fetch(`/api/teacher/classes/${id}`)
        const data = await res.json()
        setClassData(data.class)
        setStudents(data.students || [])
      } catch (error) {
        console.error('Failed to fetch class:', error)
      } finally {
        setLoading(false)
      }
    }
    if (user && id) {
      fetchClassDetail()
    }
  }, [user, id])

  const handleSearchNisn = async () => {
    if (!newStudentNisn.trim()) return
    setSearching(true)
    setError('')
    setFoundStudent(null)
    try {
      const res = await fetch(`/api/auth/student/check-nisn?nisn=${newStudentNisn}`)
      const data = await res.json()
      if (data.exists && data.student) {
        setFoundStudent(data.student)
        setNewStudentName(data.student.name)
      }
      setNisnChecked(true)
    } catch (error) {
      console.error('Failed to search NISN:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Kalau belum cek NISN, cek dulu
    if (!nisnChecked) {
      await handleSearchNisn()
      return
    }
    
    try {
      const res = await fetch(`/api/teacher/classes/${id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nisn: newStudentNisn, 
          name: foundStudent ? foundStudent.name : newStudentName,
          existingStudentId: foundStudent?.id 
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error.message)
        return
      }
      if (data.student) {
        setStudents([...students, { 
          ...data.student, 
          stats: { totalFloors: 0, totalSessions: 0, accuracy: 0 } 
        }])
        resetForm()
        showToast('Siswa berhasil ditambahkan!', 'success')
      }
    } catch (error) {
      console.error('Failed to add student:', error)
      setError('Gagal menambahkan siswa')
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setNewStudentNisn('')
    setNewStudentName('')
    setFoundStudent(null)
    setNisnChecked(false)
    setError('')
  }

  // P1 Fix: Use modal instead of browser confirm
  const handleRemoveStudent = async () => {
    const { studentId } = removeModal
    if (!studentId) return
    
    setDeletingId(studentId)
    try {
      const res = await fetch(`/api/teacher/classes/${id}/students`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      })
      const data = await res.json()
      if (data.success) {
        setStudents(students.filter(s => s.id !== studentId))
        showToast('Siswa berhasil dikeluarkan dari kelas', 'success')
      } else {
        showToast('Gagal mengeluarkan siswa', 'error')
      }
    } catch (error) {
      console.error('Failed to remove student:', error)
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setDeletingId(null)
      setRemoveModal({ show: false, studentId: '', studentName: '' })
    }
  }

  if (isLoading || !user) {
    return <LoadingScreen />
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />
      
      {/* P1 Fix: Modal confirmation for removing student */}
      <ConfirmModal
        isOpen={removeModal.show}
        onClose={() => setRemoveModal({ show: false, studentId: '', studentName: '' })}
        onConfirm={handleRemoveStudent}
        title="Keluarkan Siswa dari Kelas"
        message={`Yakin ingin mengeluarkan ${removeModal.studentName} dari kelas ini? Data progress siswa tidak akan dihapus.`}
        confirmText="Keluarkan"
        cancelText="Batal"
        variant="warning"
        loading={deletingId === removeModal.studentId}
      />
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/teacher/classes" className="text-text-secondary hover:text-white">
              ← Kembali
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {loading ? 'Loading...' : classData?.name}
              </h1>
              {classData && (
                <p className="text-text-secondary">Tingkat {classData.grade}</p>
              )}
            </div>
          </div>
          <NeonButton onClick={() => setShowForm(true)}>
            + Tambah Siswa
          </NeonButton>
        </div>

        {/* Add Student Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Tambah Siswa</h3>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      label="NISN"
                      placeholder="Masukkan NISN siswa"
                      value={newStudentNisn}
                      onChange={(e) => {
                        setNewStudentNisn(e.target.value)
                        setNisnChecked(false)
                        setFoundStudent(null)
                        setNewStudentName('')
                      }}
                      required
                    />
                  </div>
                  <NeonButton 
                    type="button" 
                    variant="secondary" 
                    onClick={handleSearchNisn}
                    disabled={searching || !newStudentNisn.trim()}
                  >
                    {searching ? 'Mencari...' : 'Cari'}
                  </NeonButton>
                </div>

                {/* Hasil pencarian */}
                {nisnChecked && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {foundStudent ? (
                      <div className="p-4 bg-uni-success/10 border border-uni-success/30 rounded-lg">
                        <p className="text-uni-success text-sm mb-1">✓ Siswa ditemukan!</p>
                        <p className="text-white font-medium">{foundStudent.name}</p>
                        <p className="text-text-secondary text-sm">NISN: {foundStudent.nisn}</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-uni-warning/10 border border-uni-warning/30 rounded-lg">
                        <p className="text-uni-warning text-sm mb-2">Siswa belum terdaftar. Masukkan nama untuk mendaftarkan:</p>
                        <Input
                          label="Nama Lengkap"
                          placeholder="Masukkan nama siswa"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </motion.div>
                )}

                {error && (
                  <p className="text-uni-error text-sm">{error}</p>
                )}

                <div className="flex gap-2">
                  <NeonButton 
                    type="submit" 
                    variant="primary"
                    disabled={!nisnChecked || (!foundStudent && !newStudentName.trim())}
                  >
                    {foundStudent ? 'Tambahkan ke Kelas' : 'Daftarkan & Tambahkan'}
                  </NeonButton>
                  <NeonButton type="button" variant="ghost" onClick={resetForm}>
                    Batal
                  </NeonButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* Students List */}
        {loading ? (
          <div className="text-center text-text-secondary py-8">Loading...</div>
        ) : students.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-text-secondary mb-4">Belum ada siswa di kelas ini</p>
            <NeonButton onClick={() => setShowForm(true)}>
              Tambah Siswa Pertama
            </NeonButton>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {students.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* P0 Fix: Single click navigation with clear CTA */}
                <GlassCard hover className="p-4 cursor-pointer" onClick={() => router.push(`/teacher/students/${student.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-uni-primary/20 rounded-full flex items-center justify-center">
                      <span>👤</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white">{student.name}</h3>
                        {student.passwordStatus === 'UNSET' && (
                          <span className="text-xs bg-uni-warning/20 text-uni-warning px-2 py-0.5 rounded">
                            Belum aktif
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary">NISN: {student.nisn}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-sm text-text-secondary mb-1">Progress</div>
                      <div className="w-24">
                        <ProgressBar value={student.stats.accuracy} size="sm" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-uni-primary">
                        {student.stats.totalFloors}
                      </div>
                      <div className="text-xs text-text-secondary">Lantai</div>
                    </div>
                    {/* P1 Fix: Clear action buttons with labels */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/teacher/students/${student.id}`)
                        }}
                        className="px-3 py-1.5 text-xs bg-uni-primary/20 text-uni-primary hover:bg-uni-primary/30 rounded-lg transition-colors"
                      >
                        Detail
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setRemoveModal({ show: true, studentId: student.id, studentName: student.name })
                        }}
                        disabled={deletingId === student.id}
                        className="px-3 py-1.5 text-xs bg-uni-error/10 text-uni-error hover:bg-uni-error/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Keluarkan dari kelas"
                      >
                        {deletingId === student.id ? '...' : 'Keluarkan'}
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
