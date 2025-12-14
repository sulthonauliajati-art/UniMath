'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { useAuth } from '@/lib/auth/context'

export default function PracticePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [currentFloor, setCurrentFloor] = useState(1)
  const [currentMaterial, setCurrentMaterial] = useState('Penjumlahan Dasar')

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    // Fetch student's current progress to determine material
    async function fetchProgress() {
      try {
        const res = await fetch('/api/student/progress')
        const data = await res.json()
        if (data.currentFloor) {
          setCurrentFloor(data.currentFloor)
        }
        if (data.currentMaterial) {
          setCurrentMaterial(data.currentMaterial)
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error)
      }
    }
    if (user) {
      fetchProgress()
    }
  }, [user])

  const handleStartPractice = async () => {
    setLoading(true)
    try {
      // Start practice session - API will determine the correct material based on progress
      const res = await fetch('/api/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'practice' }), // No materialId - auto determined
      })
      const data = await res.json()
      
      if (data.sessionId) {
        sessionStorage.setItem('practiceSession', JSON.stringify({
          ...data,
          materialName: data.materialName || currentMaterial,
        }))
        router.push(`/student/practice/${data.materialId}/play`)
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
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />
      
      <div className="relative z-10 min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-6 sm:p-8 text-center">
            {/* Robot illustration */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 sm:mb-6"
            >
              <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto bg-gradient-to-br from-uni-primary/20 to-uni-accent/20 rounded-full flex items-center justify-center">
                <span className="text-4xl sm:text-6xl">🤖</span>
              </div>
            </motion.div>

            {/* Current Progress Info */}
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Siap Latihan?</h1>
            <p className="text-text-secondary text-sm sm:text-base mb-4 sm:mb-6">
              Bantu robot naik gedung dengan menjawab soal!
            </p>

            {/* Current Status */}
            <div className="bg-uni-bg-secondary/50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-secondary text-xs sm:text-sm">Lantai saat ini</span>
                <span className="text-uni-primary font-bold text-base sm:text-lg">{currentFloor}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-xs sm:text-sm">Materi</span>
                <span className="text-white font-medium text-sm sm:text-base truncate ml-2">{currentMaterial}</span>
              </div>
            </div>

            {/* Start Button */}
            <NeonButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleStartPractice}
              loading={loading}
            >
              🚀 Mulai Latihan
            </NeonButton>

            {/* Back link */}
            <Link
              href="/student/dashboard"
              className="block mt-3 sm:mt-4 text-text-secondary hover:text-white text-xs sm:text-sm transition-colors"
            >
              ← Kembali ke Dashboard
            </Link>
          </GlassCard>
        </motion.div>
      </div>
    </main>
  )
}
