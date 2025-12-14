'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { useAuth } from '@/lib/auth/context'
import { mockMaterials } from '@/data/mock/seed'

export default function PracticeStartPage() {
  const params = useParams()
  const materialId = params.materialId as string
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [mode, setMode] = useState<'pretest' | 'posttest'>('pretest')
  const [loading, setLoading] = useState(false)

  const material = mockMaterials.find((m) => m.id === materialId)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  const handleStart = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId, mode }),
      })
      const data = await res.json()
      if (data.sessionId) {
        // Store session in sessionStorage for the game
        sessionStorage.setItem('practiceSession', JSON.stringify({
          ...data,
          materialName: material?.title || 'Matematika',
        }))
        router.push(`/student/practice/${materialId}/play`)
      }
    } catch (error) {
      console.error('Failed to start practice:', error)
    } finally {
      setLoading(false)
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
    <main className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      <StarryBackground />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-6 sm:p-8 text-center">
            {/* Robot illustration */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 sm:mb-6"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-uni-primary/20 to-uni-accent/20 rounded-full flex items-center justify-center">
                <span className="text-5xl sm:text-6xl">🤖</span>
              </div>
            </motion.div>

            {/* Material title */}
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
              {material?.title || 'Latihan'}
            </h1>
            <p className="text-text-secondary text-sm sm:text-base mb-4 sm:mb-6">
              Bantu robot naik gedung dengan menjawab soal!
            </p>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-6 sm:mb-8 p-1 bg-uni-bg-secondary/50 rounded-xl">
              <button
                onClick={() => setMode('pretest')}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  mode === 'pretest'
                    ? 'bg-uni-primary text-white'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                Pre-test
              </button>
              <button
                onClick={() => setMode('posttest')}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  mode === 'posttest'
                    ? 'bg-uni-primary text-white'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                Post-test
              </button>
            </div>

            {/* Start button */}
            <NeonButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleStart}
              loading={loading}
            >
              🚀 Mulai Latihan
            </NeonButton>

            {/* Back link */}
            <Link
              href="/student/materials"
              className="block mt-4 sm:mt-6 text-text-secondary hover:text-white text-xs sm:text-sm transition-colors"
            >
              ← Kembali ke Daftar Materi
            </Link>
          </GlassCard>
        </motion.div>
      </div>
    </main>
  )
}
