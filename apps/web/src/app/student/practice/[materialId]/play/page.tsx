'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useAuth } from '@/lib/auth/context'
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

    const sessionData = sessionStorage.getItem('practiceSession')
    if (sessionData) {
      const data = JSON.parse(sessionData)
      setGameState({
        sessionId: data.sessionId,
        floor: data.floor || 1,
        wrongCount: 0,
        question: data.question,
        materialId: data.materialId || materialId,
        materialName: data.materialName || 'Matematika',
        selectedAnswer: null,
        showCorrectModal: false,
        showWrongModal: false,
        isSubmitting: false,
        stats: { floorsClimbed: 0, correctAnswers: 0, totalAttempts: 0 },
      })
    } else {
      router.push(`/student/practice/${materialId}/start`)
    }
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
    sessionStorage.setItem('practiceStats', JSON.stringify(gameState.stats))
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
    <main className="relative w-full h-[100dvh] overflow-hidden bg-[#0a0e1a]">
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

      {/* Stars Background - Reduced for mobile performance */}
      <div className="absolute inset-0">
        {[...Array(60)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Meteors - Hidden on mobile for performance */}
      <div className="hidden sm:block">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`meteor-${i}`}
            className="absolute w-[2px] h-24 bg-gradient-to-b from-cyan-400/80 to-transparent"
            style={{
              left: `${10 + i * 20}%`,
              top: '-100px',
              transform: 'rotate(-45deg)',
            }}
            animate={{ y: [0, 600], x: [0, 300], opacity: [0.9, 0] }}
            transition={{
              duration: 2.5 + i * 0.3,
              repeat: Infinity,
              delay: i * 2,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Logo - Smaller on mobile */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-30">
        <h1 className="text-lg sm:text-2xl font-black text-white tracking-wider">
          UN<span className="text-cyan-400">i</span>MATH
        </h1>
      </div>

      {/* Floor Badge - Top right on mobile */}
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-30">
        <motion.div
          key={gameState.floor}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-cyan-500/20 border border-cyan-400/50"
        >
          <span className="text-cyan-400 font-bold text-sm sm:text-base">🏢 Lantai {gameState.floor}</span>
        </motion.div>
      </div>

      {/* Tower Building - Simplified for mobile, full on desktop */}
      <div className="absolute inset-0 flex items-end justify-center pb-32 sm:pb-40 pointer-events-none">
        <div className="relative w-full max-w-md h-[40%] sm:h-[50%]">
          {/* Center Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 sm:w-72 sm:h-72 bg-cyan-500/10 rounded-full blur-3xl" />

          {/* Simplified Tower - Mobile optimized */}
          <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '800px' }}>
            {/* Left Panel */}
            <div
              className="absolute left-[10%] sm:left-[5%] top-0 w-[25%] h-full opacity-60 sm:opacity-100"
              style={{
                background: 'linear-gradient(to right, rgba(6,182,212,0.02), rgba(6,182,212,0.08))',
                transform: 'rotateY(25deg)',
                transformOrigin: 'right center',
                borderRight: '2px solid rgba(6,182,212,0.5)',
              }}
            />

            {/* Right Panel */}
            <div
              className="absolute right-[10%] sm:right-[5%] top-0 w-[25%] h-full opacity-60 sm:opacity-100"
              style={{
                background: 'linear-gradient(to left, rgba(6,182,212,0.02), rgba(6,182,212,0.08))',
                transform: 'rotateY(-25deg)',
                transformOrigin: 'left center',
                borderLeft: '2px solid rgba(6,182,212,0.5)',
              }}
            />

            {/* Center Stairs */}
            <motion.div
              className="absolute left-[35%] right-[35%] top-0 bottom-0"
              animate={{ y: robotState === 'climbing' ? 30 : 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <svg viewBox="0 0 100 200" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
                <defs>
                  <linearGradient id="stairGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="1" />
                    <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="1" />
                  </linearGradient>
                </defs>
                {[...Array(8)].map((_, i) => {
                  const y = 190 - i * 22
                  const isLeft = i % 2 === 0
                  return (
                    <g key={i}>
                      <line
                        x1={isLeft ? 10 : 50}
                        y1={y}
                        x2={isLeft ? 50 : 90}
                        y2={y}
                        stroke="url(#stairGlow)"
                        strokeWidth="3"
                        filter="drop-shadow(0 0 4px rgba(6,182,212,0.8))"
                      />
                      {i < 7 && (
                        <line
                          x1={50}
                          y1={y}
                          x2={isLeft ? 90 : 10}
                          y2={y - 22}
                          stroke="url(#stairGlow)"
                          strokeWidth="2"
                          opacity="0.6"
                        />
                      )}
                    </g>
                  )
                })}
              </svg>
            </motion.div>

            {/* Vertical Neon Lines */}
            <div
              className="absolute left-[35%] top-0 bottom-0 w-[2px] sm:w-[3px]"
              style={{
                background: 'linear-gradient(to bottom, #06B6D4, rgba(6,182,212,0.3), #06B6D4)',
                boxShadow: '0 0 10px rgba(6,182,212,0.6)',
              }}
            />
            <div
              className="absolute right-[35%] top-0 bottom-0 w-[2px] sm:w-[3px]"
              style={{
                background: 'linear-gradient(to bottom, #06B6D4, rgba(6,182,212,0.3), #06B6D4)',
                boxShadow: '0 0 10px rgba(6,182,212,0.6)',
              }}
            />
          </div>
        </div>
      </div>


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


      {/* Floor Platform & Robot Area - Mobile optimized */}
      <div className="absolute bottom-0 left-0 right-0 h-32 sm:h-40 z-10">
        {/* Horizontal Neon Lines (Floor) */}
        <div className="absolute inset-x-0 top-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 sm:h-5 flex items-center">
              <div
                className="w-full h-[2px] sm:h-[3px]"
                style={{
                  background: 'linear-gradient(to right, transparent 5%, #06B6D4 20%, #22D3EE 50%, #06B6D4 80%, transparent 95%)',
                  boxShadow: '0 0 10px rgba(6,182,212,0.5)',
                }}
              />
            </div>
          ))}
        </div>

        {/* Robot Character - Smaller on mobile */}
        <motion.div
          className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2"
          animate={{
            y: robotState === 'climbing' ? -50 : robotState === 'celebrating' ? [-6, 6, -6] : 0,
          }}
          transition={{
            y:
              robotState === 'celebrating'
                ? { duration: 0.25, repeat: 3 }
                : { duration: 0.7, ease: 'easeOut' },
          }}
        >
          {/* Robot Glow */}
          <div className="absolute -inset-4 bg-cyan-400/20 rounded-full blur-xl" />

          {/* Robot Body - Scaled for mobile */}
          <div className="relative w-14 h-18 sm:w-18 sm:h-22 flex flex-col items-center scale-75 sm:scale-100">
            {/* Head */}
            <motion.div
              className="relative w-12 h-10 bg-gradient-to-b from-slate-400 to-slate-600 rounded-t-full border-2 border-cyan-400/70"
              animate={robotState === 'celebrating' ? { rotate: [-8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              {/* Visor/Eyes */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute top-0.5 left-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#06B6D4]"
                  animate={robotState === 'celebrating' ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3, repeat: robotState === 'celebrating' ? 3 : 0 }}
                />
                <motion.div 
                  className="absolute top-0.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#06B6D4]"
                  animate={robotState === 'celebrating' ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3, repeat: robotState === 'celebrating' ? 3 : 0 }}
                />
              </div>
              {/* Antenna */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-slate-500">
                <motion.div
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full"
                  animate={{ 
                    opacity: [1, 0.4, 1], 
                    scale: robotState === 'celebrating' ? [1, 1.5, 1] : 1,
                    boxShadow: ['0 0 8px #06B6D4', '0 0 16px #06B6D4', '0 0 8px #06B6D4'] 
                  }}
                  transition={{ duration: robotState === 'celebrating' ? 0.3 : 1.5, repeat: Infinity }}
                />
              </div>
            </motion.div>

            {/* Body */}
            <div className="relative w-10 h-6 bg-gradient-to-b from-slate-400 to-slate-600 rounded-lg border-2 border-cyan-400/70 mt-0.5">
              <motion.div
                className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 rounded-sm"
                animate={{
                  boxShadow:
                    robotState === 'celebrating'
                      ? ['0 0 8px #06B6D4', '0 0 20px #06B6D4', '0 0 8px #06B6D4']
                      : '0 0 8px #06B6D4',
                }}
                transition={{ duration: 0.2, repeat: robotState === 'celebrating' ? Infinity : 0 }}
              />
            </div>

            {/* Wheels/Tracks */}
            <div className="flex gap-1.5 mt-0.5">
              <motion.div
                className="w-4 h-2 bg-slate-700 rounded-full border border-cyan-400/50"
                animate={robotState === 'climbing' ? { rotate: 720 } : {}}
                transition={{ duration: 0.7, ease: 'linear' }}
              />
              <motion.div
                className="w-4 h-2 bg-slate-700 rounded-full border border-cyan-400/50"
                animate={robotState === 'climbing' ? { rotate: 720 } : {}}
                transition={{ duration: 0.7, ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
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
