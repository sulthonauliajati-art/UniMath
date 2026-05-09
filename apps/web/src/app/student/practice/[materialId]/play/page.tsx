'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { TowerBackground, GlassCard } from '@/components/ui'
import { useAuth } from '@/lib/auth/context'

interface QuestionForClient {
  id: string
  materialId: string
  difficulty: number
  difficultyLabel: string
  question: string
  optA: string
  optB: string
  optC: string
  optD: string
}

interface GameState {
  sessionId: string
  floor: number
  consecutiveWrong: number
  currentDifficulty: number
  difficultyLabel: string
  question: QuestionForClient
  materialId: string
  materialName: string
  selectedAnswer: string | null
  showCorrectModal: boolean
  showMustStudyModal: boolean
  isSubmitting: boolean
  previousHint: string | null
  stats: { floorsClimbed: number; correctAnswers: number; totalAttempts: number }
}

const TOTAL_FLOORS = 10

const DIFFICULTY_COLORS: Record<number, { bg: string; border: string; text: string; label: string }> = {
  1: { bg: 'bg-emerald-500/20', border: 'border-emerald-400/60', text: 'text-emerald-300', label: 'Mudah' },
  2: { bg: 'bg-yellow-500/20', border: 'border-yellow-400/60', text: 'text-yellow-300', label: 'Sedang' },
  3: { bg: 'bg-red-500/20', border: 'border-red-400/60', text: 'text-red-300', label: 'Sulit' },
}

