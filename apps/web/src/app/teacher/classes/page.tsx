'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth/context'
import { Class } from '@/lib/types'

interface School {
  id: string
  name: string
}

export default function TeacherClassesPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [classes, setClasses] = useState<(Class & { studentCount: number })[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassGrade, setNewClassGrade] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'TEACHER')) {
      router.push('/teacher/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function fetchData() {
      if (!token) return
      try {
        // Fetch schools dan classes bersamaan
        const [schoolsRes, classesRes] = await Promise.all([
          fetch('/api/teacher/schools', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/teacher/classes', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        
        const schoolsData = await schoolsRes.json()
        const classesData = await classesRes.json()
        
        setSchools(schoolsData.schools || [])
        setClasses(classesData.classes || [])
        
        // Set default school
        if (schoolsData.schools?.length > 0) {
          setSelectedSchoolId(schoolsData.schools[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    if (user && token) {
      fetchData()
    }
  }, [user, token])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setError('')
    
    if (!selectedSchoolId) {
      setError('Pilih sekolah terlebih dahulu')
      return
    }
    
    try {
      const res = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name: newClassName, 
          grade: newClassGrade,
          schoolId: selectedSchoolId 
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error.message)
        return
      }
      if (data.class) {
        setClasses([...classes, { ...data.class, studentCount: 0 }])
        setShowForm(false)
        setNewClassName('')
        setNewClassGrade('')
      }
    } catch (error) {
      console.error('Failed to create class:', error)
      setError('Gagal membuat kelas')
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
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/teacher/dashboard" className="text-text-secondary hover:text-white">
              ← Kembali
            </Link>
            <h1 className="text-2xl font-bold text-white">Daftar Kelas</h1>
          </div>
          <NeonButton onClick={() => setShowForm(true)}>
            + Tambah Kelas
          </NeonButton>
        </div>

        {/* Create Class Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Buat Kelas Baru</h3>
              
              {schools.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-text-secondary mb-4">Anda belum memiliki sekolah. Buat sekolah terlebih dahulu.</p>
                  <Link href="/teacher/schools">
                    <NeonButton variant="primary">Buat Sekolah</NeonButton>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleCreateClass} className="space-y-4">
                  {schools.length > 1 && (
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">Sekolah</label>
                      <select
                        value={selectedSchoolId}
                        onChange={(e) => setSelectedSchoolId(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-uni-primary"
                        required
                      >
                        {schools.map((school) => (
                          <option key={school.id} value={school.id} className="bg-uni-bg">
                            {school.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <Input
                    label="Nama Kelas"
                    placeholder="Contoh: Kelas 4A"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    required
                  />
                  <Input
                    label="Tingkat"
                    placeholder="Contoh: 4"
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value)}
                    required
                  />
                  {error && <p className="text-uni-error text-sm">{error}</p>}
                  <div className="flex gap-2">
                    <NeonButton type="submit" variant="primary">
                      Simpan
                    </NeonButton>
                    <NeonButton type="button" variant="ghost" onClick={() => setShowForm(false)}>
                      Batal
                    </NeonButton>
                  </div>
                </form>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Classes List */}
        {loading ? (
          <div className="text-center text-text-secondary py-8">Loading...</div>
        ) : classes.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-text-secondary mb-4">Belum ada kelas</p>
            <NeonButton onClick={() => setShowForm(true)}>
              Buat Kelas Pertama
            </NeonButton>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {classes.map((cls, index) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/teacher/classes/${cls.id}`}>
                  <GlassCard hover className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {cls.name}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          Tingkat {cls.grade}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-uni-primary">
                          {cls.studentCount}
                        </div>
                        <div className="text-xs text-text-secondary">Siswa</div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
