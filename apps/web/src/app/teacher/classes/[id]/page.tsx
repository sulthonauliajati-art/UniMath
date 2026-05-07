'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground, TowerBackground, GlassCard, NeonButton } from '@/components/ui'
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
    <main className="relative min-h-[100dvh] bg-uni-bg overflow-hidden flex flex-col pb-24">
      <StarryBackground density="high" />
      <TowerBackground variant="flat" />
      
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
      
      <div className="relative z-20 w-full max-w-4xl mx-auto px-4 pt-8 pb-8 flex-grow flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/teacher/classes" className="w-10 h-10 flex items-center justify-center rounded-xl border border-uni-primary/30 bg-uni-bg-secondary text-white hover:bg-uni-primary/20 transition-colors shadow-[0_0_10px_rgba(0,229,255,0.1)]">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
             </svg>
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Rincian Kelas
            </h1>
            <div className="mt-2 flex items-center justify-center gap-2">
               <div className="h-px w-12 bg-uni-primary/50" />
               <div className="w-2 h-2 rotate-45 bg-uni-primary shadow-[0_0_5px_var(--primary-glow)]" />
               <div className="h-px w-12 bg-uni-primary/50" />
            </div>
          </div>
          <div className="w-10 h-10"></div> {/* Spacer for centering */}
        </div>

        {/* Top Summary Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
           {/* Left: Class Info Card */}
           <GlassCard className="p-6 flex flex-col items-center justify-center glass-strong border-uni-primary/40 relative overflow-hidden">
              <div className="absolute top-4 left-0 w-full text-center z-10">
                 <h2 className="text-2xl font-bold text-white tracking-tight">{loading ? 'Loading...' : classData?.name}</h2>
              </div>
              <div className="w-32 h-40 mt-8 mb-4 relative z-0 flex items-center justify-center">
                 <svg viewBox="0 0 100 140" fill="none" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,119,255,0.6)]">
                    <path d="M50 10 L80 25 L80 115 L50 130 L20 115 L20 25 Z" fill="#0A1128" stroke="#00E5FF" strokeWidth="2" />
                    <path d="M20 25 L50 40 L80 25" stroke="#00E5FF" strokeWidth="2" />
                    <path d="M50 10 L50 40" stroke="#00E5FF" strokeWidth="2" />
                    <path d="M25 45 L50 55 L75 45" stroke="#00E5FF" strokeWidth="2.5" className="drop-shadow-[0_0_5px_#00E5FF]" />
                    <path d="M25 65 L50 75 L75 65" stroke="#00E5FF" strokeWidth="2.5" className="drop-shadow-[0_0_5px_#00E5FF]" />
                    <path d="M25 85 L50 95 L75 85" stroke="#00E5FF" strokeWidth="2.5" className="drop-shadow-[0_0_5px_#00E5FF]" />
                    <path d="M25 105 L50 115 L75 105" stroke="#00E5FF" strokeWidth="2.5" className="drop-shadow-[0_0_5px_#00E5FF]" />
                 </svg>
              </div>
              <div className="flex items-center justify-center gap-2 text-text-secondary z-10">
                 <span className="text-uni-primary">👥</span>
                 <span className="font-medium text-white">{students.length} Siswa</span>
              </div>
           </GlassCard>

           {/* Right: Summary Stats */}
           <GlassCard className="p-6 glass-strong flex flex-col justify-between h-full">
              <div className="flex items-center gap-2 mb-6">
                 <svg className="w-5 h-5 text-uni-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                 </svg>
                 <h3 className="font-semibold text-white">Ringkasan Kelas</h3>
              </div>

              <div className="space-y-4 flex-grow flex flex-col justify-center">
                 <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-uni-primary/20 flex items-center justify-center text-uni-primary shadow-[0_0_10px_rgba(0,229,255,0.2)]">★</div>
                       <span className="text-text-secondary text-sm">Rata-rata Nilai</span>
                    </div>
                    <span className="text-uni-primary font-bold text-lg">
                       {students.length > 0 ? Math.round(students.reduce((acc, curr) => acc + curr.stats.accuracy, 0) / students.length) : 0}%
                    </span>
                 </div>
                 
                 <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-uni-accent/20 flex items-center justify-center text-uni-accent shadow-[0_0_10px_rgba(0,119,255,0.2)]">👥</div>
                       <span className="text-text-secondary text-sm">Murid Aktif</span>
                    </div>
                    <span className="text-uni-accent font-bold text-lg">{students.length}</span>
                 </div>

                 <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-uni-warning/20 flex items-center justify-center text-uni-warning shadow-[0_0_10px_rgba(245,158,11,0.2)]">⚠️</div>
                       <span className="text-text-secondary text-sm">Butuh Bimbingan</span>
                    </div>
                    <span className="text-uni-warning font-bold text-lg">
                       {students.filter(s => s.stats.accuracy < 50).length}
                    </span>
                 </div>

                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-uni-success/20 flex items-center justify-center text-uni-success shadow-[0_0_10px_rgba(16,185,129,0.2)]">🏆</div>
                       <span className="text-text-secondary text-sm">Top Student</span>
                    </div>
                    <span className="text-uni-success font-bold text-lg">
                       {students.length > 0 ? [...students].sort((a,b) => b.stats.accuracy - a.stats.accuracy)[0].name.split(' ')[0] : '-'}
                    </span>
                 </div>
              </div>
           </GlassCard>
        </div>

        {/* List Students Header */}
        <div className="flex items-center justify-between mb-4 mt-4">
           <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-uni-primary rounded-full shadow-[0_0_10px_rgba(0,229,255,0.5)]"></div>
              <h3 className="text-lg font-bold text-white">Daftar Siswa</h3>
           </div>
           <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-uni-primary/20 text-uni-primary border border-uni-primary/50 hover:bg-uni-primary/40 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <span>+</span> Tambah Siswa
           </button>
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
                <GlassCard hover className="p-4 cursor-pointer glass-strong border-white/5" onClick={() => router.push(`/teacher/students/${student.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-uni-primary/30 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.1)] flex-shrink-0 relative overflow-hidden">
                      <span className="text-xl">🤖</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-base md:text-lg mb-1 truncate">{student.name}</h3>
                      <div className="flex items-center gap-2">
                         <span className="text-xs text-uni-primary">Siswa Aktif</span>
                      </div>
                    </div>
                    
                    <div className="hidden sm:block flex-shrink-0 w-32 md:w-48 text-right pr-4">
                      <div className="flex justify-end items-center gap-2 mb-1">
                         <span className="text-lg font-bold text-uni-primary">{student.stats.accuracy}%</span>
                      </div>
                      <ProgressBar value={student.stats.accuracy} size="sm" />
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setRemoveModal({ show: true, studentId: student.id, studentName: student.name })
                        }}
                        disabled={deletingId === student.id}
                        className="p-2 text-text-muted hover:text-uni-error hover:bg-uni-error/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Keluarkan dari kelas"
                      >
                        {deletingId === student.id ? '...' : (
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        )}
                      </button>
                      <div className="w-8 h-8 flex items-center justify-center text-text-secondary group-hover:text-white group-hover:translate-x-1 transition-all">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                         </svg>
                      </div>
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
