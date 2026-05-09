'use client'

import React, { useEffect, useState } from 'react'
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

interface CheckpointItem {
  question: string
  options: string
  answer: string
  explanation: string
}

interface MaterialContent {
  id: string
  materialId: string
  materialType: string | null
  contentVariant: string | null
  displayTitle: string | null
  shortDescription: string | null
  whyRedirected: string | null
  learningObjectives: string[] | null
  conceptText: string | null
  formulas: string[] | null
  steps: string[] | null
  examples: { title: string; problem: string; solution: string }[] | null
  commonMistakes: string[] | null
  checkpointItems: CheckpointItem[] | null
  bodyMarkdown: string | null
  wajibBelajarMessage: string | null
  estimatedReadingMinutes: number | null
}

export default function MaterialDetailPage() {
  const params = useParams()
  const materialId = params.materialId as string
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'lengkap' | 'video'>('ringkasan')
  const [material, setMaterial] = useState<Material | null>(null)
  const [shortContent, setShortContent] = useState<MaterialContent | null>(null)
  const [fullContent, setFullContent] = useState<MaterialContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [fromGameOver, setFromGameOver] = useState(false)
  const [canContinue, setCanContinue] = useState(true)
  const [countdown, setCountdown] = useState(0)
  const [checkpointAnswers, setCheckpointAnswers] = useState<Record<number, string>>({})
  const [checkpointRevealed, setCheckpointRevealed] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const studyData = sessionStorage.getItem('studyMaterial')
    if (studyData) {
      const data = JSON.parse(studyData)
      if (data.materialId === materialId) {
        setFromGameOver(true)
        setCanContinue(false)
        setCountdown(15)
        sessionStorage.setItem('materialStudied_' + materialId, 'true')
      }
    }
  }, [materialId])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (!canContinue && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000)
    } else if (!canContinue && countdown === 0) {
      setCanContinue(true)
    }
    return () => clearTimeout(timer)
  }, [countdown, canContinue])

  useEffect(() => {
    fetchAll()
  }, [materialId, token])

  const fetchAll = async () => {
    try {
      // Fetch material info
      const matRes = await fetch(`/api/student/materials/${materialId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (matRes.ok) {
        const data = await matRes.json()
        setMaterial(data.material)
      }

      // Fetch SHORT content
      const shortRes = await fetch(`/api/student/materials/${materialId}/content?variant=SHORT`)
      if (shortRes.ok) {
        const data = await shortRes.json()
        setShortContent(data.content)
      }

      // Fetch FULL content
      const fullRes = await fetch(`/api/student/materials/${materialId}/content?variant=FULL`)
      if (fullRes.ok) {
        const data = await fullRes.json()
        setFullContent(data.content)
      }
    } catch (error) {
      console.error('Failed to fetch material:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToPractice = () => {
    if (!canContinue) return
    sessionStorage.removeItem('studyMaterial')
    router.push('/student/practice')
  }

  if (isLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-uni-bg">
        <div className="text-white/80 text-sm animate-pulse">Memuat materi…</div>
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

  // Choose which content to show based on active tab
  const currentContent = activeTab === 'lengkap' ? fullContent : shortContent

  // Helper: render markdown-like text into sections
  const renderBodyMarkdown = (md: string) => {
    const lines = md.split('\n')
    const elements: React.ReactNode[] = []

    lines.forEach((line, i) => {
      const trimmed = line.trim()
      if (!trimmed) {
        elements.push(<div key={i} className="h-2" />)
      } else if (trimmed.startsWith('# ')) {
        elements.push(<h2 key={i} className="text-xl font-bold text-cyan-300 mt-5 mb-2">{trimmed.slice(2)}</h2>)
      } else if (trimmed.startsWith('## ')) {
        elements.push(<h3 key={i} className="text-lg font-bold text-cyan-400 mt-4 mb-2">{trimmed.slice(3)}</h3>)
      } else if (trimmed.startsWith('### ')) {
        elements.push(<h4 key={i} className="text-base font-semibold text-teal-300 mt-3 mb-1">{trimmed.slice(4)}</h4>)
      } else if (trimmed.startsWith('- ')) {
        elements.push(
          <div key={i} className="flex items-start gap-2 ml-3 mb-1">
            <span className="text-cyan-400 mt-1 text-xs">●</span>
            <span className="text-slate-200 text-sm leading-relaxed">{renderInlineFormatting(trimmed.slice(2))}</span>
          </div>
        )
      } else if (/^\d+\.\s/.test(trimmed)) {
        const num = trimmed.match(/^(\d+)\./)?.[1]
        const text = trimmed.replace(/^\d+\.\s*/, '')
        elements.push(
          <div key={i} className="flex items-start gap-2 ml-3 mb-1">
            <span className="text-cyan-400 font-semibold text-sm min-w-[1.5rem]">{num}.</span>
            <span className="text-slate-200 text-sm leading-relaxed">{renderInlineFormatting(text)}</span>
          </div>
        )
      } else {
        elements.push(<p key={i} className="text-slate-200 text-sm leading-relaxed mb-1">{renderInlineFormatting(trimmed)}</p>)
      }
    })

    return <div>{elements}</div>
  }

  // Bold/italic inline formatting
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  // Render checkpoint items as interactive quiz
  const renderCheckpoints = (items: CheckpointItem[]) => {
    return (
      <div className="space-y-4">
        {items.map((item, idx) => {
          const options = item.options.split('|').map(o => o.trim())
          const selected = checkpointAnswers[idx]
          const revealed = checkpointRevealed[idx]
          const isCorrect = selected === item.answer

          return (
            <GlassCard key={idx} className="p-4">
              <p className="text-white font-medium text-sm mb-3">
                <span className="text-cyan-400 font-bold mr-1">{idx + 1}.</span> {item.question}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {options.map((opt) => {
                  const letter = opt.charAt(0)
                  const isSelected = selected === letter
                  const isAnswer = revealed && letter === item.answer

                  let btnClass = 'p-2 rounded-lg text-xs text-left transition-all border '
                  if (revealed) {
                    if (isAnswer) btnClass += 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                    else if (isSelected && !isCorrect) btnClass += 'bg-red-500/20 border-red-400/60 text-red-300'
                    else btnClass += 'bg-slate-800/50 border-slate-600/30 text-slate-400'
                  } else if (isSelected) {
                    btnClass += 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                  } else {
                    btnClass += 'bg-slate-800/50 border-slate-600/30 text-slate-300 hover:border-slate-500'
                  }

                  return (
                    <button
                      key={letter}
                      onClick={() => {
                        if (!revealed) setCheckpointAnswers(prev => ({ ...prev, [idx]: letter }))
                      }}
                      className={btnClass}
                      disabled={revealed}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
              {selected && !revealed && (
                <button
                  onClick={() => setCheckpointRevealed(prev => ({ ...prev, [idx]: true }))}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
                >
                  Cek Jawaban
                </button>
              )}
              <AnimatePresence>
                {revealed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`mt-2 p-2 rounded-lg text-xs ${isCorrect ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}
                  >
                    {isCorrect ? '✅ Benar!' : `❌ Salah. Jawaban: ${item.answer}`}
                    {item.explanation && (
                      <p className="text-slate-300 mt-1">💡 {item.explanation}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          )
        })}
      </div>
    )
  }

  // Google Drive & YouTube helpers
  const getGoogleDriveEmbedUrl = (url: string | null) => {
    if (!url) return null
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    return match ? `https://drive.google.com/file/d/${match[1]}/preview` : url
  }
  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (match) return `https://www.youtube.com/embed/${match[1]}`
    return url.includes('youtube.com/embed/') ? url : url
  }

  const fullEmbedUrl = getGoogleDriveEmbedUrl(material.fullUrl)
  const videoEmbedUrl = getYouTubeEmbedUrl(material.videoUrl)
  const hasRichContent = !!(shortContent || fullContent)

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

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
            {currentContent?.displayTitle || material.title}
          </h1>
          {(currentContent?.shortDescription || material.shortDescription) && (
            <p className="text-text-secondary text-sm sm:text-base">
              {currentContent?.shortDescription || material.shortDescription}
            </p>
          )}
          {currentContent?.estimatedReadingMinutes && (
            <p className="text-slate-500 text-xs mt-1">⏱️ ~{currentContent.estimatedReadingMinutes} menit baca</p>
          )}
        </motion.div>

        {/* Wajib Belajar Alert */}
        <AnimatePresence>
          {fromGameOver && (currentContent?.wajibBelajarMessage || currentContent?.whyRedirected) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 sm:mb-6"
            >
              <GlassCard className="p-4 sm:p-5 border-l-4 border-orange-400" style={{ borderLeftColor: '#fb923c' }}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xl">📖</span>
                  <h3 className="text-orange-300 font-semibold text-sm sm:text-base">
                    {currentContent?.wajibBelajarMessage || 'Wajib Belajar Dulu'}
                  </h3>
                </div>
                {currentContent?.whyRedirected && (
                  <p className="text-slate-300 text-sm leading-relaxed">{currentContent.whyRedirected}</p>
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 p-1 bg-uni-bg-secondary/50 rounded-xl overflow-x-auto">
          <button
            onClick={() => { setActiveTab('ringkasan'); setCheckpointAnswers({}); setCheckpointRevealed({}) }}
            className={`flex-1 min-w-[80px] py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'ringkasan' ? 'bg-uni-primary text-white' : 'text-text-secondary hover:text-white'}`}
          >
            📄 <span className="hidden sm:inline">Ringkasan</span><span className="sm:hidden">Ringkas</span>
          </button>
          <button
            onClick={() => { setActiveTab('lengkap'); setCheckpointAnswers({}); setCheckpointRevealed({}) }}
            className={`flex-1 min-w-[80px] py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'lengkap' ? 'bg-uni-primary text-white' : 'text-text-secondary hover:text-white'}`}
          >
            📖 Lengkap
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 min-w-[80px] py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'video' ? 'bg-uni-primary text-white' : 'text-text-secondary hover:text-white'}`}
          >
            🎬 Video
          </button>
        </div>

        {/* Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

          {/* === RINGKASAN / LENGKAP TAB === */}
          {(activeTab === 'ringkasan' || activeTab === 'lengkap') && (
            <div className="space-y-4 sm:space-y-6">

              {/* Body Markdown — the main rich content */}
              {currentContent?.bodyMarkdown ? (
                <GlassCard className="p-4 sm:p-6">
                  {renderBodyMarkdown(currentContent.bodyMarkdown)}
                </GlassCard>
              ) : activeTab === 'ringkasan' && material.summaryContent ? (
                /* Fallback: old summaryContent from materials table */
                <GlassCard className="p-4 sm:p-6">
                  <h3 className="text-cyan-400 font-bold text-sm sm:text-base mb-3">📝 Ringkasan Materi</h3>
                  <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">{material.summaryContent}</div>
                </GlassCard>
              ) : activeTab === 'lengkap' && fullEmbedUrl ? (
                /* Fallback: Google Drive PDF embed */
                <GlassCard className="p-3 sm:p-6">
                  <div className="aspect-[3/4] sm:aspect-[4/3] w-full">
                    <iframe src={fullEmbedUrl} className="w-full h-full rounded-lg" allow="autoplay" allowFullScreen />
                  </div>
                </GlassCard>
              ) : (
                <GlassCard className="p-3 sm:p-6">
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">{activeTab === 'ringkasan' ? '📄' : '📖'}</div>
                    <p className="text-text-secondary text-sm sm:text-base">
                      {activeTab === 'ringkasan' ? 'Ringkasan materi belum tersedia' : 'Materi lengkap belum tersedia'}
                    </p>
                  </div>
                </GlassCard>
              )}

              {/* Checkpoint Section */}
              {currentContent?.checkpointItems && currentContent.checkpointItems.length > 0 && (
                <div>
                  <h3 className="text-emerald-400 font-bold text-sm sm:text-base mb-3 flex items-center gap-2">
                    ✅ Checkpoint — Uji Pemahamanmu
                  </h3>
                  {renderCheckpoints(currentContent.checkpointItems)}
                </div>
              )}
            </div>
          )}

          {/* === VIDEO TAB === */}
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 mb-8">
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
