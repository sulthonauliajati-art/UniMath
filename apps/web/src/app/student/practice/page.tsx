'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TowerBackground } from '@/components/ui'
import { useAuth } from '@/lib/auth/context'

interface MaterialInfo {
  id: string
  title: string
  order: number
  progress: number
}

/**
 * Halaman /student/practice
 *
 * Flow yang benar:
 * 1. Cek apakah ada session AKTIF yang bisa dilanjutkan
 * 2. Jika ada → langsung redirect ke /student/practice/[materialId]/play
 * 3. Jika tidak ada → cari materi yang paling sesuai progress siswa (materi pertama yang
 *    belum selesai, berurutan dari order terkecil) → redirect ke start page materi itu
 *
 * Siswa TIDAK memilih materi secara manual.
 * Semua diputuskan sistem berdasarkan progress.
 */
export default function PracticePage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [status, setStatus] = useState<'checking' | 'starting' | 'error' | 'no_material'>('checking')
  const [errorMsg, setErrorMsg] = useState('')
  const [currentMaterial, setCurrentMaterial] = useState<MaterialInfo | null>(null)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  const resolveAndRedirect = useCallback(async () => {
    if (!user) return

    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      // 1️⃣ Cek apakah ada session AKTIF (bisa dilanjutkan)
      const currentRes = await fetch('/api/practice/current', { headers })

      if (currentRes.ok) {
        const data = await currentRes.json()
        if (data.sessionId && data.materialId) {
          // Ada session aktif — simpan ke sessionStorage dan lanjut main
          sessionStorage.setItem('practiceSession', JSON.stringify({
            sessionId: data.sessionId,
            floor: data.floor || 1,
            consecutiveWrong: data.consecutiveWrong || 0,
            currentDifficulty: data.currentDifficulty || 2,
            difficultyLabel: data.difficultyLabel || 'Sedang',
            question: data.question,
            materialId: data.materialId,
            materialName: data.materialName,
            stats: data.stats,
            streak: data.currentStreak || 0,
            sessionXP: 0,
          }))
          router.replace(`/student/practice/${data.materialId}/play`)
          return
        }
      }

      // 2️⃣ Tidak ada session aktif → cari materi yang sesuai progress
      setStatus('starting')
      const matsRes = await fetch('/api/student/materials', { headers })

      if (!matsRes.ok) {
        setStatus('error')
        setErrorMsg('Gagal memuat materi. Coba lagi.')
        return
      }

      const matsData = await matsRes.json()
      const mats: MaterialInfo[] = (matsData.materials || [])
        .sort((a: MaterialInfo, b: MaterialInfo) => a.order - b.order)

      if (mats.length === 0) {
        setStatus('no_material')
        return
      }

      // Pilih materi pertama yang belum selesai (progress < 100%)
      // Jika semua sudah 100%, ulang dari materi pertama
      const nextMaterial = mats.find(m => m.progress < 100) || mats[0]
      setCurrentMaterial(nextMaterial)

      // 3️⃣ Auto-start practice untuk materi yang dipilih sistem
      const startHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) startHeaders['Authorization'] = `Bearer ${token}`

      const startRes = await fetch('/api/practice/start', {
        method: 'POST',
        headers: startHeaders,
        body: JSON.stringify({ materialId: nextMaterial.id }),
      })

      const startData = await startRes.json()

      if (!startRes.ok || startData.error) {
        setStatus('error')
        setErrorMsg(startData.error?.message || 'Gagal memulai latihan.')
        return
      }

      if (startData.sessionId) {
        sessionStorage.setItem('practiceSession', JSON.stringify({
          ...startData,
          materialName: nextMaterial.title,
        }))
        router.replace(`/student/practice/${nextMaterial.id}/play`)
      } else {
        setStatus('error')
        setErrorMsg('Session tidak valid. Coba lagi.')
      }
    } catch (err) {
      console.error('Practice resolve error:', err)
      setStatus('error')
      setErrorMsg('Terjadi kesalahan jaringan. Coba lagi.')
    }
  }, [user, token, router])

  useEffect(() => {
    if (!isLoading && user?.role === 'STUDENT') {
      resolveAndRedirect()
    }
  }, [isLoading, user, resolveAndRedirect])

  // Loading / transitioning state
  if (isLoading || !user) {
    return (
      <TowerBackground variant="practice">
        <div className="min-h-[100dvh] flex items-center justify-center">
          <div className="text-white/80 text-sm animate-pulse">Memuat…</div>
        </div>
      </TowerBackground>
    )
  }

  if (status === 'no_material') {
    return (
      <TowerBackground variant="practice">
        <div className="min-h-[100dvh] flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-sm"
          >
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-white text-xl font-bold mb-2">Belum ada materi</h2>
            <p className="text-slate-400 text-sm mb-6">
              Guru belum menambahkan materi latihan. Silakan tunggu atau hubungi gurumu.
            </p>
            <Link href="/student/dashboard">
              <button className="px-6 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-all">
                ← Kembali ke Dashboard
              </button>
            </Link>
          </motion.div>
        </div>
      </TowerBackground>
    )
  }

  if (status === 'error') {
    return (
      <TowerBackground variant="practice">
        <div className="min-h-[100dvh] flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-sm"
          >
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-white text-xl font-bold mb-2">Terjadi Kesalahan</h2>
            <p className="text-red-300 text-sm mb-6">{errorMsg}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={resolveAndRedirect}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-900 text-sm font-bold hover:bg-cyan-400 transition-all"
              >
                🔄 Coba Lagi
              </button>
              <Link href="/student/dashboard">
                <button className="px-6 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-all">
                  ← Dashboard
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </TowerBackground>
    )
  }

  // Default: 'checking' | 'starting' — tampilkan loading dengan info materi jika sudah tahu
  return (
    <TowerBackground variant="practice">
      <div className="min-h-[100dvh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Animated tower icon */}
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="text-7xl mb-6"
          >
            🏢
          </motion.div>

          {currentMaterial ? (
            <>
              <h2 className="text-white text-xl font-bold mb-1">
                Memulai Latihan…
              </h2>
              <p className="text-cyan-300 text-sm font-medium mb-1">
                Materi {currentMaterial.order}: {currentMaterial.title}
              </p>
              <p className="text-slate-400 text-xs">
                Progress sebelumnya: {currentMaterial.progress}%
              </p>
            </>
          ) : (
            <>
              <h2 className="text-white text-xl font-bold mb-2">
                {status === 'checking' ? 'Memeriksa sesi latihan…' : 'Menyiapkan latihan…'}
              </h2>
              <p className="text-slate-400 text-sm">Sebentar lagi dimulai</p>
            </>
          )}

          {/* Spinner */}
          <div className="mt-6 flex justify-center">
            <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        </motion.div>
      </div>
    </TowerBackground>
  )
}
