'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground, GlassCard } from '@/components/ui'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface HistoryEntry {
  sesi: number
  pretest: {
    sessionId: string; startedAt: string; completedAt: string | null
    score: number | null; floorAtCompletion: number | null
  } | null
  posttest: {
    sessionId: string; startedAt: string; completedAt: string | null
    score: number | null; floorAtCompletion: number | null
  } | null
}

interface EvaluasiData {
  currentFloor: number; pretestUnlocked: boolean; pretestCompleted: boolean
  posttestUnlocked: boolean; floorsRemaining: number; deltaFloor: number
  deltaRequired: number; pretestFloor: number
  nextPairOrdinal: number; history: HistoryEntry[]
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function EvaluasiPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [data, setData] = useState<EvaluasiData | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [starting, setStarting] = useState<'pretest' | 'posttest' | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) router.push('/student/login')
  }, [user, isLoading, router])

  useEffect(() => { if (token) fetchData() }, [token])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/student/evaluasi', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setData(await res.json())
    } catch { /* silent */ }
    finally { setLoadingData(false) }
  }

  const handleStart = async (testType: 'PRETEST' | 'POSTTEST') => {
    setStarting(testType === 'PRETEST' ? 'pretest' : 'posttest')
    setErrorMsg(null)
    try {
      const materialId = 'M1A'
      const res = await fetch('/api/test/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId, testType }),
      })
      const json = await res.json()
      if (!res.ok) { setErrorMsg(json.error?.message || 'Gagal memulai tes'); setStarting(null); return }
      router.push(`/student/test/${materialId}/${testType}`)
    } catch { setErrorMsg('Gagal terhubung ke server'); setStarting(null) }
  }

  if (isLoading || !user) return <LoadingScreen />

  return (
    <main className="relative min-h-screen bg-uni-bg overflow-hidden">
      <StarryBackground density="high" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <Link href="/student/dashboard" className="text-text-secondary hover:text-white text-sm">← Dashboard</Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white">📝 Ujian Evaluasi</h1>
          <div className="w-16" />
        </div>

        {loadingData ? (
          <div className="text-center py-12 text-text-secondary animate-pulse">Memuat data…</div>
        ) : !data ? (
          <GlassCard className="p-8 text-center"><p className="text-text-secondary">Gagal memuat data.</p></GlassCard>
        ) : (
          <>
            {/* ═══ SECTION 1: Action Ujian ═══ */}
            <section className="mb-8">
              <h2 className="text-sm uppercase tracking-[0.2em] text-cyan-300/70 font-semibold mb-4">⚡ Action Ujian</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pre-test — always unlocked */}
                <GlassCard className="p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-xl">📝</div>
                    <div><h3 className="text-white font-bold">Pre-test</h3><p className="text-xs text-text-secondary">Uji pemahaman awal</p></div>
                  </div>
                  <p className="text-xs text-slate-400 mb-4 flex-1">
                    Selalu terbuka. {data.history.length > 0 ? `Sesi ke-${data.nextPairOrdinal}` : 'Sesi pertama'}.
                  </p>
                  <button onClick={() => handleStart('PRETEST')} disabled={starting === 'pretest'}
                    className="w-full py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 shadow-[0_0_16px_-4px_rgba(16,185,129,0.6)] hover:shadow-[0_0_24px_-4px_rgba(16,185,129,0.9)] transition-all disabled:opacity-50">
                    {starting === 'pretest' ? 'Memulai…' : 'Mulai Pre-test'}
                  </button>
                </GlassCard>

                {/* Post-test — delta +25 lock (3 kondisi jelas) */}
                <GlassCard className={`p-5 flex flex-col ${data.posttestUnlocked ? 'border border-emerald-400/30 shadow-[0_0_16px_-6px_rgba(16,185,129,0.25)]' : ''}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      data.posttestUnlocked
                        ? 'bg-emerald-500/20 border border-emerald-400/30'
                        : data.pretestCompleted
                          ? 'bg-amber-500/15 border border-amber-400/25'
                          : 'bg-slate-700/40 border border-slate-600/30'
                    }`}>
                      {data.posttestUnlocked ? '✅' : '🔒'}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Post-test</h3>
                      <p className="text-xs text-text-secondary">Evaluasi akhir</p>
                    </div>
                  </div>

                  {/* ═══ KONDISI A: Pre-test belum selesai ═══ */}
                  {!data.pretestCompleted && (
                    <div className="mb-4 flex-1 space-y-2">
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-500/5 border border-slate-500/10">
                        <span className="text-base shrink-0 mt-0.5">🔒</span>
                        <div>
                          <p className="text-xs font-semibold text-slate-400">Wajib selesaikan Pre-test terlebih dahulu.</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">Kamu belum menyelesaikan Pre-test. Ambil Pre-test dulu untuk membuka akses Post-test.</p>
                        </div>
                      </div>
                      {/* Progress bar 0% — informatif, tidak menyesatkan */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-600">
                          <span>Progres delta lantai</span>
                          <span>0 / {data.deltaRequired} (0%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-700/30 overflow-hidden">
                          <div className="h-full rounded-full bg-slate-600/40 transition-all" style={{ width: '0%' }} />
                        </div>
                        <p className="text-[10px] text-slate-600 italic">ⓘ Selesaikan Pre-test untuk melihat progres.</p>
                      </div>
                    </div>
                  )}

                  {/* ═══ KONDISI B: Pre-test selesai, delta < 25 ═══ */}
                  {data.pretestCompleted && !data.posttestUnlocked && (
                    <div className="mb-4 flex-1 space-y-2">
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                        <span className="text-base shrink-0 mt-0.5">🔒</span>
                        <div>
                          <p className="text-xs font-semibold text-amber-300">
                            Latih <b className="text-white">{data.floorsRemaining}</b> lantai lagi untuk membuka.
                          </p>
                          <p className="text-[10px] text-amber-500/70 mt-0.5">
                            Naikkan {data.floorsRemaining} lantai lagi di mode Latihan untuk membuka Post-test.
                          </p>
                        </div>
                      </div>
                      {/* Progress bar dinamis */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Progres delta lantai</span>
                          <span className="text-amber-300">+{data.deltaFloor} / +{data.deltaRequired} ({Math.min(100, Math.round((data.deltaFloor / data.deltaRequired) * 100))}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-cyan-400 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.round((data.deltaFloor / data.deltaRequired) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═══ KONDISI C: Siap dikerjakan (delta >= 25) ═══ */}
                  {data.posttestUnlocked && (
                    <div className="mb-4 flex-1 space-y-2">
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
                        <span className="text-base shrink-0 mt-0.5">✅</span>
                        <div>
                          <p className="text-xs font-semibold text-emerald-300">Siap dievaluasi!</p>
                          <p className="text-[10px] text-emerald-500/70 mt-0.5">
                            Kamu sudah naik +{data.deltaFloor} lantai sejak Pre-test. Post-test siap dikerjakan.
                          </p>
                        </div>
                      </div>
                      {/* Progress bar 100% */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Progres delta lantai</span>
                          <span className="text-emerald-400">+{Math.min(data.deltaFloor, data.deltaRequired)} / +{data.deltaRequired} (100%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: '100%' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <button onClick={() => handleStart('POSTTEST')} disabled={!data.posttestUnlocked || starting === 'posttest'}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                      data.posttestUnlocked
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-[0_0_16px_-4px_rgba(6,182,212,0.6)] hover:shadow-[0_0_24px_-4px_rgba(6,182,212,0.9)] hover:scale-[1.02]'
                        : 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
                    } disabled:opacity-60`}>
                    {starting === 'posttest' ? 'Memulai…' : data.posttestUnlocked ? '🚀 Mulai Post-test' : data.pretestCompleted ? '🔒 Terkunci' : '🔒 Selesaikan Pre-test Dulu'}
                  </button>
                </GlassCard>
              </div>
              {errorMsg && <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-400/30 text-red-300 text-sm text-center">⚠️ {errorMsg}</div>}
            </section>

            {/* ═══ SECTION 2: Riwayat Evaluasi ═══ */}
            <section>
              <h2 className="text-sm uppercase tracking-[0.2em] text-cyan-300/70 font-semibold mb-4">📋 Riwayat Evaluasi</h2>
              {data.history.length === 0 ? (
                <GlassCard className="p-6 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-text-secondary text-sm">Belum ada riwayat evaluasi.</p>
                  <p className="text-text-muted text-xs mt-1">Ambil Pre-test pertamamu!</p>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {data.history.map((entry, i) => (
                    <motion.div key={entry.sesi} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.3) }}>
                      <GlassCard className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold border border-cyan-400/20">Sesi {entry.sesi}</span>
                          {entry.pretest?.completedAt && entry.posttest?.completedAt && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">✅ Lengkap</span>}
                          {entry.pretest?.completedAt && !entry.posttest?.completedAt && <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">⏳ Menunggu Post-test</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-2.5 rounded-lg bg-slate-800/40">
                            <p className="text-cyan-300 font-semibold mb-1.5">📝 Pre-test</p>
                            {entry.pretest ? (<>
                              <Row label="Tanggal" value={formatDate(entry.pretest.completedAt)} />
                              <Row label="Skor" value={entry.pretest.score !== null ? `${entry.pretest.score}%` : '—'} bold />
                              <Row label="Lantai" value={String(entry.pretest.floorAtCompletion || '—')} />
                            </>) : <p className="text-slate-500">Tidak ada data</p>}
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-800/40">
                            <p className="text-cyan-300 font-semibold mb-1.5">✅ Post-test</p>
                            {entry.posttest ? (
                              entry.posttest.completedAt ? (<>
                                <Row label="Tanggal" value={formatDate(entry.posttest.completedAt)} />
                                <Row label="Skor" value={entry.posttest.score !== null ? `${entry.posttest.score}%` : '—'} bold />
                                <Row label="Lantai" value={String(entry.posttest.floorAtCompletion || '—')} />
                              </>) : <p className="text-amber-400 text-xs">Belum dikerjakan</p>
                            ) : <p className="text-slate-500 text-xs">Belum tersedia</p>}
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-slate-400 mb-0.5">
      <span>{label}</span>
      <span className={bold ? 'font-bold text-white' : 'text-white'}>{value}</span>
    </div>
  )
}
