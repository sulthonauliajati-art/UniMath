/**
 * Cleanup legacy materials that are NOT in the canonical M1A-M1F / R1-R3 set.
 *
 * Why: the app started with generic placeholder materials (Penjumlahan Dasar,
 * Pengurangan Dasar, etc) and various duplicate/test materials. Now that the
 * master CSV defines the canonical curriculum (Aritmatika Sosial SMA Kelas
 * 10 — M1A..M1F with R1..R3 as remedial), every other material must be
 * removed so that students redirected after 3 consecutive wrong answers land
 * in the correct "room".
 *
 * Usage:
 *   npx tsx src/lib/db/cleanup-legacy-materials.ts          # DRY RUN (default)
 *   npx tsx src/lib/db/cleanup-legacy-materials.ts --apply  # Actually delete
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq, inArray, notInArray } from 'drizzle-orm'
import * as schema from './schema'

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('❌ ERROR: TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN tidak ditemukan')
  process.exit(1)
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const db = drizzle(client, { schema })

const CANONICAL_IDS = ['M1A', 'M1B', 'M1C', 'M1D', 'M1E', 'M1F', 'R1', 'R2', 'R3']

const APPLY = process.argv.includes('--apply')

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log(`🧹 Legacy Materials Cleanup  (${APPLY ? 'APPLY' : 'DRY-RUN'})`)
  console.log('═══════════════════════════════════════════════\n')

  const allMaterials = await db.select().from(schema.materials)
  const legacy = allMaterials.filter((m) => !CANONICAL_IDS.includes(m.id))
  const kept = allMaterials.filter((m) => CANONICAL_IDS.includes(m.id))

  console.log(`📚 Total materi       : ${allMaterials.length}`)
  console.log(`✅ Canonical (keep)   : ${kept.length}`)
  kept.forEach((m) => console.log(`      ${m.id.padEnd(4)} · ${m.title}`))
  console.log(`\n🗑  Legacy (to delete): ${legacy.length}`)
  legacy.forEach((m) => console.log(`      ${m.id.padEnd(20)} · ${m.title}`))

  if (legacy.length === 0) {
    console.log('\n✅ Tidak ada materi legacy. Database sudah bersih.')
    process.exit(0)
  }

  const legacyIds = legacy.map((m) => m.id)

  // ── Count dependent rows so admin can make an informed decision ────
  console.log('\n📊 Data terkait yang akan ikut terhapus:')

  // Questions in legacy materials
  const legacyQuestions = await db
    .select({ id: schema.questions.id, materialId: schema.questions.materialId })
    .from(schema.questions)
    .where(inArray(schema.questions.materialId, legacyIds))
  console.log(`   Questions              : ${legacyQuestions.length}`)

  const legacyQuestionIds = legacyQuestions.map((q) => q.id)

  // Practice sessions tied to legacy materials
  const legacyPracticeSessions = await db
    .select({ id: schema.practiceSessions.id })
    .from(schema.practiceSessions)
    .where(inArray(schema.practiceSessions.materialId, legacyIds))
  console.log(`   Practice sessions      : ${legacyPracticeSessions.length}`)

  const legacyPracticeSessionIds = legacyPracticeSessions.map((s) => s.id)

  // Practice attempts: tied to either legacy session OR legacy question
  // Fetch counts separately (union semantics)
  let practiceAttemptsCount = 0
  if (legacyPracticeSessionIds.length > 0) {
    const res = await db
      .select({ id: schema.practiceAttempts.id })
      .from(schema.practiceAttempts)
      .where(inArray(schema.practiceAttempts.sessionId, legacyPracticeSessionIds))
    practiceAttemptsCount += res.length
  }
  if (legacyQuestionIds.length > 0) {
    const res = await db
      .select({ id: schema.practiceAttempts.id })
      .from(schema.practiceAttempts)
      .where(inArray(schema.practiceAttempts.questionId, legacyQuestionIds))
    // These may overlap with session-based ones but we delete using OR semantics below
    practiceAttemptsCount = Math.max(practiceAttemptsCount, res.length)
  }
  console.log(`   Practice attempts (≥) : ${practiceAttemptsCount}`)

  // Test sessions
  const legacyTestSessions = await db
    .select({ id: schema.testSessions.id })
    .from(schema.testSessions)
    .where(inArray(schema.testSessions.materialId, legacyIds))
  console.log(`   Test sessions          : ${legacyTestSessions.length}`)

  const legacyTestSessionIds = legacyTestSessions.map((s) => s.id)

  // Material contents
  const legacyContents = await db
    .select({ id: schema.materialContents.id })
    .from(schema.materialContents)
    .where(inArray(schema.materialContents.materialId, legacyIds))
  console.log(`   Material contents      : ${legacyContents.length}`)

  if (!APPLY) {
    console.log('\nℹ️  DRY-RUN mode. Tidak ada data yang dihapus.')
    console.log('   Untuk benar-benar menghapus, jalankan dengan flag --apply:')
    console.log('   npx tsx src/lib/db/cleanup-legacy-materials.ts --apply')
    process.exit(0)
  }

  // ═══════════════════════════════════════════════
  // APPLY MODE — cascade deletes in FK-safe order
  // ═══════════════════════════════════════════════
  console.log('\n🚨 APPLYING DELETIONS...')

  // 1. practice_attempts (references practice_sessions + questions)
  if (legacyPracticeSessionIds.length > 0) {
    await db
      .delete(schema.practiceAttempts)
      .where(inArray(schema.practiceAttempts.sessionId, legacyPracticeSessionIds))
    console.log('   ✅ practice_attempts (by session) deleted')
  }
  if (legacyQuestionIds.length > 0) {
    await db
      .delete(schema.practiceAttempts)
      .where(inArray(schema.practiceAttempts.questionId, legacyQuestionIds))
    console.log('   ✅ practice_attempts (by question) deleted')
  }

  // 2. test_attempts (references test_sessions + questions)
  if (legacyTestSessionIds.length > 0) {
    await db
      .delete(schema.testAttempts)
      .where(inArray(schema.testAttempts.sessionId, legacyTestSessionIds))
    console.log('   ✅ test_attempts (by session) deleted')
  }
  if (legacyQuestionIds.length > 0) {
    await db
      .delete(schema.testAttempts)
      .where(inArray(schema.testAttempts.questionId, legacyQuestionIds))
    console.log('   ✅ test_attempts (by question) deleted')
  }

  // 3. practice_sessions
  if (legacyPracticeSessionIds.length > 0) {
    await db
      .delete(schema.practiceSessions)
      .where(inArray(schema.practiceSessions.id, legacyPracticeSessionIds))
    console.log('   ✅ practice_sessions deleted')
  }

  // 4. test_sessions
  if (legacyTestSessionIds.length > 0) {
    await db
      .delete(schema.testSessions)
      .where(inArray(schema.testSessions.id, legacyTestSessionIds))
    console.log('   ✅ test_sessions deleted')
  }

  // 5. questions
  if (legacyIds.length > 0) {
    await db
      .delete(schema.questions)
      .where(inArray(schema.questions.materialId, legacyIds))
    console.log('   ✅ questions deleted')
  }

  // 6. material_contents
  await db
    .delete(schema.materialContents)
    .where(inArray(schema.materialContents.materialId, legacyIds))
  console.log('   ✅ material_contents deleted')

  // 7. materials themselves
  await db.delete(schema.materials).where(inArray(schema.materials.id, legacyIds))
  console.log('   ✅ materials deleted')

  // Re-set canonical order to pretty values
  console.log('\n🔢 Menormalkan order canonical...')
  const orderMap: Record<string, number> = {
    M1A: 1, M1B: 2, M1C: 3, M1D: 4, M1E: 5, M1F: 6,
    R1: 91, R2: 92, R3: 93,
  }
  for (const [id, order] of Object.entries(orderMap)) {
    await db.update(schema.materials).set({ order }).where(eq(schema.materials.id, id))
  }
  console.log('   ✅ order canonical diperbarui')

  // Summary
  const remaining = await db.select().from(schema.materials).orderBy(schema.materials.order)
  console.log('\n═══════════════════════════════════════════════')
  console.log(`✅ CLEANUP SELESAI — ${remaining.length} materi tersisa:`)
  remaining.forEach((m) =>
    console.log(`   ${m.id.padEnd(4)} · order ${String(m.order).padStart(2)} · Kelas ${m.grade} · ${m.title}`)
  )
  console.log('═══════════════════════════════════════════════')

  // Avoid lint warning for notInArray when unused; referenced once to keep tree-shaking behavior consistent
  void notInArray

  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
