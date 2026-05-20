import fs from 'fs'
import path from 'path'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../apps/web/src/lib/db/schema'
import { config } from 'dotenv'

// Load environment variables
config({ path: path.resolve(__dirname, '../apps/web/.env.local') })

// Multi-line CSV Parser (RFC 4180 compliant)
function parseCSVMultiline(text: string): string[][] {
  const records: string[][] = []
  let current = ''
  let inQuotes = false
  let fields: string[] = []
  
  const chars = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    const nextChar = chars[i + 1]
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        fields.push(current.trim())
        current = ''
      } else if (char === '\n') {
        fields.push(current.trim())
        if (fields.length > 1 || fields[0] !== '') {
          records.push(fields)
        }
        fields = []
        current = ''
      } else {
        current += char
      }
    }
  }
  
  if (current || fields.length > 0) {
    fields.push(current.trim())
    if (fields.length > 1 || fields[0] !== '') {
      records.push(fields)
    }
  }
  
  return records
}

// CSV Writer helper
function writeCSV(records: string[][]): string {
  return records.map(row => {
    return row.map(field => {
      // Escape double quotes by doubling them
      const escaped = field.replace(/"/g, '""')
      // Wrap in double quotes if it contains commas, newlines, or double quotes
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
        return `"${escaped}"`
      }
      return escaped
    }).join(',')
  }).join('\n')
}

// Replace the ## Checkpoint section in the markdown body
function replaceCheckpointMarkdown(body: string, newCheckpointMarkdown: string): string {
  const headerIndex = body.indexOf('## Checkpoint')
  if (headerIndex === -1) {
    return body + '\n\n' + newCheckpointMarkdown
  }
  
  const afterHeader = body.substring(headerIndex + 13)
  const nextHeaderIndex = afterHeader.indexOf('\n## ')
  
  if (nextHeaderIndex === -1) {
    return body.substring(0, headerIndex) + newCheckpointMarkdown
  } else {
    const nextHeaderPos = headerIndex + 13 + nextHeaderIndex
    return body.substring(0, headerIndex) + newCheckpointMarkdown + '\n' + body.substring(nextHeaderPos)
  }
}

interface NewCheckpoint {
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation: string
}

async function run() {
  console.log('🔄 Membaca file checkpoint uji pemahaman.csv...')
  const newCsvPath = path.resolve(__dirname, '../checkpoint uji pemahaman.csv')
  if (!fs.existsSync(newCsvPath)) {
    console.error('❌ File "checkpoint uji pemahaman.csv" tidak ditemukan!')
    process.exit(1)
  }
  
  const newCsvContent = fs.readFileSync(newCsvPath, 'utf-8')
  const newRecords = parseCSVMultiline(newCsvContent)
  
  // Group new checkpoints by content_id
  const groupedCheckpoints: Record<string, NewCheckpoint[]> = {}
  
  // Skip header row
  for (let i = 1; i < newRecords.length; i++) {
    const row = newRecords[i]
    if (row.length < 9) continue
    
    const contentId = row[0]?.trim()
    const question = row[2]?.trim()
    const optionA = row[3]?.trim()
    const optionB = row[4]?.trim()
    const optionC = row[5]?.trim()
    const optionD = row[6]?.trim()
    const correctAnswer = row[7]?.trim()
    const explanation = row[8]?.trim()
    
    if (!contentId || !question) continue
    
    if (!groupedCheckpoints[contentId]) {
      groupedCheckpoints[contentId] = []
    }
    
    groupedCheckpoints[contentId].push({
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation
    })
  }
  
  console.log(`✅ Berhasil mengelompokkan checkpoint untuk ${Object.keys(groupedCheckpoints).length} materi.`)
  
  // Read Master CSV
  const masterCsvPath = path.resolve(__dirname, '../unimath_master_list_materi_M1A-M1F_R1-R3.csv')
  if (!fs.existsSync(masterCsvPath)) {
    console.error('❌ File master "unimath_master_list_materi_M1A-M1F_R1-R3.csv" tidak ditemukan!')
    process.exit(1)
  }
  
  console.log('🔄 Membaca master list materi...')
  const masterCsvContent = fs.readFileSync(masterCsvPath, 'utf-8')
  const masterRecords = parseCSVMultiline(masterCsvContent)
  
  const header = masterRecords[0]
  const contentIdIdx = header.indexOf('content_id')
  const checkpointItemsIdx = header.indexOf('checkpoint_items')
  const bodyMarkdownIdx = header.indexOf('body_markdown')
  
  if (contentIdIdx === -1 || checkpointItemsIdx === -1 || bodyMarkdownIdx === -1) {
    console.error('❌ Kolom yang dibutuhkan tidak ditemukan di file master CSV!')
    process.exit(1)
  }
  
  let updatedCount = 0
  
  for (let i = 1; i < masterRecords.length; i++) {
    const row = masterRecords[i]
    const contentId = row[contentIdIdx]?.trim()
    
    if (!contentId || !groupedCheckpoints[contentId]) continue
    
    const newItems = groupedCheckpoints[contentId]
    
    // Format JSON untuk checkpoint_items
    const jsonItems = newItems.map(item => {
      const options = `A ${item.optionA} | B ${item.optionB} | C ${item.optionC} | D ${item.optionD}`
      return {
        question: item.question,
        options,
        answer: item.correctAnswer,
        explanation: item.explanation
      }
    })
    
    row[checkpointItemsIdx] = JSON.stringify(jsonItems)
    
    // Format markdown untuk body_markdown
    let mdContent = '## Checkpoint\n'
    newItems.forEach((item, idx) => {
      mdContent += `### Checkpoint ${idx + 1}\n`
      mdContent += `${item.question}\n`
      mdContent += `A ${item.optionA} | B ${item.optionB} | C ${item.optionC} | D ${item.optionD}\n`
      mdContent += `**Jawaban:** ${item.correctAnswer}\n`
      mdContent += `**Pembahasan:** ${item.explanation}\n\n`
    })
    
    row[bodyMarkdownIdx] = replaceCheckpointMarkdown(row[bodyMarkdownIdx], mdContent)
    updatedCount++
  }
  
  console.log(`📝 Memperbarui ${updatedCount} baris di file master CSV...`)
  
  // Write updated master CSV back
  const newMasterCsvContent = writeCSV(masterRecords)
  fs.writeFileSync(masterCsvPath, newMasterCsvContent, 'utf-8')
  console.log('✅ File master CSV berhasil diperbarui!')
  
  // database update
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    console.log('🔄 Menghubungkan ke database Turso untuk sinkronisasi...')
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const db = drizzle(client, { schema })
    
    console.log('🚀 Mulai update database...')
    const { eq } = require('drizzle-orm')
    
    for (const contentId of Object.keys(groupedCheckpoints)) {
      const row = masterRecords.find(r => r[contentIdIdx] === contentId)
      if (!row) continue
      
      const checkpointItems = row[checkpointItemsIdx]
      const bodyMarkdown = row[bodyMarkdownIdx]
      
      await db.update(schema.materialContents)
        .set({
          checkpointItems,
          bodyMarkdown
        })
        .where(eq(schema.materialContents.id, contentId))
      
      console.log(`   ✓ Database diperbarui untuk: ${contentId}`)
    }
    console.log('🎉 Database berhasil disinkronisasikan!')
    client.close()
  } else {
    console.log('⚠️ TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN tidak diset di .env.local. Sinkronisasi database dilewati.')
    console.log('💡 Anda dapat menjalankannya nanti dengan meng-import ulang file master.')
  }
}

run().catch(err => {
  console.error('❌ Terjadi kesalahan saat menjalankan script:', err)
})
