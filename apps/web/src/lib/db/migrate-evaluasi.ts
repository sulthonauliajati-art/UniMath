/**
 * Migrasi Data Evaluasi — Wipe & Import
 *
 * TAHAP 1: Hapus bersih seluruh test_sessions & test_attempts
 *          untuk PRETEST & POSTTEST (tidak menyentuh practice).
 * TAHAP 2: Parse data_evaluasi_lengkap.csv & import ke DB.
 * TAHAP 3: Verifikasi integritas (count check).
 *
 * Usage: npx tsx src/lib/db/migrate-evaluasi.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'
import { eq, inArray, sql } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'

const { testSessions, testAttempts, practiceSessions, questions, users } = schema

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

const db = drizzle(client, { schema })

/* ─── Konstanta ────────────────────────────────────────────────── */

const CSV_PATH = path.resolve(process.cwd(), '..', '..', 'data_evaluasi_lengkap.csv')

/* ─── Parse CSV (RFC-4180 sederhana) ──────────────────────────── */

function parseCSV(text: string): string[][] {
  const records: string[][] = []
  let current = ''
  let inQuotes = false
  let fields: string[] = []

  const chars = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    const nextChar = chars[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') { current += '"'; i++ }
        else { inQuotes = false }
      } else { current += char }
    } else {
      if (char === '"') { inQuotes = true }
      else if (char === ',') { fields.push(current.trim()); current = '' }
      else if (char === '\n') {
        fields.push(current.trim())
        if (fields.length > 1 || fields[0] !== '') records.push(fields)
        fields = []
        current = ''
      } else { current += char }
    }
  }
  if (current || fields.length > 0) { fields.push(current.trim()); if (fields.length > 1) records.push(fields) }
  return records
}

/* ─── MAIN ─────────────────────────────────────────────────────── */

