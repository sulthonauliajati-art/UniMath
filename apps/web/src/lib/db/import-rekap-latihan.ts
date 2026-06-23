/**
 * import-rekap-latihan.ts
 *
 * Data Seeding & Migration — Wipe old practice data + import new CSV.
 * Usage: npx tsx src/lib/db/import-rekap-latihan.ts
 */

import dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'
import { eq } from 'drizzle-orm'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})
const db = drizzle(client, { schema })

// ─── CSV Parser ───────────────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const clean = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = clean.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const header = parseCSVLine(lines[0])
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue
    const row: Record<string, string> = {}
    header.forEach((h, idx) => { row[h.trim()] = (values[idx] || '').trim() })
    rows.push(row)
  }
  return rows
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') { if (line[i + 1] === '"') { current += '"'; i++ } else { inQuotes = false } }
      else { current += ch }
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { fields.push(current); current = '' }
      else current += ch
    }
  }
  fields.push(current)
  return fields
}

// ─── Helpers ──────────────────────────────────────────────────────
const safeInt = (v: string | undefined, fb = 0) => { const n = parseInt(v || '', 10); return isNaN(n) ? fb : n }
const safeBool = (v: string | undefined) => v === '1' || v?.toLowerCase() === 'true'
const safeDate = (v: string | undefined) => (!v || v.trim() === '') ? null : v

// ─── WIPE ─────────────────────────────────────────────────────────
async function wipeOldData() {
  console.log('\n🧹 WIPE: Menghapus semua data practice lama...')
  const aCount = (await db.select().from(schema.practiceAttempts).all()).length
  const sCount = (await db.select().from(schema.practiceSessions).all()).length
  console.log(`   practice_attempts: ${aCount} rows`)
  console.log(`   practice_sessions: ${sCount} rows`)

  await db.delete(schema.practiceAttempts)
  console.log('   ✅ practice_attempts terhapus')
  await db.delete(schema.practiceSessions)
  console.log('   ✅ practice_sessions terhapus')

  // Reset totalPoints
  const students = await db.select().from(schema.users).where(eq(schema.users.role, 'STUDENT')).all()
  for (const u of students) {
    await db.update(schema.users).set({ totalPoints: 0 }).where(eq(schema.users.id, u.id))
  }
  console.log(`   ✅ ${students.length} student users totalPoints di-reset`)
  console.log('🧹 WIPE selesai.\n')
}

// ─── IMPORT ───────────────────────────────────────────────────────
async function importCSV(filePath: string, label: string) {
  console.log(`📥 IMPORT ${label}: ${path.basename(filePath)}`)

  const raw = fs.readFileSync(filePath, 'utf-8')
  const rows = parseCSV(raw)
  console.log(`   ${rows.length} baris CSV`)

  const { users, practiceSessions, practiceAttempts, questions } = schema

  // Phase 1: Ensure all users exist
  const userIds = new Set(rows.map(r => r['Student ID']).filter(Boolean))
  console.log(`   ${userIds.size} unique students`)
  for (const uid of userIds) {
    const existing = await db.select().from(users).where(eq(users.id, uid)).limit(1)
    if (existing.length === 0) {
      await db.insert(users).values({
        id: uid,
        role: 'STUDENT',
        name: rows.find(r => r['Student ID'] === uid)?.['Nama Siswa'] || 'Siswa',
        nisn: rows.find(r => r['Student ID'] === uid)?.['NISN'] || null,
        passwordStatus: 'UNSET',
        totalPoints: 0,
        createdAt: new Date().toISOString(),
      })
    }
  }
  console.log('   ✅ Users OK')

  // Phase 2: Ensure all question IDs exist (insert placeholders if missing)
  const questionIds = new Set(rows.map(r => r['ID Soal']).filter(Boolean))
  const existingQ = new Set(
    (await db.select({ id: questions.id }).from(questions).all()).map(q => q.id)
  )
  let placeholderCount = 0
  for (const qid of questionIds) {
    if (!existingQ.has(qid)) {
      await db.insert(questions).values({
        id: qid,
        materialId: qid.substring(0, 3), // e.g. M1A from M1A-F01-SD-V01
        mode: 'PRACTICE',
        indicator: 'I1',
        difficulty: 1,
        question: `[Placeholder] ${qid}`,
        optA: 'A', optB: 'B', optC: 'C', optD: 'D', optE: '',
        correct: 'A',
      }).catch(() => {}) // race condition if another batch inserts same ID
      placeholderCount++
    }
  }
  if (placeholderCount > 0) console.log(`   📝 ${placeholderCount} placeholder questions inserted`)

  // Phase 3: Deduplicate sessions & insert
  const sessionMap = new Map<string, typeof practiceSessions.$inferInsert>()
  for (const row of rows) {
    const sid = row['Session ID']
    if (!sid || sessionMap.has(sid)) continue
    sessionMap.set(sid, {
      id: sid,
      studentUserId: row['Student ID'],
      materialId: row['ID Materi'],
      floor: safeInt(row['Lantai Tertinggi'], 1),
      consecutiveWrong: 0,
      currentDifficulty: safeInt(row['Kesulitan Saat Jawab'], 2),
      currentStreak: 0,
      currentQuestionId: null,
      startedAt: safeDate(row['Waktu Mulai Session']) || new Date().toISOString(),
      endedAt: safeDate(row['Waktu Selesai Session']),
      status: row['Status Session'] as any || 'COMPLETED',
    })
  }

  let sessionOk = 0, sessionFail = 0
  for (const s of sessionMap.values()) {
    try {
      await db.insert(practiceSessions).values(s)
      sessionOk++
    } catch { sessionFail++ }
  }
  console.log(`   ✅ ${sessionOk} sessions inserted` + (sessionFail > 0 ? ` (${sessionFail} failed)` : ''))

  // Phase 4: Insert attempts
  const attempts = rows.map(row => ({
    id: row['Attempt ID'],
    sessionId: row['Session ID'],
    floor: safeInt(row['Lantai Saat Attempt'], 1),
    questionId: row['ID Soal'] || 'UNKNOWN',
    answer: (row['Jawaban Siswa'] || 'A') as 'A' | 'B' | 'C' | 'D' | 'E',
    isCorrect: safeBool(row['Benar?']),
    xpAwarded: safeInt(row['XP Didapat']),
    hintCountAtAnswer: safeInt(row['Jumlah Hint Terlihat']),
    difficultyAtAnswer: safeInt(row['Kesulitan Saat Jawab'], 2),
    isRemedialSession: safeBool(row['Sesi Remedial?']),
    responseMs: safeInt(row['Waktu Respons (ms)']),
    createdAt: safeDate(row['Waktu Attempt']) || new Date().toISOString(),
  }))

  let attemptOk = 0, attemptFail = 0
  for (const a of attempts) {
    try {
      await db.insert(practiceAttempts).values(a)
      attemptOk++
    } catch (err: any) {
      attemptFail++
      if (attemptFail <= 3) console.log(`   ⚠️  Attempt FK fail: ${err.message?.substring(0, 100)}`)
    }
  }
  console.log(`   ✅ ${attemptOk} attempts inserted` + (attemptFail > 0 ? ` (${attemptFail} failed)` : ''))

  // Phase 5: Recalculate totalPoints
  for (const uid of userIds) {
    const result = await client.execute({
      sql: `SELECT COALESCE(SUM(pa.xp_awarded), 0) as total FROM practice_attempts pa INNER JOIN practice_sessions ps ON pa.session_id = ps.id WHERE ps.student_user_id = ?`,
      args: [uid],
    })
    const total = Number((result.rows[0] as any)?.total || 0)
    await db.update(users).set({ totalPoints: total }).where(eq(users.id, uid))
  }
  console.log('   ✅ totalPoints recalculated')

  console.log(`✅ ${label} selesai.\n`)
}

