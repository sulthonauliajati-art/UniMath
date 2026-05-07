'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Question } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { StarryBackground } from '@/components/ui/StarryBackground'

interface StrictTestClientProps {
  materialId: string
  materialTitle: string
  testType: 'PRETEST' | 'POSTTEST'
}

export default function StrictTestClient({
  materialId,
  materialTitle,
  testType,
}: StrictTestClientProps) {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Timer states
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(60 * 60) // 60 minutes in seconds
  const [isTestFinished, setIsTestFinished] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  
  const answerTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Test
  useEffect(() => {
    let mounted = true
    const initTest = async () => {
      try {
        const res = await fetch('/api/test/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materialId, testType }),
        })
        const data = await res.json()

        if (!res.ok) {
          if (data.error?.message === 'TEST_ALREADY_COMPLETED') {
            setIsTestFinished(true)
            setLoading(false)
            return
          }
          throw new Error(data.error?.message || 'Gagal memulai tes')
        }

        if (mounted) {
          setSessionId(data.sessionId)
          setQuestions(data.questions)
          setAnsweredIds(new Set(data.answeredQuestionIds || []))
          setStartedAt(data.startedAt)
          setLoading(false)
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    initTest()

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (answerTimeoutRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      mounted = false
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [materialId, testType])

  // Timer logic
  useEffect(() => {
    if (loading || isTestFinished || error || !startedAt) return

    const timer = setInterval(() => {
      const startTime = new Date(startedAt).getTime()
      const now = Date.now()
      const passedSeconds = Math.floor((now - startTime) / 1000)
      const remaining = 60 * 60 - passedSeconds

      setTimeLeft((prev) => {
        if (remaining <= 0) {
          clearInterval(timer)
          handleAutoFinish()
          return 0
        }
        return remaining
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, isTestFinished, error, startedAt])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const saveAnswer = async (qId: string, ans: string) => {
    if (!sessionId) return
    setSaveStatus('saving')
    try {
      await fetch('/api/test/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: qId,
          answer: ans,
        }),
      })
      setSaveStatus('saved')
      setAnsweredIds((prev) => new Set(prev).add(qId))
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to save answer', err)
      setSaveStatus('idle')
    }
  }

  const handleAnswerChange = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
    
    // Auto save with debounce for text
    const q = questions.find((x) => x.id === qId)
    if (q?.questionType === 'URAIAN') {
      setSaveStatus('saving')
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current)
      answerTimeoutRef.current = setTimeout(() => {
        saveAnswer(qId, value)
      }, 1000)
    } else {
      // PG saves immediately
      saveAnswer(qId, value)
    }
  }

  const handleNavigate = (newIndex: number) => {
    // Flush if there's a pending save for Uraian
    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current)
      answerTimeoutRef.current = null
      const currentQ = questions[currentIndex]
      const currentAns = answers[currentQ.id]
      if (currentAns && !answeredIds.has(currentQ.id)) {
        saveAnswer(currentQ.id, currentAns)
      }
    }
    setCurrentIndex(newIndex)
  }

  const handleFinishTest = async () => {
    if (!confirm('Apakah Anda yakin ingin mengakhiri tes? Jawaban tidak dapat diubah lagi.')) return
    
    // Flush current
    const currentQ = questions[currentIndex]
    const currentAns = answers[currentQ.id]
    if (currentAns && currentQ.questionType === 'URAIAN') {
      await saveAnswer(currentQ.id, currentAns)
    }

    await finishSession()
  }

  const handleAutoFinish = async () => {
    alert('Waktu habis! Tes akan diselesaikan secara otomatis.')
    // Flush current
    const currentQ = questions[currentIndex]
    if (currentQ) {
      const currentAns = answers[currentQ.id]
      if (currentAns && currentQ.questionType === 'URAIAN') {
        await saveAnswer(currentQ.id, currentAns)
      }
    }
    await finishSession()
  }

  const finishSession = async () => {
    try {
      await fetch('/api/test/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      setIsTestFinished(true)
    } catch (err) {
      console.error('Failed to finish', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
        <StarryBackground />
        <div className="relative z-10 text-white text-xl">Memuat Tes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
        <StarryBackground />
        <GlassCard className="p-8 text-center max-w-md relative z-10">
          <h2 className="text-2xl text-red-400 font-bold mb-4">Terjadi Kesalahan</h2>
          <p className="text-white mb-6">{error}</p>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="px-6 py-2 bg-uni-primary rounded-xl text-white font-semibold"
          >
            Kembali ke Dasbor
          </button>
        </GlassCard>
      </div>
    )
  }

  if (isTestFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
        <StarryBackground />
        <GlassCard className="p-8 text-center max-w-md relative z-10">
          <h2 className="text-2xl text-green-400 font-bold mb-4">Tes Selesai</h2>
          <p className="text-white mb-6">Jawaban Anda telah tersimpan dengan aman.</p>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="px-6 py-2 bg-uni-primary rounded-xl text-white font-semibold"
          >
            Kembali ke Dasbor
          </button>
        </GlassCard>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
        <StarryBackground />
        <div className="relative z-10 text-white text-xl">Tidak ada soal untuk tes ini.</div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      <StarryBackground />

      {/* Strict Header */}
      <header className="relative z-10 glass-strong border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white">
              {testType} - {materialTitle}
            </h1>
            <p className="text-sm text-text-secondary">Mode Penelitian</p>
          </div>
          
          <div className="flex items-center gap-4">
            {saveStatus !== 'idle' && (
              <span className="text-sm text-text-secondary">
                {saveStatus === 'saving' ? 'Menyimpan...' : 'Tersimpan ✓'}
              </span>
            )}
            
            <div className={`px-4 py-2 rounded-lg font-mono text-lg font-bold ${
              timeLeft <= 60 ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' 
              : timeLeft <= 300 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
              : timeLeft <= 600 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
              : 'glass text-white'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-[1fr_250px] gap-6">
        
        {/* Question Area */}
        <div className="space-y-6">
          <GlassCard className="p-6 md:p-8">
            <div className="mb-6 flex justify-between items-center">
              <span className="text-sm font-semibold text-uni-accent">
                Soal {currentIndex + 1} dari {questions.length}
              </span>
            </div>
            
            <h2 className="text-xl md:text-2xl text-white mb-8 whitespace-pre-wrap leading-relaxed">
              {currentQuestion.question}
            </h2>

            {currentQuestion.questionType === 'URAIAN' ? (
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Ketik jawaban uraian Anda di sini..."
                className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-uni-primary transition-colors resize-none"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const val = currentQuestion[`opt${opt}` as keyof Question] as string
                  if (!val) return null
                  const isSelected = answers[currentQuestion.id] === opt || (answeredIds.has(currentQuestion.id) && answers[currentQuestion.id] === opt) // Actually answeredIds just tracks if it was saved.
                  // Wait, if it's already answered in previous session, the API doesn't return the exact answer they picked! 
                  // For MVP, we'll just track current session answers.
                  
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswerChange(currentQuestion.id, opt)}
                      className={`text-left p-4 rounded-xl transition-all border ${
                        isSelected 
                          ? 'bg-uni-primary/20 border-uni-primary text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' 
                          : 'glass-strong border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="font-bold mr-3">{opt}.</span> {val}
                    </button>
                  )
                })}
              </div>
            )}
          </GlassCard>

          <div className="flex justify-between">
            <button
              onClick={() => handleNavigate(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-6 py-3 glass-strong rounded-xl text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
            >
              ← Sebelumnya
            </button>
            
            {isLastQuestion ? (
              <button
                onClick={handleFinishTest}
                className="px-8 py-3 bg-red-500/80 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg"
              >
                Selesai Tes
              </button>
            ) : (
              <button
                onClick={() => handleNavigate(Math.min(questions.length - 1, currentIndex + 1))}
                className="px-6 py-3 bg-uni-primary hover:bg-indigo-500 text-white rounded-xl transition-all"
              >
                Selanjutnya →
              </button>
            )}
          </div>
        </div>

        {/* Navigation Sidebar */}
        <div className="hidden md:block">
          <GlassCard className="p-4 sticky top-6">
            <h3 className="text-white font-semibold mb-4 text-center">Navigasi Soal</h3>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answeredIds.has(q.id) || answers[q.id]
                const isCurrent = currentIndex === idx
                return (
                  <button
                    key={q.id}
                    onClick={() => handleNavigate(idx)}
                    className={`aspect-square rounded-lg flex items-center justify-center font-semibold transition-all ${
                      isCurrent
                        ? 'bg-white text-black scale-110 shadow-lg'
                        : isAnswered
                        ? 'bg-uni-primary/40 text-white border border-uni-primary/50'
                        : 'glass-strong text-text-secondary hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
            <div className="mt-8">
               <button
                onClick={handleFinishTest}
                className="w-full py-3 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-200 rounded-xl transition-all"
              >
                Akhiri Ujian
              </button>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  )
}