async function main() {
  console.log('═══ MIGRASI DATA EVALUASI ═══\n')

  /* ═══════════════════════════════════════════════════════════
   * TAHAP 1: WIPE DATA LAMA
   * ═══════════════════════════════════════════════════════════ */
  console.log('📌 TAHAP 1: Menghapus data evaluasi lama…')

  // 1a. Cari semua session ID evaluasi (PRETEST & POSTTEST)
  const oldSessions = await db
    .select({ id: testSessions.id })
    .from(testSessions)
    .where(
      inArray(testSessions.testType, ['PRETEST', 'POSTTEST'])
    )

  const oldSessionIds = oldSessions.map((s) => s.id)
  console.log(`   Ditemukan ${oldSessionIds.length} sesi evaluasi lama.`)

  if (oldSessionIds.length > 0) {
    // 1b. Hapus test_attempts dulu (FK constraint)
    const deletedAttempts = await db
      .delete(testAttempts)
      .where(inArray(testAttempts.sessionId, oldSessionIds))
    console.log(`   🗑️  test_attempts: ${deletedAttempts.rowsAffected} baris dihapus.`)

    // 1c. Hapus test_sessions
    const deletedSessions = await db
      .delete(testSessions)
      .where(inArray(testSessions.testType, ['PRETEST', 'POSTTEST']))
    console.log(`   🗑️  test_sessions: ${deletedSessions.rowsAffected} baris dihapus.`)
  }

  // Verifikasi bersih
  const [remaining] = await db
    .select({ count: sql<number>`count(*)` })
    .from(testSessions)
  console.log(`   ✅ Sesi tersisa di DB: ${remaining.count} (harus hanya practice)\n`)

  /* ═══════════════════════════════════════════════════════════
   * TAHAP 2: IMPORT DATA BARU
   * ═══════════════════════════════════════════════════════════ */
  console.log('📌 TAHAP 2: Import data dari CSV…')

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ File tidak ditemukan: ${CSV_PATH}`)
    process.exit(1)
  }

  const csvText = fs.readFileSync(CSV_PATH, 'utf-8')
  const records = parseCSV(csvText)

  if (records.length < 2) {
    console.error('❌ CSV kosong atau hanya header.')
    process.exit(1)
  }

  const header = records[0]
  console.log(`   Header CSV: ${header.length} kolom`)

  const dataRows = records.slice(1).filter((row) => row.length >= 19)
  console.log(`   Data rows: ${dataRows.length} baris`)

  // ── Ekstrak unique sessions ──────────────────────────────────
  interface SessionRow {
    id: string
    studentUserId: string
    materialId: string
    testType: 'PRETEST' | 'POSTTEST'
    startedAt: string
    completedAt: string | null
  }

  const sessionMap = new Map<string, SessionRow>()
  const attemptRows: Array<{
    id: string
    sessionId: string
    questionId: string
    answer: string
    isCorrect: boolean
    responseMs: number | null
    createdAt: string
  }> = []

  for (const row of dataRows) {
    const sessionId = row[6]
    if (!sessionId) continue

    if (!sessionMap.has(sessionId)) {
      const startedAt = row[8] || ''
      const completedAtRaw = row[9] || ''
      const completedAt =
        completedAtRaw && completedAtRaw !== 'null' && completedAtRaw !== 'NULL'
          ? completedAtRaw
          : null

      sessionMap.set(sessionId, {
        id: sessionId,
        studentUserId: row[0],
        materialId: row[4] || 'M1A',
        testType: (row[7] === 'POSTTEST' ? 'POSTTEST' : 'PRETEST') as 'PRETEST' | 'POSTTEST',
        startedAt,
        completedAt,
      })
    }

    const answer = row[16] || ''
    const isCorrectRaw = row[17] || '0'
    const responseMsRaw = parseInt(row[18], 10)
    const createdAt = row[19] || row[8] || new Date().toISOString()

    attemptRows.push({
      id: row[15],
      sessionId,
      questionId: row[10],
      answer,
      isCorrect: isCorrectRaw === '1',
      responseMs: isNaN(responseMsRaw) ? null : responseMsRaw,
      createdAt,
    })
  }

  console.log(`   Unique sessions: ${sessionMap.size}`)
  console.log(`   Attempt rows: ${attemptRows.length}`)

  // ── Compute pairOrdinal & floorAtCompletion ──────────────────

  const floorRows = await db
    .select({
      studentUserId: practiceSessions.studentUserId,
      maxFloor: sql<number>`COALESCE(MAX(floor), 1)`,
    })
    .from(practiceSessions)
    .where(
      inArray(
        practiceSessions.studentUserId,
        [...new Set([...sessionMap.values()].map((s) => s.studentUserId))]
      )
    )
    .groupBy(practiceSessions.studentUserId)
  const studentFloorMap = new Map<string, number>()
  for (const r of floorRows) {
    studentFloorMap.set(r.studentUserId, r.maxFloor)
  }

  // Group sessions by studentUserId + testType
  const sessionsByStudent = new Map<string, SessionRow[]>()
  for (const [, session] of sessionMap) {
    const key = `${session.studentUserId}::${session.testType}`
    if (!sessionsByStudent.has(key)) sessionsByStudent.set(key, [])
    sessionsByStudent.get(key)!.push(session)
  }

  const sessionInserts: Array<typeof testSessions.$inferInsert> = []

  for (const [, sessions] of sessionsByStudent) {
    sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    const studentUserId = sessions[0].studentUserId
    const currentFloor = studentFloorMap.get(studentUserId) || 1

    sessions.forEach((session, idx) => {
      const pairOrdinal = idx + 1

      let floorAtCompletion: number | null = null
      if (session.completedAt) {
        if (session.testType === 'PRETEST') {
          floorAtCompletion = 10 + (pairOrdinal - 1) * 5
        } else {
          floorAtCompletion = currentFloor
        }
      }

      sessionInserts.push({
        id: session.id,
        studentUserId: session.studentUserId,
        materialId: session.materialId,
        testType: session.testType,
        pairOrdinal,
        floorAtCompletion,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      })
    })
  }

  // ── Validasi FK ───────────────────────────────────────────────
  const allQuestionIds = await db
    .select({ id: questions.id })
    .from(questions)
  const validQuestionIds = new Set(allQuestionIds.map((q) => q.id))

  const allUserIds = await db
    .select({ id: users.id })
    .from(users)
  const validUserIds = new Set(allUserIds.map((u) => u.id))

  const validAttempts = attemptRows.filter((a) => {
    if (!validQuestionIds.has(a.questionId)) {
      console.warn(`   ⚠️  Skip attempt ${a.id}: questionId "${a.questionId}" tidak ditemukan di DB`)
      return false
    }
    return true
  })

  const validSessions = sessionInserts.filter((s) => {
    if (!validUserIds.has(s.studentUserId)) {
      console.warn(`   ⚠️  Skip session ${s.id}: studentUserId "${s.studentUserId}" tidak ditemukan di DB`)
      return false
    }
    return true
  })

  console.log(`   Valid sessions: ${validSessions.length} (${sessionInserts.length - validSessions.length} skipped)`)
  console.log(`   Valid attempts: ${validAttempts.length} (${attemptRows.length - validAttempts.length} skipped)`)

  // ── Insert dalam batch ────────────────────────────────────────
  if (validSessions.length > 0) {
    const batchSize = 25
    for (let i = 0; i < validSessions.length; i += batchSize) {
      const batch = validSessions.slice(i, i + batchSize)
      await db.insert(testSessions).values(batch)
    }
    console.log(`   ✅ ${validSessions.length} test_sessions di-insert.`)
  }

  if (validAttempts.length > 0) {
    const batchSize = 50
    for (let i = 0; i < validAttempts.length; i += batchSize) {
      const batch = validAttempts.slice(i, i + batchSize)
      await db.insert(testAttempts).values(batch)
    }
    console.log(`   ✅ ${validAttempts.length} test_attempts di-insert.`)
  }

  /* ═══════════════════════════════════════════════════════════
   * TAHAP 3: VERIFIKASI INTEGRITAS
   * ═══════════════════════════════════════════════════════════ */
  console.log('\n📌 TAHAP 3: Verifikasi integritas…')

  const [pretestCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(testSessions)
    .where(eq(testSessions.testType, 'PRETEST'))

  const [posttestCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(testSessions)
    .where(eq(testSessions.testType, 'POSTTEST'))

  const evalSessions = await db
    .select({ id: testSessions.id })
    .from(testSessions)
    .where(inArray(testSessions.testType, ['PRETEST', 'POSTTEST']))
  const evalSessionIds = evalSessions.map((s) => s.id)

  let attemptCountVal = 0
  if (evalSessionIds.length > 0) {
    const [ac] = await db
      .select({ count: sql<number>`count(*)` })
      .from(testAttempts)
      .where(inArray(testAttempts.sessionId, evalSessionIds))
    attemptCountVal = ac?.count || 0
  }

  console.log('\n   📊 Breakdown per siswa:')
  const studentSessions = await db
    .select({
      studentUserId: testSessions.studentUserId,
      testType: testSessions.testType,
      count: sql<number>`count(*)`,
    })
    .from(testSessions)
    .where(inArray(testSessions.testType, ['PRETEST', 'POSTTEST']))
    .groupBy(testSessions.studentUserId, testSessions.testType)
    .orderBy(testSessions.studentUserId)

  let currentStudent = ''
  let pretestSessions = 0
  let posttestSessions = 0
  for (const row of studentSessions) {
    if (row.studentUserId !== currentStudent) {
      if (currentStudent) {
        console.log(`      ${currentStudent}: ${pretestSessions} PRETEST + ${posttestSessions} POSTTEST`)
      }
      currentStudent = row.studentUserId
      pretestSessions = 0
      posttestSessions = 0
    }
    if (row.testType === 'PRETEST') pretestSessions = row.count
    if (row.testType === 'POSTTEST') posttestSessions = row.count
  }
  if (currentStudent) {
    console.log(`      ${currentStudent}: ${pretestSessions} PRETEST + ${posttestSessions} POSTTEST`)
  }

  console.log(`\n   ┌─────────────────────────────┐`)
  console.log(`   │ PRETEST sessions:  ${String(pretestCount?.count || 0).padStart(5)}       │`)
  console.log(`   │ POSTTEST sessions: ${String(posttestCount?.count || 0).padStart(5)}       │`)
  console.log(`   │ Evaluation attempts: ${String(attemptCountVal).padStart(3)}      │`)
  console.log(`   └─────────────────────────────┘`)

  console.log('\n✅ Migrasi selesai!')
}

main().catch((err) => {
  console.error('❌ Fatal:', err)
  process.exit(1)
})