// ─── VERIFY ───────────────────────────────────────────────────────
async function verifyData() {
  console.log('🔍 VERIFIKASI INTEGRITAS DATA:\n')
  const sCount = (await db.select().from(schema.practiceSessions).all()).length
  const aCount = (await db.select().from(schema.practiceAttempts).all()).length
  const uCount = (await db.select().from(schema.users).where(eq(schema.users.role, 'STUDENT')).all()).length
  console.log(`   👤 Students : ${uCount}`)
  console.log(`   📋 Sessions : ${sCount}`)
  console.log(`   ✏️  Attempts : ${aCount}`)

  const orphans = await client.execute('SELECT COUNT(*) as cnt FROM practice_attempts pa LEFT JOIN practice_sessions ps ON pa.session_id = ps.id WHERE ps.id IS NULL')
  console.log(`   🔗 FK attempt→session: ${(orphans.rows[0] as any)?.cnt > 0 ? '❌ ORPHANS' : '✅ OK'}`)

  const orphans2 = await client.execute('SELECT COUNT(*) as cnt FROM practice_sessions ps LEFT JOIN users u ON ps.student_user_id = u.id WHERE u.id IS NULL')
  console.log(`   🔗 FK session→user   : ${(orphans2.rows[0] as any)?.cnt > 0 ? '❌ ORPHANS' : '✅ OK'}`)

  console.log('\n🔍 VERIFIKASI SELESAI.\n')
}

// ─── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(60))
  console.log('  UniMath — Data Migration: Rekap Latihan')
  console.log('═'.repeat(60))

  const rootDir = path.resolve(process.cwd(), '../../')
  const day1 = path.join(rootDir, 'rekap_latihan_hari1_09juni.csv')
  const day2 = path.join(rootDir, 'rekap_latihan_hari2_10juni.csv')

  console.log(`   Day 1: ${day1}`)
  console.log(`   Day 2: ${day2}`)

  if (!fs.existsSync(day1)) { console.error(`❌ ${day1}`); process.exit(1) }
  if (!fs.existsSync(day2)) { console.error(`❌ ${day2}`); process.exit(1) }

  await wipeOldData()
  await importCSV(day1, 'Hari 1 (09 Juni)')
  await importCSV(day2, 'Hari 2 (10 Juni)')
  await verifyData()

  console.log('═'.repeat(60))
  console.log('  ✅ MIGRASI SELESAI — Data siap digunakan.')
  console.log('═'.repeat(60))
}

main().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
