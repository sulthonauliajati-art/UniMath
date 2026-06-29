/**
 * Patch QC — Koreksi data evaluasi pasca-migrasi
 *
 * TAHAP 1: UPDATE floorAtCompletion = 0 untuk semua PRETEST
 *          (Pretest dilakukan SEBELUM latihan → lantai awal)
 * TAHAP 2: UPDATE materialId = 'M1A' untuk semua PRETEST & POSTTEST
 *          (Ujian evaluasi bersifat GLOBAL, satu wadah)
 *
 * Usage: npx tsx scripts/patch-evaluasi.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../apps/web/src/lib/db/schema'
import { eq, inArray, sql } from 'drizzle-orm'

const { testSessions } = schema

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

const db = drizzle(client, { schema })

async function main() {
  console.log('═══ PATCH QC — Koreksi Data Evaluasi ═══\n')

  /* ═══════════════════════════════════════════════════════════
   * TAHAP 1: Reset floorAtCompletion PRETEST → 0
   * ═══════════════════════════════════════════════════════════ */
  console.log('📌 TAHAP 1: Reset floorAtCompletion PRETEST → 0')

  const pretestBefore = await db
    .select({
      id: testSessions.id,
      floorAtCompletion: testSessions.floorAtCompletion,
    })
    .from(testSessions)
    .where(eq(testSessions.testType, 'PRETEST'))

  console.log(`   Sebelum: ${pretestBefore.length} sesi PRETEST`)
  const sampleBefore = pretestBefore.slice(0, 3)
  for (const s of sampleBefore) {
    console.log(`     ${s.id}: floorAtCompletion = ${s.floorAtCompletion}`)
  }

  const result1 = await db
    .update(testSessions)
    .set({ floorAtCompletion: 0 })
    .where(eq(testSessions.testType, 'PRETEST'))

  console.log(`   ✅ ${result1.rowsAffected} baris PRETEST di-update (floorAtCompletion → 0)\n`)

  /* ═══════════════════════════════════════════════════════════
   * TAHAP 2: Seragamkan materialId → 'M1A' (Global Container)
   * ═══════════════════════════════════════════════════════════ */
  console.log('📌 TAHAP 2: Seragamkan materialId → M1A (Global)')

  const evalBefore = await db
    .select({
      id: testSessions.id,
      materialId: testSessions.materialId,
      testType: testSessions.testType,
    })
    .from(testSessions)
    .where(inArray(testSessions.testType, ['PRETEST', 'POSTTEST']))

  const distinctMaterials = new Set(evalBefore.map((s) => s.materialId))
  console.log(`   Sebelum: ${evalBefore.length} sesi evaluasi, materialId unik: ${[...distinctMaterials].join(', ')}`)

  const result2 = await db
    .update(testSessions)
    .set({ materialId: 'M1A' })
    .where(inArray(testSessions.testType, ['PRETEST', 'POSTTEST']))

  console.log(`   ✅ ${result2.rowsAffected} baris evaluasi di-update (materialId → M1A)\n`)

  /* ═══════════════════════════════════════════════════════════
   * VERIFIKASI FINAL
   * ═══════════════════════════════════════════════════════════ */
  console.log('📌 VERIFIKASI FINAL')

  const final = await db
    .select({
      testType: testSessions.testType,
      materialId: testSessions.materialId,
      count: sql<number>`count(*)`,
      avgFloor: sql<number>`ROUND(AVG(COALESCE(floor_at_completion, 0)), 1)`,
    })
    .from(testSessions)
    .where(inArray(testSessions.testType, ['PRETEST', 'POSTTEST']))
    .groupBy(testSessions.testType, testSessions.materialId)
    .orderBy(testSessions.testType)

  for (const r of final) {
    console.log(`   ${r.testType} | ${r.materialId} | ${r.count} sesi | avg floor: ${r.avgFloor}`)
  }

  const [practiceCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(testSessions)
  console.log(`\n   ✅ Total sesi di test_sessions: ${practiceCount?.count || 0} (termasuk practice — tetap utuh)`)

  console.log('\n✅ Patch QC selesai!')
}

main().catch((err) => {
  console.error('❌ Fatal:', err)
  process.exit(1)
})
