'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/lib/auth/context'

interface Material {
  id: string
  title: string
  description: string | null
  shortDescription: string | null
  summaryUrl: string | null
  fullUrl: string | null
  videoUrl: string | null
  learningObjectives: string | null
  summaryContent: string | null
  commonMistakes: string | null
  remedialText: string | null
  videoDescription: string | null
  checkpointQuestion: string | null
  checkpointAnswer: string | null
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
  const [canContinue, setCanContinue] = useState(true)
  const [countdown, setCountdown] = useState(0)
  const [showCheckpointAnswer, setShowCheckpointAnswer] = useState(false)

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
        setCanContinue(false)
        setCountdown(15)
        // Mark that student has viewed the material
        sessionStorage.setItem('materialStudied_' + materialId, 'true')
      }
    }
  }, [materialId])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (!canContinue && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
    } else if (!canContinue && countdown === 0) {
      setCanContinue(true)
    }
    return () => clearTimeout(timer)
  }, [countdown, canContinue])

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
    if (!canContinue) return
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
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (match) {
      return `https://drive.google.com/file/d/${match[1]}/preview`
    }
    return url
  }

  // Extract YouTube embed URL
  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
    if (url.includes('youtube.com/embed/')) {
      return url
    }
    return url
  }

  // Parse learning objectives from JSON
  const parseLearningObjectives = (): string[] => {
    if (!material.learningObjectives) return []
    try {
      return JSON.parse(material.learningObjectives)
    } catch {
      return material.learningObjectives.split('\n').filter(Boolean)
    }
  }

  // Parse commonMistakes into list items
  const parseCommonMistakes = (): string[] => {
    if (!material.commonMistakes) return []
    return material.commonMistakes
      .split('\n')
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(Boolean)
  }

  // Render summaryContent with basic formatting
  const renderFormattedText = (text: string) => {
    const paragraphs = text.split('\n\n')
    return paragraphs.map((para, pIdx) => {
      const lines = para.split('\n')
      return (
        <div key={pIdx} className="mb-4 last:mb-0">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim()
            if (!trimmed) return null

            // Bullet points
            if (trimmed.startsWith('- ')) {
              return (
                <div key={lIdx} className="flex items-start gap-2 ml-2 mb-1">
                  <span className="text-cyan-400 mt-1 text-xs">●</span>
                  <span className="text-slate-200 text-sm sm:text-base leading-relaxed">{trimmed.slice(2)}</span>
                </div>
              )
            }

            // Numbered items
            if (/^\d+\.\s/.test(trimmed)) {
              return (
                <div key={lIdx} className="flex items-start gap-2 ml-2 mb-1">
                  <span className="text-cyan-400 font-semibold text-sm min-w-[1.2rem]">{trimmed.match(/^\d+/)?.[0]}.</span>
                  <span className="text-slate-200 text-sm sm:text-base leading-relaxed">{trimmed.replace(/^\d+\.\s*/, '')}</span>
                </div>
              )
            }

            // Section headers (lines ending with :)
            if (trimmed.endsWith(':') && trimmed.length < 60 && !trimmed.includes('=')) {
              return (
                <h4 key={lIdx} className="text-cyan-300 font-semibold text-sm sm:text-base mt-3 mb-1">{trimmed}</h4>
              )
            }

            // Regular text
            return (
              <p key={lIdx} className="text-slate-200 text-sm sm:text-base leading-relaxed mb-1">{trimmed}</p>
            )
          })}
        </div>
      )
    })
  }

  const fullEmbedUrl = getGoogleDriveEmbedUrl(material.fullUrl)
  const videoEmbedUrl = getYouTubeEmbedUrl(material.videoUrl)
  const objectives = parseLearningObjectives()
  const mistakes = parseCommonMistakes()

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
          {material.shortDescription && (
            <p className="text-text-secondary text-sm sm:text-base">{material.shortDescription}</p>
          )}
        </motion.div>

        {/* Remedial Alert (only when coming from game over) */}
        <AnimatePresence>
          {fromGameOver && material.remedialText && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 sm:mb-6"
            >
              <GlassCard className="p-4 sm:p-5 border-l-4 border-orange-400" style={{ borderLeftColor: '#fb923c' }}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xl">📖</span>
                  <h3 className="text-orange-300 font-semibold text-sm sm:text-base">Catatan Remedial</h3>
                </div>
                <div className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {material.remedialText}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
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
          {/* === TAB RINGKASAN === */}
          {activeTab === 'ringkasan' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Learning Objectives */}
              {objectives.length > 0 && (
                <GlassCard className="p-4 sm:p-6">
                  <h3 className="text-cyan-400 font-bold text-sm sm:text-base mb-3 flex items-center gap-2">
                    🎯 Tujuan Pembelajaran
                  </h3>
                  <ul className="space-y-2">
                    {objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5 text-xs">✓</span>
                        <span className="text-slate-200 text-sm sm:text-base leading-relaxed">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              )}

              {/* Summary Content */}
              {material.summaryContent ? (
                <GlassCard className="p-4 sm:p-6">
                  <h3 className="text-cyan-400 font-bold text-sm sm:text-base mb-3 flex items-center gap-2">
                    📝 Ringkasan Materi
                  </h3>
                  <div>{renderFormattedText(material.summaryContent)}</div>
                </GlassCard>
              ) : material.summaryUrl ? (
                <GlassCard className="p-3 sm:p-6">
                  <div className="aspect-[3/4] sm:aspect-[4/3] w-full">
                    <iframe
                      src={getGoogleDriveEmbedUrl(material.summaryUrl)!}
                      className="w-full h-full rounded-lg"
                      allow="autoplay"
                      allowFullScreen
                    />
                  </div>
                </GlassCard>
              ) : (
                <GlassCard className="p-3 sm:p-6">
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📄</div>
                    <p className="text-text-secondary text-sm sm:text-base">Ringkasan materi belum tersedia</p>
                  </div>
                </GlassCard>
              )}

              {/* Common Mistakes */}
              {mistakes.length > 0 && (
                <GlassCard className="p-4 sm:p-6">
                  <h3 className="text-amber-400 font-bold text-sm sm:text-base mb-3 flex items-center gap-2">
                    ⚠️ Kesalahan Umum
                  </h3>
                  <ul className="space-y-2">
                    {mistakes.map((mistake, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5 text-xs">⚡</span>
                        <span className="text-slate-300 text-sm sm:text-base leading-relaxed">{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              )}

              {/* Checkpoint */}
              {material.checkpointQuestion && (
                <GlassCard className="p-4 sm:p-6">
                  <h3 className="text-emerald-400 font-bold text-sm sm:text-base mb-3 flex items-center gap-2">
                    ✅ Checkpoint
                  </h3>
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-4">
                    {material.checkpointQuestion}
                  </p>
                  <button
                    onClick={() => setShowCheckpointAnswer(!showCheckpointAnswer)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                  >
                    {showCheckpointAnswer ? '🙈 Sembunyikan Jawaban' : '👀 Lihat Jawaban'}
                  </button>
                  <AnimatePresence>
                    {showCheckpointAnswer && material.checkpointAnswer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
                      >
                        <p className="text-emerald-300 font-semibold text-sm sm:text-base">
                          💡 {material.checkpointAnswer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              )}
            </div>
          )}

          {/* === TAB LENGKAP === */}
          {activeTab === 'lengkap' && (
            <GlassCard className="p-3 sm:p-6">
              {fullEmbedUrl ? (
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
                  <p className="text-text-secondary text-xs mt-2">PDF materi akan ditambahkan nanti</p>
                </div>
              )}
            </GlassCard>
          )}

          {/* === TAB VIDEO === */}
          {activeTab === 'video' && (
            <GlassCard className="p-3 sm:p-6">
              {videoEmbedUrl ? (
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
                  <p className="text-text-secondary text-sm sm:text-base mb-4">Video pembelajaran belum tersedia</p>
                  {material.videoDescription && (
                    <div className="text-left max-w-md mx-auto p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Rencana Konten Video:</p>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{material.videoDescription}</p>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          )}
        </motion.div>

        {/* Back to Practice Button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6">
          <button
            className={`w-full py-3 rounded-lg font-bold text-center transition-all ${
              canContinue 
                ? 'bg-uni-primary text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:bg-uni-primary/90' 
                : 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-600'
            }`}
            onClick={handleBackToPractice}
            disabled={!canContinue}
          >
            {fromGameOver 
              ? canContinue 
                ? '🚀 Lanjut Latihan' 
                : `⏳ Pelajari materi... (${countdown}s)` 
              : '🚀 Kembali Latihan'}
          </button>
        </motion.div>
      </div>
    </main>
  )
}
