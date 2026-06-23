// @ts-nocheck
/**
 * import-full.ts — Full Rollback + Bank Soal Seeding + Rekap Import
 *
 * Usage: npx tsx src/lib/db/import-full.ts
 *
 * Steps:
 *   1. FULL WIPE: practice_attempts, practice_sessions, placeholder questions, reset points
 *   2. SEED BANK SOAL: Import real questions from bank-soal-final/
 *   3. IMPORT REKAP: rekap_latihan_day1_09juni.csv → rekap_latihan_day2_10juni.csv
 *   4. VERIFY: 0 placeholders, 0 FK violations
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

const ROOT = path.resolve(process.cwd(), '../../')
const BANK_SOAL_DIR = path.join(ROOT, 'bank-soal-final')

// ─── CSV Parser ───────────────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const clean = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = clean.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const header = parseCSVLine(lines[0])
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i])
    if (vals.length === 0) continue
    const row: Record<string, string> = {}
    header.forEach((h, idx) => { row[h.trim()] = (vals[idx] || '').trim() })
    rows.push(row)
  }
  return rows
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQ) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++ } else inQ = false }
      else cur += c
    } else {
      if (c === '"') inQ = true
      else if (c === ',') { fields.push(cur); cur = '' }
      else cur += c
    }
  }
  fields.push(cur)
  return fields
}

const si = (v: string | undefined, fb = 0) => { const n = parseInt(v || '', 10); return isNaN(n) ? fb : n }
const sb = (v: string | undefined) => v === '1' || v?.toLowerCase() === 'true'
const sd = (v: string | undefined) => (!v || v.trim() === '') ? null : v

function normDiff(v: string | undefined): number {
  if (!v) return 1
  const n = parseInt(v, 10); if (!isNaN(n)) return Math.max(1, Math.min(3, n))
  const u = v.toUpperCase(); if (u === 'MUDAH') return 1; if (u === 'SEDANG') return 2; if (u === 'SULIT') return 3
  return 1
}
function normIndicator(v: string | undefined): 'I1' | 'I2' | 'I3' | 'I4' {
  const u = (v || '').toUpperCase().trim(); return (['I1', 'I2', 'I3', 'I4'].includes(u) ? u : 'I1') as any
}
function normMode(v: string | undefined): 'PRACTICE' | 'PRETEST' | 'POSTTEST' | 'ALL' {
  const u = (v || '').toUpperCase().trim(); return (['PRACTICE', 'PRETEST', 'POSTTEST', 'ALL'].includes(u) ? u : 'PRACTICE') as any
}

let qidCounter = 0
function genQid(mat: string) { qidCounter++; return `${mat}-BANK-${qidCounter.toString().padStart(4, '0')}` }

// ─── TAHAP 1: FULL WIPE ──────────────────────────────────────────
async function fullWipe() {
  console.log('\n🧹 TAHAP 1: FULL WIPE')

  const ac = (await db.select().from(schema.practiceAttempts).all()).length
  const sc = (await db.select().from(schema.practiceSessions).all()).length
  console.log(`   practice_attempts: ${ac} | practice_sessions: ${sc}`)

  await db.delete(schema.practiceAttempts)
  await db.delete(schema.practiceSessions)
  console.log('   ✅ practice data wiped')

  // Delete ALL questions (including placeholders) — will be replaced by master file
  const allQ = (await db.select().from(schema.questions).all()).length
  await db.delete(schema.questions)
  console.log(`   ✅ ${allQ} questions deleted (full reset)`)

  // Reset points
  const students = await db.select().from(schema.users).where(eq(schema.users.role, 'STUDENT')).all()
  for (const u of students) await db.update(schema.users).set({ totalPoints: 0 }).where(eq(schema.users.id, u.id))
  console.log(`   ✅ ${students.length} students totalPoints → 0\n`)
}

// ─── TAHAP 2: SEED BANK SOAL ─────────────────────────────────────
async function seedBankSoal() {
  console.log('📚 TAHAP 2: SEEDING BANK SOAL')

  // HANYA gunakan SATU file master ini — abaikan 11 file CSV lainnya
  const masterFile = path.join(ROOT, 'unimath_soal_export_semua_2026-06-21_optE_lengkap.csv')

  if (!fs.existsSync(masterFile)) {
    console.error(`❌ Master soal file not found: ${masterFile}`)
    process.exit(1)
  }

  const rows = parseCSV(fs.readFileSync(masterFile, 'utf-8'))
  console.log(`   Source: ${path.basename(masterFile)} — ${rows.length} rows`)

  let inserted = 0
  for (const r of rows) {
    const qid = r['id'] || r['question_id']
    if (!qid) continue
    try {
      await db.insert(schema.questions).values({
        id: qid,
        materialId: r['materialId'] || r['material_id'] || 'M1A',
        mode: normMode(r['mode']),
        indicator: normIndicator(r['indicator']),
        difficulty: normDiff(r['difficulty']),
        questionType: (r['questionType'] || r['question_type'] || 'PG').toUpperCase() === 'URAIAN' ? 'URAIAN' : 'PG',
        question: r['question'] || r['question_text'] || '',
        optA: r['optA'] || r['opt_a'] || '',
        optB: r['optB'] || r['opt_b'] || '',
        optC: r['optC'] || r['opt_c'] || '',
        optD: r['optD'] || r['opt_d'] || '',
        optE: r['optE'] || r['opt_e'] || '',
        correct: r['correct'] || 'A',
        hint1: r['hint1'] || r['hint_1'] || null,
        hint2: r['hint2'] || r['hint_2'] || null,
        hint3: r['hint3'] || null,
        explanation: r['explanation'] || null,
        remedialMaterialId: r['remedialMaterialId'] || r['remedial_material_id'] || null,
      })
      inserted++
    } catch {
      // duplicate — skip
    }
  }

  const qc = (await db.select().from(schema.questions).all()).length
  console.log(`   ✅ ${inserted} questions from master file (total DB: ${qc})\n`)
}

// ─── TAHAP 3: IMPORT REKAP ───────────────────────────────────────
async function importRekap(filePath: string, label: string) {
  console.log(`📥 IMPORT ${label}: ${path.basename(filePath)}`)
  const rows = parseCSV(fs.readFileSync(filePath, 'utf-8'))
  console.log(`   ${rows.length} rows`)

  const { users, practiceSessions, practiceAttempts } = schema

  const userIds = new Set(rows.map(r => r['Student ID']).filter(Boolean))
  for (const uid of userIds) {
    const ex = await db.select().from(users).where(eq(users.id, uid)).limit(1)
    if (ex.length === 0) {
      const r = rows.find(x => x['Student ID'] === uid)
      await db.insert(users).values({
        id: uid, role: 'STUDENT', name: r?.['Nama Siswa'] || 'Siswa',
        nisn: r?.['NISN'] || null, passwordStatus: 'UNSET', totalPoints: 0,
        createdAt: new Date().toISOString(),
      })
    }
  }

  const sessionMap = new Map<string, typeof practiceSessions.$inferInsert>()
  for (const r of rows) {
    const sid = r['Session ID']; if (!sid || sessionMap.has(sid)) continue
    sessionMap.set(sid, {
      id: sid, studentUserId: r['Student ID'], materialId: r['ID Materi'],
      floor: si(r['Lantai Tertinggi'], 1), consecutiveWrong: 0,
      currentDifficulty: si(r['Kesulitan Saat Jawab'], 2), currentStreak: 0, currentQuestionId: null,
      startedAt: sd(r['Waktu Mulai Session']) || new Date().toISOString(),
      endedAt: sd(r['Waktu Selesai Session']),
      status: (r['Status Session'] || 'COMPLETED') as any,
    })
  }

  let sOk = 0; for (const s of sessionMap.values()) { try { await db.insert(practiceSessions).values(s); sOk++ } catch {} }

  const attempts = rows.map(r => ({
    id: r['Attempt ID'], sessionId: r['Session ID'], floor: si(r['Lantai Saat Attempt'], 1),
    questionId: r['ID Soal'] || 'UNKNOWN',
    answer: (r['Jawaban Siswa'] || 'A') as 'A'|'B'|'C'|'D'|'E',
    isCorrect: sb(r['Benar?']), xpAwarded: si(r['XP Didapat']),
    hintCountAtAnswer: si(r['Jumlah Hint Terlihat']),
    difficultyAtAnswer: si(r['Kesulitan Saat Jawab'], 2),
    isRemedialSession: sb(r['Sesi Remedial?']),
    responseMs: si(r['Waktu Respons (ms)']),
    createdAt: sd(r['Waktu Attempt']) || new Date().toISOString(),
  }))

  let aOk = 0, aFail = 0
  for (const a of attempts) { try { await db.insert(practiceAttempts).values(a); aOk++ } catch { aFail++ } }
  console.log(`   ${sOk} sessions | ${aOk} attempts` + (aFail > 0 ? ` (${aFail} FK fails)` : ''))

  for (const uid of userIds) {
    const r = await client.execute({ sql: 'SELECT COALESCE(SUM(pa.xp_awarded), 0) as t FROM practice_attempts pa INNER JOIN practice_sessions ps ON pa.session_id = ps.id WHERE ps.student_user_id = ?', args: [uid] })
    await db.update(users).set({ totalPoints: Number((r.rows[0] as any)?.t || 0) }).where(eq(users.id, uid))
  }
  console.log(`✅ ${label} complete.\n`)
}

// ─── TAHAP 4: VERIFY ─────────────────────────────────────────────
async function verify() {
  console.log('🔍 TAHAP 4: VERIFIKASI\n')
  const sc = (await db.select().from(schema.practiceSessions).all()).length
  const ac = (await db.select().from(schema.practiceAttempts).all()).length
  const qc = (await db.select().from(schema.questions).all()).length
  const uc = (await db.select().from(schema.users).where(eq(schema.users.role, 'STUDENT')).all()).length

  const ph = await client.execute("SELECT COUNT(*) as cnt FROM questions WHERE question LIKE '[Placeholder]%'")
  const fa = await client.execute('SELECT COUNT(*) as cnt FROM practice_attempts pa LEFT JOIN practice_sessions ps ON pa.session_id = ps.id WHERE ps.id IS NULL')
  const fs = await client.execute('SELECT COUNT(*) as cnt FROM practice_sessions ps LEFT JOIN users u ON ps.student_user_id = u.id WHERE u.id IS NULL')
  const fq = await client.execute('SELECT COUNT(*) as cnt FROM practice_attempts pa LEFT JOIN questions q ON pa.question_id = q.id WHERE q.id IS NULL')

  const pc = Number((ph.rows[0] as any)?.cnt || 0)
  const fc1 = Number((fa.rows[0] as any)?.cnt || 0)
  const fc2 = Number((fs.rows[0] as any)?.cnt || 0)
  const fc3 = Number((fq.rows[0] as any)?.cnt || 0)

  console.log(`   👤 Students           : ${uc}`)
  console.log(`   ❓ Questions           : ${qc}`)
  console.log(`   📋 Sessions            : ${sc}`)
  console.log(`   ✏️  Attempts            : ${ac}`)
  console.log(`   📝 Placeholder Qs      : ${pc} ${pc === 0 ? '✅' : '❌'}`)
  console.log(`   🔗 FK attempt→session  : ${fc1 === 0 ? '✅' : '❌ ' + fc1}`)
  console.log(`   🔗 FK session→user     : ${fc2 === 0 ? '✅' : '❌ ' + fc2}`)
  console.log(`   🔗 FK attempt→question : ${fc3 === 0 ? '✅' : '❌ ' + fc3}`)
  console.log('\n🔍 VERIFIKASI SELESAI.\n')
}

// ─── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(60))
  console.log('  UniMath — Full Rollback + Bank Soal + Rekap Import')
  console.log('═'.repeat(60))

  const day1 = path.join(ROOT, 'rekap_latihan_day1_09juni.csv')
  const day2 = path.join(ROOT, 'rekap_latihan_day2_10juni.csv')
  if (!fs.existsSync(day1)) { console.error(`❌ ${day1}`); process.exit(1) }
  if (!fs.existsSync(day2)) { console.error(`❌ ${day2}`); process.exit(1) }

  await fullWipe()
  await seedBankSoal()
  await importRekap(day1, 'Day 1 (09 Juni)')
  await importRekap(day2, 'Day 2 (10 Juni)')
  await verify()

  console.log('═'.repeat(60))
  console.log('  ✅ FULL RESTORATION COMPLETE.')
  console.log('═'.repeat(60))
}

main().catch(e => { console.error('❌', e); process.exit(1) })
