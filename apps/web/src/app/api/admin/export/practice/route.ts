import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, classes, classStudents, practiceSessions, practiceAttempts, questions, materials } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  const t = await validateToken(token)
  if (!t.valid || t.role !== 'ADMIN') return null
  return t
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Mudah',
  2: 'Sedang',
  3: 'Sulit',
}

function escapeCsv(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""'
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return `"${s}"`
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const url = new URL(request.url)
    const studentIdFilter = url.searchParams.get('studentId') || null
    const materialIdFilter = url.searchParams.get('materialId') || null

    // ── Step 1: Ambil kelas per siswa (hanya satu kelas — DISTINCT dengan LIMIT 1 per siswa)
    // Ini mencegah baris duplikat saat satu siswa terdaftar di banyak kelas
    const studentClassRows = await db
      .select({
        studentUserId: classStudents.studentUserId,
        className: classes.name,
      })
      .from(classStudents)
      .innerJoin(classes, eq(classStudents.classId, classes.id))

    // Buat map: studentId -> className (hanya kelas pertama)
    const classMap: Record<string, string> = {}
    for (const r of studentClassRows) {
      if (!classMap[r.studentUserId]) {
        classMap[r.studentUserId] = r.className
      }
    }

    // ── Step 2: Ambil semua attempt TANPA join classStudents (cegah duplikat)
    const attempts = await db
      .select({
        // Identitas siswa
        studentId: users.id,
        studentName: users.name,
        nisn: users.nisn,
        // Session info
        sessionId: practiceSessions.id,
        materialId: practiceSessions.materialId,
        materialTitle: materials.title,
        sessionStatus: practiceSessions.status,
        sessionFloorReached: practiceSessions.floor,
        sessionStartedAt: practiceSessions.startedAt,
        sessionEndedAt: practiceSessions.endedAt,
        // Attempt detail
        attemptId: practiceAttempts.id,
        attemptFloor: practiceAttempts.floor,
        questionId: practiceAttempts.questionId,
        questionIndicator: questions.indicator,
        questionDifficulty: questions.difficulty,
        questionType: questions.questionType,
        difficultyAtAnswer: practiceAttempts.difficultyAtAnswer,
        answer: practiceAttempts.answer,
        isCorrect: practiceAttempts.isCorrect,
        xpAwarded: practiceAttempts.xpAwarded,
        hintCountAtAnswer: practiceAttempts.hintCountAtAnswer,
        isRemedialSession: practiceAttempts.isRemedialSession,
        responseMs: practiceAttempts.responseMs,
        attemptCreatedAt: practiceAttempts.createdAt,
      })
      .from(practiceAttempts)
      .innerJoin(practiceSessions, eq(practiceAttempts.sessionId, practiceSessions.id))
      .innerJoin(users, eq(practiceSessions.studentUserId, users.id))
      .innerJoin(questions, eq(practiceAttempts.questionId, questions.id))
      .innerJoin(materials, eq(practiceSessions.materialId, materials.id))

    // Apply filters
    const filtered = attempts.filter(a => {
      if (studentIdFilter && a.studentId !== studentIdFilter) return false
      if (materialIdFilter && a.materialId !== materialIdFilter) return false
      return true
    })

    // ── Step 3: Hitung summary per session
    const sessionSummaryMap: Record<string, {
      totalAttempts: number
      correctAttempts: number
      totalXP: number
    }> = {}

    for (const a of filtered) {
      if (!sessionSummaryMap[a.sessionId]) {
        sessionSummaryMap[a.sessionId] = { totalAttempts: 0, correctAttempts: 0, totalXP: 0 }
      }
      sessionSummaryMap[a.sessionId].totalAttempts++
      if (a.isCorrect) sessionSummaryMap[a.sessionId].correctAttempts++
      sessionSummaryMap[a.sessionId].totalXP += (a.xpAwarded || 0)
    }

    // ── Step 4: Generate CSV dengan BOM UTF-8
    const BOM = '\uFEFF'

    const headers = [
      // Identitas
      'Student ID',
      'Nama Siswa',
      'NISN',
      'Kelas',
      // Session
      'Session ID',
      'ID Materi',
      'Judul Materi',
      'Status Session',
      'Lantai Tertinggi',
      'Waktu Mulai Session',
      'Waktu Selesai Session',
      // Summary per session
      'Total Attempt (Session)',
      'Jawaban Benar (Session)',
      'Akurasi Session (%)',
      'Total XP (Session)',
      // Per attempt
      'Attempt ID',
      'Lantai Saat Attempt',
      'ID Soal',
      'Tipe Soal',
      'Indikator',
      'Tingkat Kesulitan Soal',
      'Label Kesulitan',
      'Kesulitan Saat Jawab',
      'Jawaban Siswa',
      'Benar?',
      'XP Didapat',
      'Jumlah Hint Terlihat',
      'Sesi Remedial?',
      'Waktu Respons (ms)',
      'Waktu Attempt',
    ]

    const csvRows = [BOM + headers.join(',')]

    filtered.forEach(r => {
      const summary = sessionSummaryMap[r.sessionId]
      const accuracy = summary.totalAttempts > 0
        ? Math.round((summary.correctAttempts / summary.totalAttempts) * 100)
        : 0

      // Lookup kelas dari map — tidak ada duplikat baris
      const className = classMap[r.studentId] || '-'

      const row = [
        escapeCsv(r.studentId),
        escapeCsv(r.studentName),
        escapeCsv(r.nisn),
        escapeCsv(className),
        escapeCsv(r.sessionId),
        escapeCsv(r.materialId),
        escapeCsv(r.materialTitle),
        escapeCsv(r.sessionStatus),
        r.sessionFloorReached,
        escapeCsv(r.sessionStartedAt),
        escapeCsv(r.sessionEndedAt || ''),
        summary.totalAttempts,
        summary.correctAttempts,
        accuracy,
        summary.totalXP,
        escapeCsv(r.attemptId),
        r.attemptFloor,
        escapeCsv(r.questionId),
        escapeCsv(r.questionType || 'PG'),
        escapeCsv(r.questionIndicator),
        r.questionDifficulty,
        escapeCsv(DIFFICULTY_LABELS[r.questionDifficulty] || 'Sedang'),
        r.difficultyAtAnswer || 0,
        escapeCsv(r.answer),
        r.isCorrect ? '1' : '0',
        r.xpAwarded || 0,
        r.hintCountAtAnswer || 0,
        r.isRemedialSession ? '1' : '0',
        r.responseMs || 0,
        escapeCsv(r.attemptCreatedAt),
      ]
      csvRows.push(row.join(','))
    })

    const now = new Date().toISOString().slice(0, 10)
    return new NextResponse(csvRows.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=rekap_latihan_${now}.csv`,
      },
    })
  } catch (error) {
    console.error('Export practice error:', error)
    return NextResponse.json({ error: 'Gagal mengekspor data latihan' }, { status: 500 })
  }
}