export default function GamePlayPage() {
  const params = useParams()
  const materialId = params.materialId as string
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [, setRobotState] = useState<'idle' | 'climbing' | 'celebrating'>('idle')
  const [showWrongFeedback, setShowWrongFeedback] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
      return
    }

    const initSession = async () => {
      const sessionData = sessionStorage.getItem('practiceSession')
      if (sessionData) {
        const data = JSON.parse(sessionData)
        setGameState({
          sessionId: data.sessionId,
          floor: data.floor || 1,
          consecutiveWrong: data.consecutiveWrong || 0,
          currentDifficulty: data.currentDifficulty || 2,
          difficultyLabel: data.difficultyLabel || 'Sedang',
          question: data.question,
          materialId: data.materialId || materialId,
          materialName: data.materialName || 'Matematika',
          selectedAnswer: null,
          showCorrectModal: false,
          showMustStudyModal: false,
          isSubmitting: false,
          previousHint: null,
          stats: data.stats || { floorsClimbed: 0, correctAnswers: 0, totalAttempts: 0 },
        })
      } else {
        try {
          const res = await fetch('/api/practice/current')
          if (res.ok) {
            const data = await res.json()
            sessionStorage.setItem('practiceSession', JSON.stringify(data))
            setGameState({
              sessionId: data.sessionId,
              floor: data.floor,
              consecutiveWrong: data.consecutiveWrong || 0,
              currentDifficulty: data.currentDifficulty || 2,
              difficultyLabel: data.difficultyLabel || 'Sedang',
              question: data.question,
              materialId: data.materialId,
              materialName: data.materialName,
              selectedAnswer: null,
              showCorrectModal: false,
              showMustStudyModal: false,
              isSubmitting: false,
              previousHint: null,
              stats: data.stats,
            })
          } else {
            router.push(`/student/practice/${materialId}/start`)
          }
        } catch {
          router.push(`/student/practice/${materialId}/start`)
        }
      }
    }

    initSession()
  }, [user, isLoading, router, materialId])

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06B6D4', '#10B981', '#ffffff'],
    })
  }, [])

  const handleSelectAnswer = (answer: string) => {
    if (gameState?.isSubmitting) return
    setGameState((prev) => (prev ? { ...prev, selectedAnswer: answer } : null))
  }

  const handleSubmitAnswer = async () => {
    if (!gameState || !gameState.selectedAnswer || gameState.isSubmitting) return

    setGameState((prev) => (prev ? { ...prev, isSubmitting: true } : null))

    try {
      const res = await fetch('/api/practice/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: gameState.sessionId,
          questionId: gameState.question.id,
          answer: gameState.selectedAnswer,
        }),
      })
      const data = await res.json()

      if (data.isCorrect) {
        // ─── CORRECT ───
        setRobotState('celebrating')
        fireConfetti()

        setGameState((prev) =>
          prev
            ? {
                ...prev,
                showCorrectModal: true,
                isSubmitting: false,
                previousHint: null,
                stats: {
                  ...prev.stats,
                  floorsClimbed: prev.stats.floorsClimbed + 1,
                  correctAnswers: prev.stats.correctAnswers + 1,
                  totalAttempts: prev.stats.totalAttempts + 1,
                },
              }
            : null
        )

        setTimeout(() => {
          setRobotState('climbing')
          setTimeout(() => {
            setRobotState('idle')
            if (data.nextQuestion) {
              setGameState((prev) =>
                prev
                  ? {
                      ...prev,
                      floor: data.floor,
                      consecutiveWrong: 0,
                      currentDifficulty: data.currentDifficulty,
                      difficultyLabel: data.difficultyLabel,
                      question: data.nextQuestion,
                      selectedAnswer: null,
                      showCorrectModal: false,
                      previousHint: null,
                    }
                  : null
              )
            } else {
              handleEndSession()
            }
          }, 800)
        }, 1500)
      } else {
        // ─── WRONG ───
        setShowWrongFeedback(true)
        setTimeout(() => setShowWrongFeedback(false), 600)

        if (data.mustStudy) {
          // 3x consecutive wrong → Wajib Belajar
          sessionStorage.setItem(
            'studyMaterial',
            JSON.stringify({
              materialId: data.materialId || gameState.materialId,
              materialName: data.materialName || gameState.materialName,
            })
          )
          setGameState((prev) =>
            prev
              ? {
                  ...prev,
                  consecutiveWrong: data.consecutiveWrong,
                  currentDifficulty: data.currentDifficulty,
                  difficultyLabel: data.difficultyLabel,
                  selectedAnswer: null,
                  isSubmitting: false,
                  showMustStudyModal: true,
                  previousHint: null,
                  stats: { ...prev.stats, totalAttempts: prev.stats.totalAttempts + 1 },
                }
              : null
          )
        } else {
          // Wrong but < 3 → show hint banner + new question
          setGameState((prev) => {
            if (!prev) return null
            return {
              ...prev,
              consecutiveWrong: data.consecutiveWrong,
              currentDifficulty: data.currentDifficulty,
              difficultyLabel: data.difficultyLabel,
              question: data.nextQuestion || prev.question,
              selectedAnswer: null,
              isSubmitting: false,
              previousHint: data.previousHint || null,
              stats: { ...prev.stats, totalAttempts: prev.stats.totalAttempts + 1 },
            }
          })
        }
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
      setGameState((prev) => (prev ? { ...prev, isSubmitting: false } : null))
    }
  }

  const handleEndSession = async () => {
    if (!gameState) return
    try {
      await fetch('/api/practice/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: gameState.sessionId,
          reason: 'user_quit',
          stats: gameState.stats,
        }),
      })
    } catch (error) {
      console.error('Failed to end session:', error)
    }
    sessionStorage.setItem(
      'practiceStats',
      JSON.stringify({
        ...gameState.stats,
        materialId: gameState.materialId,
        materialTitle: gameState.materialName,
      })
    )
    sessionStorage.removeItem('practiceSession')
    router.push('/student/practice/complete')
  }

  if (isLoading || !user || !gameState) {
    return (
      <TowerBackground variant="practice">
        <div className="min-h-[100dvh] flex items-center justify-center">
          <div className="text-white/80 text-sm animate-pulse">Menyiapkan latihan…</div>
        </div>
      </TowerBackground>
    )
  }

  const options = [
    { key: 'A', text: gameState.question.optA },
    { key: 'B', text: gameState.question.optB },
    { key: 'C', text: gameState.question.optC },
    { key: 'D', text: gameState.question.optD },
  ]

  const progressPct = Math.min(100, Math.round(((gameState.floor - 1) / TOTAL_FLOORS) * 100))
  const cardGlow: 'cyan' | 'red' = showWrongFeedback ? 'red' : 'cyan'
  const diffStyle = DIFFICULTY_COLORS[gameState.currentDifficulty] || DIFFICULTY_COLORS[2]

  return (
    <TowerBackground variant="practice">
      {/* Red flash feedback on wrong answer */}
      <AnimatePresence>
        {showWrongFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at center, rgba(239,68,68,0.25) 0%, transparent 65%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── TOP HEADER ─────────────────────────────────────────────── */}
      <header className="relative z-30 w-full px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-uni-primary to-uni-accent flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.4)]">
              <span className="text-white font-bold text-lg leading-none">U</span>
            </div>
            <span className="text-white font-bold text-xl tracking-wide hidden sm:block">
              Unimath
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Difficulty badge */}
            <motion.div
              key={gameState.currentDifficulty}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-2.5 py-1 rounded-full ${diffStyle.bg} border ${diffStyle.border} backdrop-blur-md`}
            >
              <span className={`${diffStyle.text} font-bold text-xs tracking-wide`}>
                ⚡ {diffStyle.label}
              </span>
            </motion.div>

            {/* Floor badge */}
            <motion.div
              key={gameState.floor}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-3 py-1.5 rounded-full bg-[rgba(7,17,36,0.75)] border border-cyan-400/60 backdrop-blur-md shadow-[0_0_18px_-4px_rgba(6,182,212,0.7)]"
            >
              <span className="text-cyan-300 font-bold text-xs sm:text-sm tracking-wide">
                🏢 Lantai {gameState.floor}
              </span>
            </motion.div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 mx-auto max-w-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs text-white/60 uppercase tracking-[0.15em]">
              Progress
            </span>
            <span className="text-[10px] sm:text-xs text-cyan-300 font-semibold">
              {progressPct}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-black/50 border border-cyan-500/20 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ boxShadow: '0 0 12px rgba(6,182,212,0.7)' }}
            />
          </div>
        </div>
      </header>

      {/* ── QUESTION CARD ──────────────────────────────────────────── */}
      <section className="relative z-20 flex-1 flex items-start sm:items-center justify-center px-4 pt-6 pb-40">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            x: showWrongFeedback ? [-6, 6, -4, 4, 0] : 0,
          }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* ── HINT BANNER (from previous wrong question) ─────── */}
          <AnimatePresence>
            {gameState.previousHint && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-3"
              >
                <div className="flex gap-2 items-start p-3 rounded-xl border border-amber-400/50 bg-amber-500/10 backdrop-blur-sm">
                  <span className="text-lg">💡</span>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-amber-300/80 font-semibold mb-1">
                      Petunjuk dari soal sebelumnya
                    </p>
                    <p className="text-sm text-slate-100/90 leading-snug">
                      {gameState.previousHint}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setGameState((prev) => (prev ? { ...prev, previousHint: null } : null))
                    }
                    className="text-amber-300/60 hover:text-white text-xs mt-0.5"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <GlassCard glowColor={cardGlow} intensity="strong" className="p-5 sm:p-6">
            {/* Material label */}
            <p className="text-center text-[11px] sm:text-xs text-cyan-200/70 uppercase tracking-[0.2em] mb-3">
              {gameState.materialName}
            </p>

            {/* Question */}
            <h2 className="text-center text-base sm:text-lg md:text-xl font-semibold text-white leading-relaxed mb-5">
              {gameState.question.question}
            </h2>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
              {options.map((opt) => {
                const selected = gameState.selectedAnswer === opt.key
                return (
                  <motion.button
                    key={opt.key}
                    onClick={() => handleSelectAnswer(opt.key)}
                    disabled={gameState.isSubmitting}
                    whileTap={!gameState.isSubmitting ? { scale: 0.97 } : undefined}
                    className={[
                      'group relative py-2.5 px-4 rounded-xl text-left text-sm sm:text-[15px] font-medium transition-all duration-200 border backdrop-blur-sm',
                      selected
                        ? 'bg-cyan-400/20 border-cyan-300 text-white shadow-[0_0_22px_-4px_rgba(6,182,212,0.9)]'
                        : 'bg-black/40 border-cyan-500/25 text-slate-100 hover:border-cyan-400/70 hover:bg-cyan-500/10',
                      gameState.isSubmitting && 'opacity-60 cursor-not-allowed',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'inline-flex items-center justify-center w-6 h-6 rounded-md mr-2 text-xs font-bold transition-colors',
                        selected
                          ? 'bg-cyan-300 text-slate-900'
                          : 'bg-cyan-500/15 text-cyan-300 group-hover:bg-cyan-400/25',
                      ].join(' ')}
                    >
                      {opt.key}
                    </span>
                    {opt.text}
                  </motion.button>
                )
              })}
            </div>

            {/* Consecutive wrong indicator */}
            {gameState.consecutiveWrong > 0 && (
              <div className="flex items-center justify-center gap-1 mb-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i <= gameState.consecutiveWrong
                        ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]'
                        : 'bg-slate-600/50'
                    }`}
                  />
                ))}
                <span className="text-[10px] text-red-300/70 ml-1.5">
                  {gameState.consecutiveWrong}/3 salah berturut
                </span>
              </div>
            )}

            {/* Submit */}
            <motion.button
              onClick={handleSubmitAnswer}
              disabled={!gameState.selectedAnswer || gameState.isSubmitting}
              whileTap={
                gameState.selectedAnswer && !gameState.isSubmitting
                  ? { scale: 0.98 }
                  : undefined
              }
              className={[
                'w-full py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300',
                gameState.selectedAnswer && !gameState.isSubmitting
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 shadow-[0_0_24px_-4px_rgba(16,185,129,0.7)] hover:shadow-[0_0_32px_-4px_rgba(16,185,129,0.9)]'
                  : 'bg-slate-700/40 text-slate-400 cursor-not-allowed',
              ].join(' ')}
            >
              {gameState.isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memeriksa…
                </span>
              ) : (
                'Kirim Jawaban'
              )}
            </motion.button>
          </GlassCard>
        </motion.div>
      </section>

      {/* ── BOTTOM STATUS BAR ──────────────────────────────────────── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-md pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-[rgba(7,17,36,0.8)] border border-cyan-400/40 backdrop-blur-md shadow-[0_0_24px_-8px_rgba(6,182,212,0.8)]">
          <span className="text-cyan-300 text-lg">✨</span>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-white/60 mb-0.5">
              <span>XP · Lantai</span>
              <span className="text-cyan-300">
                {gameState.stats.correctAnswers} / {gameState.floor}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-black/60 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(
                    100,
                    (gameState.stats.correctAnswers /
                      Math.max(1, gameState.stats.totalAttempts)) *
                      100
                  )}%`,
                }}
                transition={{ duration: 0.6 }}
                style={{ boxShadow: '0 0 8px rgba(6,182,212,0.7)' }}
              />
            </div>
          </div>
          <button
            onClick={handleEndSession}
            className="ml-1 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-900 bg-gradient-to-r from-teal-300 to-cyan-300 shadow-[0_0_12px_-2px_rgba(6,182,212,0.7)] active:scale-95 transition"
            title="Udah dulu latihan hari ini"
          >
            Selesai
          </button>
        </div>
      </div>

      {/* ── CORRECT MODAL ───────────────────────────────────────────── */}
      <AnimatePresence>
        {gameState.showCorrectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-full max-w-xs sm:max-w-sm"
            >
              <GlassCard glowColor="emerald" intensity="strong" className="p-6 sm:p-8 text-center">
                <motion.div
                  className="text-5xl sm:text-7xl mb-3"
                  animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6 }}
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl sm:text-3xl font-bold text-emerald-300 mb-2">
                  Benar!
                </h2>
                <p className="text-white text-sm sm:text-base font-medium">
                  Naik ke lantai{' '}
                  <span className="text-cyan-300 font-bold">{gameState.floor + 1}</span>! 🚀
                </p>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── WAJIB BELAJAR MODAL (no escape!) ─────────────────────── */}
      <AnimatePresence>
        {gameState.showMustStudyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-xs sm:max-w-sm"
            >
              <GlassCard glowColor="amber" intensity="strong" className="p-5 sm:p-7 text-center">
                <div className="text-5xl sm:text-6xl mb-3">📚</div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                  Wajib Belajar!
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm mb-1">
                  Kamu sudah salah menjawab <span className="text-red-300 font-bold">3 kali berturut-turut</span>.
                </p>
                <p className="text-slate-400 text-xs mb-1">
                  Yuk, pelajari materi dulu sebelum melanjutkan latihan.
                </p>
                <p className="text-cyan-300 font-semibold mb-5 text-sm sm:text-base">
                  📖 {gameState.materialName}
                </p>
                <motion.button
                  onClick={() =>
                    router.push(`/student/materials/${gameState.materialId}`)
                  }
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-900 shadow-[0_0_18px_-3px_rgba(6,182,212,0.7)]"
                >
                  📖 Pelajari Materi Sekarang
                </motion.button>
                {/* NO "coba lagi nanti" button — this is mandatory */}
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TowerBackground>
  )
}
