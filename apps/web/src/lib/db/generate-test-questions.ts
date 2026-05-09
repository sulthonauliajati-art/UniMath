import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq, and, or } from 'drizzle-orm'
import * as schema from './schema'

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('❌ ERROR: TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN tidak ditemukan di .env.local')
  process.exit(1)
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const db = drizzle(client, { schema })

/**
 * Script to generate PRETEST & POSTTEST questions from existing PRACTICE questions.
 * 
 * Strategy:
 * - For each material (M1A-M1F), select a balanced mix of difficulties
 * - PRETEST: 5 questions per material (2 mudah, 2 sedang, 1 sulit) 
 * - POSTTEST: 5 questions per material (1 mudah, 2 sedang, 2 sulit)
 * - Questions are cloned with new IDs and mode set to PRETEST/POSTTEST
 */

async function main() {
  console.log('🚀 Generate PRETEST & POSTTEST questions from existing PRACTICE bank...\n')

  // Get all materials
  const allMaterials = await db.select().from(schema.materials).orderBy(schema.materials.order)
  console.log(`📚 Found ${allMaterials.length} materials\n`)

  let totalPretest = 0
  let totalPosttest = 0

  for (const material of allMaterials) {
    console.log(`\n═══ ${material.id}: ${material.title} ═══`)

    // Get existing practice questions for this material
    const practiceQuestions = await db
      .select()
      .from(schema.questions)
      .where(
        and(
          eq(schema.questions.materialId, material.id),
          or(eq(schema.questions.mode, 'PRACTICE'), eq(schema.questions.mode, 'ALL'))
        )
      )

    if (practiceQuestions.length === 0) {
      console.log(`  ⚠️ No practice questions found, skipping`)
      continue
    }

    // Group by difficulty
    const easy = practiceQuestions.filter(q => q.difficulty === 1)
    const medium = practiceQuestions.filter(q => q.difficulty === 2)
    const hard = practiceQuestions.filter(q => q.difficulty === 3)

    console.log(`  📊 Practice questions: ${easy.length} mudah, ${medium.length} sedang, ${hard.length} sulit`)

    // Check if PRETEST/POSTTEST already exist for this material
    const existingPretest = await db
      .select()
      .from(schema.questions)
      .where(and(eq(schema.questions.materialId, material.id), eq(schema.questions.mode, 'PRETEST')))
    
    const existingPosttest = await db
      .select()
      .from(schema.questions)
      .where(and(eq(schema.questions.materialId, material.id), eq(schema.questions.mode, 'POSTTEST')))

    if (existingPretest.length > 0) {
      console.log(`  ✓ PRETEST already has ${existingPretest.length} questions, skipping`)
    } else {
      // PRETEST: 2 easy + 2 medium + 1 hard = 5 questions
      const pretestPool = [
        ...pickRandom(easy, 2),
        ...pickRandom(medium, 2),
        ...pickRandom(hard, 1),
      ]

      for (const q of pretestPool) {
        const newId = `${material.id}-PRE-${q.id.split('-').slice(-2).join('-')}`
        await db.insert(schema.questions).values({
          id: newId,
          materialId: q.materialId,
          mode: 'PRETEST',
          indicator: q.indicator,
          difficulty: q.difficulty,
          questionType: q.questionType,
          question: q.question,
          optA: q.optA,
          optB: q.optB,
          optC: q.optC,
          optD: q.optD,
          correct: q.correct,
          hint1: null, // No hints in test mode
          hint2: null,
          hint3: null,
          explanation: q.explanation,
          remedialMaterialId: q.remedialMaterialId,
        }).onConflictDoNothing()
        totalPretest++
      }
      console.log(`  ✅ Created ${pretestPool.length} PRETEST questions`)
    }

    if (existingPosttest.length > 0) {
      console.log(`  ✓ POSTTEST already has ${existingPosttest.length} questions, skipping`)
    } else {
      // POSTTEST: 1 easy + 2 medium + 2 hard = 5 questions
      // Use DIFFERENT questions than pretest when possible
      const pretestIds = new Set(
        (await db.select().from(schema.questions)
          .where(and(eq(schema.questions.materialId, material.id), eq(schema.questions.mode, 'PRETEST')))
        ).map(q => {
          // Extract original ID pattern
          const parts = q.id.replace(`${material.id}-PRE-`, '')
          return parts
        })
      )

      // Try to pick different questions, fallback to any if not enough
      const postEasy = pickRandomExclude(easy, 1, pretestIds) 
      const postMedium = pickRandomExclude(medium, 2, pretestIds)
      const postHard = pickRandomExclude(hard, 2, pretestIds)
      
      const posttestPool = [...postEasy, ...postMedium, ...postHard]

      for (const q of posttestPool) {
        const newId = `${material.id}-POST-${q.id.split('-').slice(-2).join('-')}`
        await db.insert(schema.questions).values({
          id: newId,
          materialId: q.materialId,
          mode: 'POSTTEST',
          indicator: q.indicator,
          difficulty: q.difficulty,
          questionType: q.questionType,
          question: q.question,
          optA: q.optA,
          optB: q.optB,
          optC: q.optC,
          optD: q.optD,
          correct: q.correct,
          hint1: null,
          hint2: null,
          hint3: null,
          explanation: q.explanation,
          remedialMaterialId: q.remedialMaterialId,
        }).onConflictDoNothing()
        totalPosttest++
      }
      console.log(`  ✅ Created ${posttestPool.length} POSTTEST questions`)
    }
  }

  console.log(`\n═══════════════════════════════════`)
  console.log(`✅ Total PRETEST questions created: ${totalPretest}`)
  console.log(`✅ Total POSTTEST questions created: ${totalPosttest}`)
  console.log(`═══════════════════════════════════`)

  process.exit(0)
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, arr.length))
}

function pickRandomExclude<T extends { id: string }>(arr: T[], count: number, excludePatterns: Set<string>): T[] {
  // Try to pick questions whose ID suffix doesn't match excluded patterns
  const preferred = arr.filter(q => {
    const suffix = q.id.split('-').slice(-2).join('-')
    return !excludePatterns.has(suffix)
  })
  
  if (preferred.length >= count) {
    return pickRandom(preferred, count)
  }
  // Fallback: use any available
  return pickRandom(arr, count)
}

main().catch(console.error)
