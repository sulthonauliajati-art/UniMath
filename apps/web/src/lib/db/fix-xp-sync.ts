/**
 * Fix XP sync for existing students.
 * 
 * Problem: XP was only saved when session ended (client-sent).
 * If a student closed the browser or navigated away, their XP was lost.
 * 
 * Solution: Recalculate XP from practiceAttempts (correct answers)
 * and update users.totalPoints to match.
 * 
 * XP Formula: BASE_XP (10) per correct answer
 * (We can't retroactively calculate streak multipliers, so we use base XP)
 * 
 * Run: npx tsx src/lib/db/fix-xp-sync.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq, sql } from 'drizzle-orm'
import * as schema from './schema'

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('❌ TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN tidak ditemukan')
  process.exit(1)
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const db = drizzle(client, { schema })

const BASE_XP = 10

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('🔧 Fix XP Sync — Recalculate from practiceAttempts')
  console.log('═══════════════════════════════════════════════\n')

  // Get all students
  const students = await db
    .select({ id: schema.users.id, name: schema.users.name, totalPoints: schema.users.totalPoints })
    .from(schema.users)
    .where(eq(schema.users.role, 'STUDENT'))

  console.log(`📊 Total siswa: ${students.length}\n`)

  let updated = 0

  for (const student of students) {
    // Count correct attempts for this student
    const [stats] = await db
      .select({
        correctAnswers: sql<number>`COALESCE(sum(case when ${schema.practiceAttempts.isCorrect} = 1 then 1 else 0 end), 0)`,
      })
      .from(schema.practiceAttempts)
      .innerJoin(schema.practiceSessions, eq(schema.practiceAttempts.sessionId, schema.practiceSessions.id))
      .where(eq(schema.practiceSessions.studentUserId, student.id))

    const correctAnswers = stats?.correctAnswers || 0
    const calculatedXP = correctAnswers * BASE_XP
    const currentXP = student.totalPoints || 0

    // Only update if calculated XP is higher than current (don't reduce)
    if (calculatedXP > currentXP) {
      await db
        .update(schema.users)
        .set({ totalPoints: calculatedXP })
        .where(eq(schema.users.id, student.id))

      console.log(`   ✅ ${student.name}: ${currentXP} → ${calculatedXP} XP (+${calculatedXP - currentXP})`)
      updated++
    } else {
      console.log(`   ⏭️  ${student.name}: ${currentXP} XP (sudah benar atau lebih tinggi)`)
    }
  }

  console.log('\n═══════════════════════════════════════════════')
  console.log(`✅ SELESAI — ${updated} siswa diperbarui`)
  console.log('═══════════════════════════════════════════════\n')

  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
