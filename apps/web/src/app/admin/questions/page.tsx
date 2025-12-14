'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { useAuth } from '@/lib/auth/context'

interface Material {
  id: string
  title: string
  questionCount: number
}

interface Question {
  id: string
  materialId: string
  difficulty: number
  question: string
  correct: string
}

export default function AdminQuestionsPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/admin/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    fetchMaterials()
  }, [token])

  useEffect(() => {
    if (selectedMaterial) {
      fetchQuestions(selectedMaterial)
    }
  }, [selectedMaterial])

  const fetchMaterials = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/admin/materials', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setMaterials(data.materials || [])
      if (data.materials?.length > 0) {
        setSelectedMaterial(data.materials[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestions = async (materialId: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/admin/questions?materialId=${materialId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setQuestions(data.questions || [])
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedMaterial) return

    setUploading(true)
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('materialId', selectedMaterial)

    try {
      const res = await fetch('/api/admin/questions/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()

      if (data.error) {
        setMessage(`❌ ${data.error.message}`)
      } else {
        setMessage(`✅ Berhasil upload ${data.count} soal`)
        fetchQuestions(selectedMaterial)
        fetchMaterials()
      }
    } catch (error) {
      console.error('Upload error:', error)
      setMessage('❌ Gagal upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Yakin ingin menghapus SEMUA soal di materi ini?')) return

    try {
      await fetch(`/api/admin/questions?materialId=${selectedMaterial}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchQuestions(selectedMaterial)
      fetchMaterials()
      setMessage('✅ Semua soal berhasil dihapus')
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const downloadTemplate = () => {
    const csv = `kesulitan,soal,opsi_a,opsi_b,opsi_c,opsi_d,jawaban,hint1,hint2,hint3,penjelasan
1,5 + 3 = ?,6,7,8,9,C,Coba hitung dengan jari,5 + 3 berarti 5 ditambah 3,Mulai dari 5 lalu tambah 1 sebanyak 3 kali: 6 7 8,Jawabannya adalah 8
2,12 + 8 = ?,18,19,20,21,C,Pisahkan angka menjadi puluhan dan satuan,12 = 10 + 2 dan 8 tetap 8,10 + 2 + 8 = 10 + 10 = 20,Hasilnya adalah 20
3,45 + 37 = ?,72,82,83,92,B,Jumlahkan satuan dulu: 5 + 7,5 + 7 = 12 simpan 2 dan 1 naik ke puluhan,40 + 30 + 12 = 82,45 + 37 = 82`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_soal.csv'
    a.click()
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-text-secondary hover:text-white">
              ← Kembali
            </Link>
            <h1 className="text-2xl font-bold text-white">❓ Kelola Soal</h1>
          </div>
        </div>

        {/* Upload Section */}
        <GlassCard className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upload Soal dari CSV</h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Pilih Materi</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                {materials.map((mat) => (
                  <option key={mat.id} value={mat.id} className="bg-uni-bg">
                    {mat.title} ({mat.questionCount} soal)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Upload File CSV</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={uploading || !selectedMaterial}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-uni-primary file:text-white"
              />
            </div>
          </div>

          {message && (
            <p className={`text-sm mb-4 ${message.includes('✅') ? 'text-uni-success' : 'text-uni-error'}`}>
              {message}
            </p>
          )}

          <div className="flex gap-2">
            <NeonButton variant="secondary" onClick={downloadTemplate}>
              📥 Download Template CSV
            </NeonButton>
            {questions.length > 0 && (
              <NeonButton variant="ghost" onClick={handleDeleteAll}>
                🗑️ Hapus Semua Soal
              </NeonButton>
            )}
          </div>

          <div className="mt-4 p-4 bg-uni-bg-secondary/30 rounded-lg">
            <p className="text-sm text-text-secondary mb-2">Format CSV:</p>
            <code className="text-xs text-uni-primary">
              kesulitan,soal,opsi_a,opsi_b,opsi_c,opsi_d,jawaban,hint1,hint2,hint3,penjelasan
            </code>
            <p className="text-xs text-text-muted mt-2">
              • kesulitan: 1-3 (mudah, sedang, sulit)<br/>
              • jawaban: A, B, C, atau D<br/>
              • hint1: muncul setelah salah 1x<br/>
              • hint2: muncul setelah salah 2x<br/>
              • hint3: muncul setelah salah 3x<br/>
              • Salah 4x = game over, wajib buka materi
            </p>
          </div>
        </GlassCard>

        {/* Questions List */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Daftar Soal ({questions.length})
          </h3>
          
          {questions.length === 0 ? (
            <p className="text-text-secondary text-center py-4">Belum ada soal untuk materi ini</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {questions.map((q, index) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs bg-uni-primary/20 text-uni-primary px-2 py-1 rounded">
                      Lv.{q.difficulty}
                    </span>
                    <div className="flex-1">
                      <p className="text-white text-sm">{q.question}</p>
                      <p className="text-xs text-text-muted mt-1">Jawaban: {q.correct}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </main>
  )
}
