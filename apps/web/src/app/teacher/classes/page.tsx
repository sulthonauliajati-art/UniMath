'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground, TowerBackground, RobotMascot, GlassCard, NeonButton } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
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
    return <LoadingScreen />
  }

  return (
    <main className="relative min-h-[100dvh] bg-uni-bg overflow-hidden flex flex-col pb-24">
      <StarryBackground density="high" />
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-30 flex justify-between items-center">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-uni-primary to-uni-accent flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.3)]">
            <span className="text-white font-bold text-lg leading-none">U</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide hidden sm:block">Unimath</span>
        </div>

        {/* Right: Teacher Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right">
             <div className="text-white font-semibold text-sm">{user.name}</div>
             <div className="text-uni-primary text-xs">Guru</div>
          </div>
          <div className="w-10 h-10 rounded-full border border-uni-primary bg-uni-bg-secondary flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.2)] overflow-hidden">
             <span className="text-xl">🧑‍🏫</span>
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full max-w-4xl mx-auto px-4 pt-28 pb-8 flex-grow flex flex-col">
        
        {/* Page Title & Back Button */}
        <div className="flex items-center gap-4 mb-8">
           <Link href="/teacher/dashboard" className="text-uni-primary bg-uni-primary/10 p-2 rounded-lg hover:bg-uni-primary/20 transition-colors border border-uni-primary/30 shadow-[0_0_10px_rgba(0,229,255,0.1)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
           </Link>
           <h1 className="text-3xl font-bold text-white tracking-wide">Daftar Kelas Anda</h1>
           <div className="flex-1 border-b border-uni-primary/30 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-uni-primary shadow-[0_0_5px_var(--primary-glow)]"></div>
           </div>
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
          <div className="flex-grow flex items-center justify-center">
             <LoadingScreen fullScreen={false} />
          </div>
        ) : classes.length === 0 ? (
          <div className="flex-grow flex items-center justify-center">
             <GlassCard className="p-8 text-center glass-strong">
               <p className="text-text-secondary mb-4">Belum ada kelas</p>
               <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-gradient-to-r from-uni-primary to-uni-accent rounded-xl text-white font-semibold">
                 Buat Kelas Pertama
               </button>
             </GlassCard>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {classes.map((cls, index) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard 
                  hover 
                  className="p-5 cursor-pointer glass-strong relative overflow-hidden group border-uni-primary/40" 
                  onClick={() => router.push(`/teacher/classes/${cls.id}`)}
                >
                  <div className="flex flex-row items-center gap-4">
                     {/* Mini Tower Illustration */}
                     <div className="w-20 h-28 relative flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <svg viewBox="0 0 100 140" fill="none" className="w-full h-full drop-shadow-[0_0_8px_rgba(0,119,255,0.6)]">
                           <path d="M50 10 L80 25 L80 115 L50 130 L20 115 L20 25 Z" fill="#0A1128" stroke="#0077FF" strokeWidth="1.5" />
                           <path d="M20 25 L50 40 L80 25" stroke="#0077FF" strokeWidth="1.5" />
                           <path d="M50 10 L50 40" stroke="#0077FF" strokeWidth="1.5" />
                           {/* Floor lines */}
                           <path d="M25 45 L50 55 L75 45" stroke="#00E5FF" strokeWidth="2" className="drop-shadow-[0_0_3px_#00E5FF]" />
                           <path d="M25 65 L50 75 L75 65" stroke="#00E5FF" strokeWidth="2" className="drop-shadow-[0_0_3px_#00E5FF]" />
                           <path d="M25 85 L50 95 L75 85" stroke="#00E5FF" strokeWidth="2" className="drop-shadow-[0_0_3px_#00E5FF]" />
                           <path d="M25 105 L50 115 L75 105" stroke="#00E5FF" strokeWidth="2" className="drop-shadow-[0_0_3px_#00E5FF]" />
                        </svg>
                     </div>

                     <div className="flex-1 flex flex-col justify-center py-2">
                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                           {cls.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-4">
                           <span className="text-text-secondary">👥</span>
                           <span className="text-text-secondary text-sm">{cls.studentCount} Siswa</span>
                        </div>

                        {/* CTA button inside card matching design */}
                        <button
                           onClick={(e) => {
                             e.stopPropagation()
                             router.push(`/teacher/classes/${cls.id}`)
                           }}
                           className="w-full py-2 text-sm bg-transparent border border-uni-primary text-white hover:bg-uni-primary/20 hover:shadow-[0_0_10px_rgba(0,229,255,0.3)] rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                           Lihat Kelas <span className="text-uni-primary">›</span>
                        </button>
                     </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Bottom Floating Action Area */}
        <div className="fixed bottom-0 left-0 w-full p-4 flex items-end justify-center pointer-events-none z-30">
           <div className="max-w-4xl w-full mx-auto px-4 flex items-end gap-4 pointer-events-auto relative pb-4">
              {/* Robot Mascot */}
              <div className="absolute left-0 bottom-0 transform -translate-x-4 md:-translate-x-12 hidden sm:block">
                 <RobotMascot state="waving" size="md" />
              </div>

              {/* Add New Class Button */}
              <div className="w-full sm:w-auto sm:ml-auto">
                 <button 
                    onClick={() => setShowForm(true)}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-uni-primary to-uni-accent hover:from-uni-primary-dark hover:to-uni-primary rounded-xl text-white font-bold text-lg shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center gap-3 transition-transform hover:scale-105"
                 >
                    <span className="bg-white/20 rounded-md p-1 leading-none border border-white/30 text-sm">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </span>
                    Buat Kelas Baru
                    <span className="ml-2">›</span>
                 </button>
              </div>
           </div>
           
           {/* Bottom Gradient Fade */}
           <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-uni-bg to-transparent -z-10 pointer-events-none"></div>
        </div>

      </div>
    </main>
  )
}
