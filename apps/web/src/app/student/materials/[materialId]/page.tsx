'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
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
  options: string // "A ... | B ... | C ... | D ..."
  answer: string  // "A", "B", "C", or "D"
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
  const [scrollProgress, setScrollProgress] = useState(0)
  const [scrollDone, setScrollDone] = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  // Checkpoint quiz state
  const [checkpointAnswers, setCheckpointAnswers] = useState<Record<number, string[]>>({})
  const [checkpointResults, setCheckpointResults] = useState<Record<number, boolean | null>>({})

  // Reset checkpoint answers when tab changes
  useEffect(() => {
    setCheckpointAnswers({})
    setCheckpointResults({})
  }, [activeTab])

  const contentRef = useRef<HTMLDivElement>(null)

  const MIN_STUDY_SECONDS = 90

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  // ── Initialize Wajib Belajar mode ──
  useEffect(() => {
    const studyData = sessionStorage.getItem('studyMaterial')
    if (studyData) {
      const data = JSON.parse(studyData)
      if (data.materialId === materialId) {
        setFromGameOver(true)
        setCanContinue(false)
        setTimeLeft(MIN_STUDY_SECONDS)
        sessionStorage.setItem('materialStudied_' + materialId, 'true')
      }
    }
  }, [materialId])

  // ── Countdown timer (90s default) ──
  useEffect(() => {
    if (!fromGameOver || timerDone) return
    if (timeLeft <= 0) {
      setTimerDone(true)
      return
    }
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearTimeout(t)
  }, [fromGameOver, timerDone, timeLeft])

  // ── Unlock logic: scrollDone AND timerDone ──
  useEffect(() => {
    if (!fromGameOver || canContinue) return
    if (scrollDone && timerDone) {
      setCanContinue(true)
    }
  }, [fromGameOver, canContinue, scrollDone, timerDone])

  // ── Scroll-based progress tracking ──
  const handleScroll = useCallback(() => {
    if (!fromGameOver || scrollDone) return

    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight

    if (docHeight <= 0) {
      setScrollDone(true)
      setScrollProgress(100)
      return
    }

    const progress = Math.min(100, Math.round((scrollTop / docHeight) * 100))
    setScrollProgress(progress)

    if (progress >= 95) {
      setScrollDone(true)
      setScrollProgress(100)
    }
  }, [fromGameOver, scrollDone])

  useEffect(() => {
    if (fromGameOver && !scrollDone) {
      window.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll()
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [fromGameOver, scrollDone, handleScroll])

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

      {/* ── STICKY CONTINUE-TO-PRACTICE BAR (Wajib Belajar) ─────────
           Appears ONLY when the student arrives here via the
           "3 consecutive wrong" redirect. Sits above the header so
           the countdown is visible immediately without scrolling. */}
      {fromGameOver && (
        <StickyContinueBar
          canContinue={canContinue}
          scrollProgress={scrollProgress}
          scrollDone={scrollDone}
          timerDone={timerDone}
          timeLeft={timeLeft}
          onContinue={handleBackToPractice}
        />
      )}

      <div ref={contentRef} className={`relative z-10 p-4 sm:p-6 max-w-4xl mx-auto ${fromGameOver ? 'pb-36' : ''}`}>
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
            onClick={() => setActiveTab('ringkasan')}
            className={`flex-1 min-w-[80px] py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'ringkasan' ? 'bg-uni-primary text-white' : 'text-text-secondary hover:text-white'}`}
          >
            📄 <span className="hidden sm:inline">Ringkasan</span><span className="sm:hidden">Ringkas</span>
          </button>
          <button
            onClick={() => setActiveTab('lengkap')}
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

              {/* === UJI PEMAHAMAN (Checkpoint Quiz) === */}
              {currentContent?.checkpointItems && currentContent.checkpointItems.length > 0 && (
                <GlassCard className="p-4 sm:p-6">
                  <h3 className="text-cyan-400 font-bold text-sm sm:text-base mb-4 flex items-center gap-2">
                    <span>🧠</span> Uji Pemahaman
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mb-4">
                    Jawab pertanyaan berikut untuk menguji pemahamanmu tentang materi ini.
                  </p>
                  <div className="space-y-5">
                    {currentContent.checkpointItems.map((item, idx) => {
                      // Parse options from "A ... | B ... | C ... | D ..."
                      const optionParts = item.options.split('|').map(o => o.trim())
                      const parsedOptions = optionParts.map(o => ({
                        letter: o.charAt(0),
                        text: o.slice(2).trim(),
                      }))

                      const result = checkpointResults[idx]
                      const isCorrect = result === true
                      // Track which options have been tried (wrong)
                      const triedWrong: string[] = checkpointAnswers[idx] || []

                      return (
                        <div key={idx} className="p-3 sm:p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                          <p className="text-white text-sm sm:text-base font-medium mb-3">
                            {idx + 1}. {item.question}
                          </p>
                          <div className="space-y-2">
                            {parsedOptions.map((opt) => {
                              const wasTriedWrong = triedWrong.includes(opt.letter)
                              const isDisabled = isCorrect || wasTriedWrong

                              return (
                                <button
                                  key={opt.letter}
                                  onClick={() => {
                                    if (isDisabled) return
                                    const correct = opt.letter === item.answer
                                    if (correct) {
                                      setCheckpointResults(prev => ({ ...prev, [idx]: true }))
                                      setCheckpointAnswers(prev => ({ ...prev, [idx]: [...triedWrong, opt.letter] }))
                                    } else {
                                      // Mark this option as tried-wrong, allow retry
                                      setCheckpointAnswers(prev => ({ ...prev, [idx]: [...triedWrong, opt.letter] }))
                                      setCheckpointResults(prev => ({ ...prev, [idx]: false }))
                                    }
                                  }}
                                  disabled={isDisabled}
                                  className={[
                                    'w-full text-left px-3 sm:px-4 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2',
                                    // Correct final answer
                                    isCorrect && triedWrong.includes(opt.letter) && opt.letter === item.answer && 'bg-emerald-500/20 border border-emerald-400 text-emerald-300',
                                    // Was tried wrong → disabled, muted
                                    wasTriedWrong && opt.letter !== item.answer && 'bg-slate-800/30 border border-orange-400/30 text-slate-500 line-through opacity-60',
                                    // Not yet interacted, still available
                                    !isDisabled && !wasTriedWrong && 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 border border-slate-600/50',
                                    // Correct but not the answer clicked (when quiz is done)
                                    isCorrect && !triedWrong.includes(opt.letter) && 'bg-slate-800/30 border border-slate-700/30 text-slate-400',
                                  ].filter(Boolean).join(' ')}
                                >
                                  <span className={[
                                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                                    isCorrect && opt.letter === item.answer && 'bg-emerald-400 text-slate-900',
                                    wasTriedWrong && opt.letter !== item.answer && 'bg-orange-400/50 text-slate-900',
                                    !isDisabled && !wasTriedWrong && 'bg-slate-600/50 text-slate-300',
                                    isCorrect && !triedWrong.includes(opt.letter) && opt.letter !== item.answer && 'bg-slate-700/30 text-slate-500',
                                  ].filter(Boolean).join(' ')}>
                                    {wasTriedWrong && opt.letter !== item.answer ? '✕' : opt.letter}
                                  </span>
                                  <span>{opt.text}</span>
                                </button>
                              )
                            })}
                          </div>
                          {/* Feedback */}
                          {isCorrect && (
                            <div className="mt-3 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-400">
                              ✅ Benar! Kamu paham materinya.
                            </div>
                          )}
                          {result === false && !isCorrect && (
                            <div className="mt-3 px-3 py-2 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-400">
                              🤔 Kurang tepat, coba lagi!
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </GlassCard>
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

        {/* Back to Practice Button — only shown when NOT in "Wajib Belajar"
            mode. In Wajib Belajar mode, the sticky bar above the page already
            shows the countdown + continue button, so we avoid duplication. */}
        {!fromGameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 mb-8">
            <button
              className="w-full py-3 rounded-lg font-bold text-center transition-all bg-uni-primary text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:bg-uni-primary/90"
              onClick={handleBackToPractice}
            >
              🚀 Kembali Latihan
            </button>
          </motion.div>
        )}
      </div>

      {/* ── FIXED BOTTOM BAR — always visible in Wajib Belajar mode ── */}
      {fromGameOver && (
        <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
          <div className="backdrop-blur-xl bg-[rgba(4,9,20,0.95)] border-t border-white/10 shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.8)]">
            <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-3">
              {/* Status indicators */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs">
                  {/* Scroll check */}
                  <span className={scrollDone ? 'text-emerald-400' : 'text-slate-500'}>
                    {scrollDone ? '✅' : '⬜'} Scroll
                  </span>
                  {/* Timer check */}
                  <span className={timerDone ? 'text-emerald-400' : 'text-slate-500'}>
                    {timerDone ? '✅' : '⬜'}
                    {` ${timeLeft > 0 ? `${timeLeft}s` : 'Timer'}`}
                  </span>
                </div>
                {!canContinue && (
                  <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5 line-clamp-1">
                    {!scrollDone
                      ? 'Scroll sampai bawah untuk membaca materi'
                      : 'Tunggu waktu habis sebelum bisa lanjut latihan'}
                  </p>
                )}
              </div>

              {/* Button */}
              <button
                onClick={handleBackToPractice}
                disabled={!canContinue}
                className={[
                  'shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-all',
                  canContinue
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 shadow-[0_0_20px_-4px_rgba(16,185,129,0.8)] hover:shadow-[0_0_28px_-4px_rgba(16,185,129,1)] active:scale-95'
                    : 'bg-slate-700/60 text-slate-400 border border-slate-600/40 cursor-not-allowed',
                ].join(' ')}
              >
                {canContinue ? (
                  <>
                    <span>🚀</span>
                    <span>Lanjut Latihan</span>
                  </>
                ) : (
                  <>
                    <span>🔒</span>
                    <span className="hidden sm:inline">Terkunci</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

/* ───────────────────────────────────────────────────────────────────
 * StickyContinueBar
 *
 * Compact sticky bar at the top showing dual-condition progress:
 * 1. Scroll progress (percentage)
 * 2. Timer countdown OR checkpoint status
 * ──────────────────────────────────────────────────────────────── */
function StickyContinueBar({
  canContinue,
  scrollProgress,
  scrollDone,
  timerDone,
  timeLeft,
  onContinue,
}: {
  canContinue: boolean
  scrollProgress: number
  scrollDone: boolean
  timerDone: boolean
  timeLeft: number
  onContinue: () => void
}) {
  // Status message for the top bar
  const getStatusText = () => {
    if (canContinue) return 'Semua syarat terpenuhi! 🎉'
    const parts: string[] = []
    if (!scrollDone) parts.push(`Scroll ${scrollProgress}%`)
    else parts.push('Scroll ✅')
    if (!timerDone) parts.push(`⏱ ${timeLeft}s`)
    else parts.push('Timer ✅')
    return parts.join(' · ')
  }

  return (
    <div className="sticky top-0 z-40 w-full">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="backdrop-blur-xl bg-[rgba(7,17,36,0.88)] border-b border-cyan-400/30 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]"
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-orange-300/90 font-semibold">
              📚 Wajib Belajar
            </p>
            <p className="text-white text-xs sm:text-sm leading-tight mt-0.5 line-clamp-1 tabular-nums">
              {getStatusText()}
            </p>
          </div>

          {canContinue && (
            <button
              onClick={onContinue}
              className="shrink-0 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 shadow-[0_0_20px_-4px_rgba(16,185,129,0.8)] hover:shadow-[0_0_28px_-4px_rgba(16,185,129,1)] active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>🚀</span>
              <span>Lanjut</span>
            </button>
          )}
        </div>

        {/* Scroll progress bar */}
        {!scrollDone && (
          <div className="h-[3px] w-full bg-black/50">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-300"
              animate={{ width: `${scrollProgress}%` }}
              transition={{ duration: 0.15, ease: 'linear' }}
              style={{ boxShadow: '0 0 10px rgba(251,191,36,0.6)' }}
            />
          </div>
        )}
      </motion.div>
    </div>
  )
}
