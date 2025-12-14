'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { useAuth } from '@/lib/auth/context'

interface Material {
  id: string
  title: string
  description: string | null
  summaryUrl: string | null
  fullUrl: string | null
  videoUrl: string | null
}

export default function MaterialDetailPage() {
  const params = useParams()
  const materialId = params.materialId as string
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'lengkap' | 'video'>('ringkasan')
  const [material, setMaterial] = useState<Material | null>(null)
  const [loading, setLoading] = useState(true)
  const [fromGameOver, setFromGameOver] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    // Check if coming from game over
    const studyData = sessionStorage.getItem('studyMaterial')
    if (studyData) {
      const data = JSON.parse(studyData)
      if (data.materialId === materialId) {
        setFromGameOver(true)
        // Mark that student has viewed the material
        sessionStorage.setItem('materialStudied_' + materialId, 'true')
      }
    }
  }, [materialId])

  useEffect(() => {
    fetchMaterial()
  }, [materialId, token])

  const fetchMaterial = async () => {
    try {
      const res = await fetch(`/api/student/materials/${materialId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setMaterial(data.material)
      }
    } catch (error) {
      console.error('Failed to fetch material:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToPractice = () => {
    // Clear the study requirement
    sessionStorage.removeItem('studyMaterial')
    router.push('/student/practice')
  }

  if (isLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-uni-bg">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!material) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-uni-bg">
        <div className="text-white">Materi tidak ditemukan</div>
      </div>
    )
  }

  // Extract Google Drive embed URL
  const getGoogleDriveEmbedUrl = (url: string | null) => {
    if (!url) return null
    // Convert Google Drive share link to embed link
    // Format: https://drive.google.com/file/d/FILE_ID/view -> https://drive.google.com/file/d/FILE_ID/preview
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (match) {
      return `https://drive.google.com/file/d/${match[1]}/preview`
    }
    return url
  }

  // Extract YouTube embed URL
  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null
    // Convert YouTube watch link to embed link
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
    // Already an embed URL
    if (url.includes('youtube.com/embed/')) {
      return url
    }
    return url
  }

  const summaryEmbedUrl = getGoogleDriveEmbedUrl(material.summaryUrl)
  const fullEmbedUrl = getGoogleDriveEmbedUrl(material.fullUrl)
  const videoEmbedUrl = getYouTubeEmbedUrl(material.videoUrl)

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />

      <div className="relative z-10 p-4 sm:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
          <Link href="/student/materials" className="text-text-secondary hover:text-white text-sm sm:text-base">
            ← Kembali
          </Link>
          {fromGameOver && (
            <span className="px-2 sm:px-3 py-1 bg-orange-500/20 text-orange-400 text-xs sm:text-sm rounded-full">
              📚 Wajib Belajar
            </span>
          )}
        </div>

        {/* Material Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">{material.title}</h1>
          {material.description && (
            <p className="text-text-secondary text-sm sm:text-base">{material.description}</p>
          )}
        </motion.div>

        {/* Tab Navigation - Scrollable on mobile */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 p-1 bg-uni-bg-secondary/50 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`flex-1 min-w-[80px] py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'ringkasan' ? 'bg-uni-primary text-white' : 'text-text-secondary hover:text-white'
            }`}
          >
            📄 <span className="hidden sm:inline">Ringkasan</span><span className="sm:hidden">Ringkas</span>
          </button>
          <button
            onClick={() => setActiveTab('lengkap')}
            className={`flex-1 min-w-[80px] py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'lengkap' ? 'bg-uni-primary text-white' : 'text-text-secondary hover:text-white'
            }`}
          >
            📖 Lengkap
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 min-w-[80px] py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'video' ? 'bg-uni-primary text-white' : 'text-text-secondary hover:text-white'
            }`}
          >
            🎬 Video
          </button>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCard className="p-3 sm:p-6">
            {activeTab === 'ringkasan' && (
              summaryEmbedUrl ? (
                <div className="aspect-[3/4] sm:aspect-[4/3] w-full">
                  <iframe
                    src={summaryEmbedUrl}
                    className="w-full h-full rounded-lg"
                    allow="autoplay"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📄</div>
                  <p className="text-text-secondary text-sm sm:text-base">Ringkasan materi belum tersedia</p>
                </div>
              )
            )}

            {activeTab === 'lengkap' && (
              fullEmbedUrl ? (
                <div className="aspect-[3/4] sm:aspect-[4/3] w-full">
                  <iframe
                    src={fullEmbedUrl}
                    className="w-full h-full rounded-lg"
                    allow="autoplay"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📖</div>
                  <p className="text-text-secondary text-sm sm:text-base">Materi lengkap belum tersedia</p>
                </div>
              )
            )}

            {activeTab === 'video' && (
              videoEmbedUrl ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={videoEmbedUrl}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎬</div>
                  <p className="text-text-secondary text-sm sm:text-base">Video pembelajaran belum tersedia</p>
                </div>
              )
            )}
          </GlassCard>
        </motion.div>

        {/* Back to Practice Button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6">
          <NeonButton variant="primary" size="lg" className="w-full" onClick={handleBackToPractice}>
            🚀 {fromGameOver ? 'Lanjut Latihan' : 'Kembali Latihan'}
          </NeonButton>
        </motion.div>
      </div>
    </main>
  )
}
