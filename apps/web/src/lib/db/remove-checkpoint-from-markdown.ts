/**
 * Remove "Checkpoint" sections from bodyMarkdown in all material_contents.
 *
 * The checkpoint section in the markdown typically starts with a heading like:
 *   ## Checkpoint
 *   ### Checkpoint
 *   # Checkpoint
 *
 * And contains the questions, answers, and explanations that leak answer keys
 * to students. This script strips everything from the checkpoint heading to
 * the next same-level-or-higher heading (or end of document).
 *
 * Also clears the `checkpoint_items` JSON column so the interactive quiz
 * widget doesn't render either.
 *
 * Run:  npx tsx src/lib/db/remove-checkpoint-from-markdown.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
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

/**
 * Strips the "Checkpoint" section from markdown text.
 * Looks for headings containing "checkpoint" (case-insensitive) and removes
 * everything from that heading until the next heading of equal or higher level,
 * or end of document.
 *
 * Also removes "Syarat kembali ke latihan" section if present (it references
 * checkpoint completion).
 */
function stripCheckpointSection(md: string): string {
  if (!md) return md

  const lines = md.split('\n')
  const result: string[] = []
  let skipping = false
  let skipLevel = 0 // heading level that started the skip (e.g. 2 for ##)

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.*)/)

    if (headingMatch) {
      const level = headingMatch[1].length
      const title = headingMatch[2].trim().toLowerCase()

      if (
        title.includes('checkpoint') ||
        title.includes('syarat kembali ke latihan')
      ) {
        // Start skipping
        skipping = true
        skipLevel = level
        continue
      }

      if (skipping) {
        // Stop skipping if we hit a heading of equal or higher level
        if (level <= skipLevel) {
          skipping = false
          result.push(line)
        }
        // else: still inside the checkpoint section, skip
        continue
      }
    }

    if (!skipping) {
      result.push(line)
    }
  }

  // Trim trailing empty lines
  while (result.length > 0 && result[result.length - 1].trim() === '') {
    result.pop()
  }

  return result.join('\n')
}

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('🧹 Removing Checkpoint sections from all material_contents')
  console.log('═══════════════════════════════════════════════\n')

  const allContents = await db.select().from(schema.materialContents)
  console.log(`📊 Total material_contents rows: ${allContents.length}\n`)

  let updatedMarkdown = 0
  let clearedCheckpointItems = 0

  for (const content of allContents) {
    let needsUpdate = false
    const updates: Partial<typeof schema.materialContents.$inferInsert> = {}

    // 1. Strip checkpoint from bodyMarkdown
    if (content.bodyMarkdown) {
      const cleaned = stripCheckpointSection(content.bodyMarkdown)
      if (cleaned !== content.bodyMarkdown) {
        updates.bodyMarkdown = cleaned
        needsUpdate = true
        updatedMarkdown++
        console.log(`   ✏️  ${content.id}: stripped checkpoint from bodyMarkdown`)
      }
    }

    // 2. Clear checkpoint_items JSON
    if (content.checkpointItems) {
      updates.checkpointItems = null
      needsUpdate = true
      clearedCheckpointItems++
      console.log(`   🗑️  ${content.id}: cleared checkpointItems`)
    }

    if (needsUpdate) {
      await db
        .update(schema.materialContents)
        .set(updates)
        .where(eq(schema.materialContents.id, content.id))
    }
  }

  console.log('\n═══════════════════════════════════════════════')
  console.log('✅ SELESAI')
  console.log(`   bodyMarkdown diperbarui : ${updatedMarkdown}`)
  console.log(`   checkpointItems dihapus : ${clearedCheckpointItems}`)
  console.log('═══════════════════════════════════════════════\n')

  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
