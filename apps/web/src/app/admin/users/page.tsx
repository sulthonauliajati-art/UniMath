'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface Teacher {
  id: string
  name: string
  email: string | null
  createdAt: string
  points: number | null
}

interface Student {
  id: string
  name: string
  nisn: string | null
  totalPoints: number | null
  passwordStatus: string
  createdAt: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'teachers' | 'students'>('teachers')

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/admin/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function fetchUsers() {
      if (!token) return
      try {
        const res = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.teachers) setTeachers(data.teachers)
        if (data.students) setStudents(data.students)
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchUsers()
  }, [token])

  if (isLoading || !user) return <LoadingScreen />


  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/dashboard" className="text-text-secondary hover:text-white text-sm mb-2 inline-block">
              ← Kembali ke Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white">👥 Kelola Users</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'teachers' ? 'bg-uni-primary text-white' : 'bg-uni-bg-secondary/50 text-text-secondary hover:text-white'
            }`}
          >
            Guru ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'students' ? 'bg-uni-primary text-white' : 'bg-uni-bg-secondary/50 text-text-secondary hover:text-white'
            }`}
          >
            Siswa ({students.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center text-text-secondary py-8">Loading...</div>
        ) : activeTab === 'teachers' ? (
          <div className="space-y-3">
            {teachers.length === 0 ? (
              <GlassCard className="p-6 text-center text-text-secondary">Belum ada guru terdaftar</GlassCard>
            ) : (
              teachers.map((teacher, index) => (
                <motion.div key={teacher.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <GlassCard className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{teacher.name}</h3>
                        <p className="text-sm text-text-secondary">{teacher.email || 'No email'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-uni-warning font-bold">{teacher.points || 0} Poin</div>
                        <div className="text-xs text-text-muted">{new Date(teacher.createdAt).toLocaleDateString('id-ID')}</div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {students.length === 0 ? (
              <GlassCard className="p-6 text-center text-text-secondary">Belum ada siswa terdaftar</GlassCard>
            ) : (
              students.map((student, index) => (
                <motion.div key={student.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <GlassCard className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{student.name}</h3>
                        <p className="text-sm text-text-secondary">NISN: {student.nisn || '-'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-uni-primary font-bold">{student.totalPoints || 0} Poin</div>
                        <div className={`text-xs ${student.passwordStatus === 'SET' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {student.passwordStatus === 'SET' ? '✓ Password set' : '⚠ Password belum set'}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  )
}
