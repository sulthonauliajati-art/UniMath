'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { StarryBackground, TowerBackground, RobotMascot } from '@/components/ui'
import { Question } from '@/lib/types'

interface QuestionWithHints extends Question {
  difficultyLabel?: string
  hint1?: string
  hint2?: string
  hint3?: string
}

interface GameState {
  sessionId: string
  floor: number
  wrongCount: number
  question: QuestionWithHints
  materialId: string
  materialName: string
  selectedAnswer: string | null
  showCorrectModal: boolean
  showWrongModal: boolean
  isSubmitting: boolean
  stats: { floorsClimbed: number; correctAnswers: number; totalAttempts: number }
}

export default function GamePlayPage() {
  const params = useParams()
  const materialId = params.materialId as string
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [robotState, setRobotState] = useState<'idle' | 'climbing' | 'celebrating'>('idle')
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
          wrongCount: data.wrongCount || 0,
          question: data.question,
          materialId: data.materialId || materialId,
          materialName: data.materialName || 'Matematika',
          selectedAnswer: null,
          showCorrectModal: false,
          showWrongModal: false,
          isSubmitting: false,
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
              wrongCount: data.wrongCount,
              question: data.question,
              materialId: data.materialId,
              materialName: data.materialName,
              selectedAnswer: null,
              showCorrectModal: false,
              showWrongModal: false,
              isSubmitting: false,
              stats: data.stats,
            })
          } else {
            router.push(`/student/practice/${materialId}/start`)
          }
        } catch (error) {
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
        setRobotState('celebrating')
        fireConfetti()

        setGameState((prev) =>
          prev
            ? {
                ...prev,
                showCorrectModal: true,
                isSubmitting: false,
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
                      wrongCount: 0,
                      question: data.nextQuestion,
                      selectedAnswer: null,
                      showCorrectModal: false,
                    }
                  : null
              )
            } else {
              handleEndSession()
            }
          }, 800)
        }, 1500)
      } else {
        // Show wrong feedback animation
        setShowWrongFeedback(true)
        setTimeout(() => setShowWrongFeedback(false), 600)
        
        if (data.mustStudy) {
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
                  wrongCount: data.wrongCount,
                  selectedAnswer: null,
                  isSubmitting: false,
                  showWrongModal: true,
                  stats: { ...prev.stats, totalAttempts: prev.stats.totalAttempts + 1 },
                }
              : null
          )
        } else {
          setGameState((prev) => {
            if (!prev) return null
            const updatedQuestion = { ...prev.question }
            if (data.wrongCount >= 1 && data.hint) {
              if (data.wrongCount === 1) updatedQuestion.hint1 = data.hint
              else if (data.wrongCount === 2) updatedQuestion.hint2 = data.hint
              else if (data.wrongCount === 3) updatedQuestion.hint3 = data.hint
            }
            return {
              ...prev,
              wrongCount: data.wrongCount,
              question: updatedQuestion,
              selectedAnswer: null,
              isSubmitting: false,
              showWrongModal: false,
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
    // P1 Fix: Include materialId and materialTitle for better feedback on complete page
    sessionStorage.setItem('practiceStats', JSON.stringify({
      ...gameState.stats,
      materialId: gameState.materialId,
      materialTitle: gameState.materialName,
    }))
    sessionStorage.removeItem('practiceSession')
    router.push('/student/practice/complete')
  }

  if (isLoading || !user || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const options = [
    { key: 'A', text: gameState.question.optA },
    { key: 'B', text: gameState.question.optB },
    { key: 'C', text: gameState.question.optC },
    { key: 'D', text: gameState.question.optD },
  ]


  return (
    <main className="relative w-full h-[100dvh] overflow-hidden bg-uni-bg pb-24">
      {/* Wrong Answer Shake Effect */}
      <AnimatePresence>
        {showWrongFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)' }}
          />
        )}
      </AnimatePresence>

      <StarryBackground density="high" />
      <TowerBackground variant="practice" />

      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-30 flex justify-between items-center pointer-events-none">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-uni-primary to-uni-accent flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.3)]">
            <span className="text-white font-bold text-lg leading-none">U</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide hidden sm:block">Unimath</span>
        </div>

        {/* Right: Floor Badge */}
        <motion.div
          key={gameState.floor}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-uni-bg-secondary/80 border border-uni-primary/50 shadow-[0_0_15px_rgba(0,229,255,0.3)] backdrop-blur-md"
        >
          <span className="text-uni-primary font-bold text-sm sm:text-base tracking-wide">🏢 Lantai {gameState.floor}</span>
        </motion.div>
      </div>

      {/* Stars Background - Reduced for mobile performance */}
      <div className="absolute inset-0">



      {/* Question Card - Mobile First Design */}
      <div className="absolute inset-x-0 top-12 sm:top-16 bottom-36 sm:bottom-44 flex items-start justify-center z-20 px-3 sm:px-4 pt-2 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            x: showWrongFeedback ? [-5, 5, -5, 5, 0] : 0
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md p-4 sm:p-5 rounded-2xl"
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(20px)',
            border: showWrongFeedback ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(6, 182, 212, 0.3)',
            boxShadow: showWrongFeedback 
              ? '0 0 30px rgba(239,68,68,0.3)' 
              : '0 0 40px -15px rgba(6,182,212,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Material Info - Compact */}
          <div className="text-center mb-2">
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              {gameState.materialName}
            </p>
          </div>

          {/* Question Text */}
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-cyan-300 text-center leading-relaxed mb-4">
            {gameState.question.question}
          </h2>

          {/* Answer Options - Stack on mobile, 2x2 on larger */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
            {options.map((opt) => (
              <motion.button
                key={opt.key}
                onClick={() => handleSelectAnswer(opt.key)}
                disabled={gameState.isSubmitting}
                className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-full text-left sm:text-center font-medium transition-all duration-200 border-2 text-sm sm:text-base ${
                  gameState.selectedAnswer === opt.key
                    ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                    : 'bg-slate-800/50 border-slate-600/50 text-slate-200 active:bg-cyan-500/20 active:border-cyan-400'
                } ${gameState.isSubmitting ? 'opacity-50' : ''}`}
                whileTap={!gameState.isSubmitting ? { scale: 0.98 } : undefined}
              >
                <span className="font-bold text-cyan-400 mr-2">{opt.key}.</span>
                {opt.text}
              </motion.button>
            ))}
          </div>

          {/* Hints Section - Compact */}
          <AnimatePresence>
            {gameState.wrongCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 space-y-1.5"
              >
                {gameState.wrongCount >= 1 && gameState.question.hint1 && (
                  <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs sm:text-sm">
                    <span className="text-yellow-400 font-semibold">💡 </span>
                    <span className="text-slate-200">{gameState.question.hint1}</span>
                  </div>
                )}
                {gameState.wrongCount >= 2 && gameState.question.hint2 && (
                  <div className="p-2.5 bg-orange-500/10 border border-orange-500/30 rounded-lg text-xs sm:text-sm">
                    <span className="text-orange-400 font-semibold">💡 </span>
                    <span className="text-slate-200">{gameState.question.hint2}</span>
                  </div>
                )}
                {gameState.wrongCount >= 3 && gameState.question.hint3 && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs sm:text-sm">
                    <span className="text-red-400 font-semibold">💡 </span>
                    <span className="text-slate-200">{gameState.question.hint3}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            onClick={handleSubmitAnswer}
            disabled={!gameState.selectedAnswer || gameState.isSubmitting}
            className={`w-full py-3 rounded-xl sm:rounded-full font-bold text-base sm:text-lg transition-all duration-300 ${
              gameState.selectedAnswer && !gameState.isSubmitting
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-900 shadow-lg shadow-emerald-500/30 active:shadow-emerald-500/50'
                : 'bg-slate-700/50 text-slate-500'
            }`}
            whileTap={gameState.selectedAnswer && !gameState.isSubmitting ? { scale: 0.98 } : undefined}
          >
            {gameState.isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memeriksa...
              </span>
            ) : 'Kirim Jawaban'}
          </motion.button>
        </motion.div>
      </div>


      {/* Robot Mascot Area */}
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <RobotMascot state={robotState} size="xl" />
      </div>


      {/* Exit Button - Bottom left on mobile */}
      <motion.button
        onClick={handleEndSession}
        className="fixed bottom-3 left-3 sm:bottom-6 sm:left-auto sm:right-6 z-30 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold shadow-lg transition-all text-sm sm:text-base"
        style={{
          background: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
          color: '#0f172a',
          boxShadow: '0 0 15px rgba(20,184,166,0.4)',
        }}
        whileTap={{ scale: 0.95 }}
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        <span className="hidden sm:inline">Udah dulu</span>
        <span className="sm:hidden">Selesai</span>
      </motion.button>

      {/* Correct Answer Modal - Mobile optimized */}
      <AnimatePresence>
        {gameState.showCorrectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 15 }}
              className="p-6 sm:p-8 text-center w-full max-w-xs sm:max-w-sm rounded-2xl sm:rounded-3xl"
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(16, 185, 129, 0.5)',
                boxShadow: '0 0 60px rgba(16,185,129,0.4)',
              }}
            >
              <motion.div
                className="text-5xl sm:text-7xl mb-3"
                animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6 }}
              >
                🎉
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-2">Benar!</h2>
              <p className="text-white text-base sm:text-lg font-medium">
                Naik ke lantai <span className="text-cyan-400 font-bold">{gameState.floor + 1}</span>! 🚀
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Must Study Modal - Mobile optimized */}
      <AnimatePresence>
        {gameState.showWrongModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="p-5 sm:p-8 text-center w-full max-w-xs sm:max-w-sm rounded-2xl sm:rounded-3xl"
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(249, 115, 22, 0.5)',
                boxShadow: '0 0 50px rgba(249,115,22,0.3)',
              }}
            >
              <div className="text-5xl sm:text-6xl mb-3">📚</div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Yuk belajar dulu!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mb-2">Kamu sudah mencoba 4 kali di soal ini.</p>
              <p className="text-cyan-400 font-semibold mb-4 sm:mb-6 text-sm sm:text-base">📖 {gameState.materialName}</p>
              <div className="space-y-2">
                <motion.button
                  onClick={() => router.push(`/student/materials/${gameState.materialId}`)}
                  className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-full font-bold shadow-lg text-sm sm:text-base"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #14b8a6)',
                    color: '#0f172a',
                    boxShadow: '0 0 15px rgba(6,182,212,0.4)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  📖 Pelajari Materi
                </motion.button>
                <button
                  onClick={() => setGameState(prev => prev ? { ...prev, showWrongModal: false } : null)}
                  className="w-full py-2 text-slate-400 text-xs sm:text-sm hover:text-white transition-colors"
                >
                  Coba lagi nanti
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS for twinkle animation */}
      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </main>
  )
}
