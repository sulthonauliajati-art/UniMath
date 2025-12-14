import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { questions } from '@/lib/db/schema'
import { validateToken } from '@/lib/auth/utils'

async function validateAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null

  const tokenData = await validateToken(token)
  if (!tokenData.valid || tokenData.role !== 'ADMIN') return null
  return tokenData
}

function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n')
  return lines.map((line) => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  })
}

export async function POST(request: NextRequest) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const materialId = formData.get('materialId') as string

    if (!file || !materialId) {
      return NextResponse.json(
        { error: { message: 'File dan Material ID diperlukan' } },
        { status: 400 }
      )
    }

    const text = await file.text()
    const rows = parseCSV(text)

    // Skip header row
    const dataRows = rows.slice(1).filter((row) => row.length >= 7 && row[0])

    if (dataRows.length === 0) {
      return NextResponse.json(
        { error: { message: 'Tidak ada data valid dalam file' } },
        { status: 400 }
      )
    }

    const questionsToInsert = dataRows.map((row, index) => {
      const [difficulty, question, optA, optB, optC, optD, correct, hint1, hint2, hint3, explanation] =
        row

      return {
        id: `Q${Date.now().toString(36)}${index.toString(36).toUpperCase()}`,
        materialId,
        difficulty: parseInt(difficulty) || 1,
        question: question || '',
        optA: optA || '',
        optB: optB || '',
        optC: optC || '',
        optD: optD || '',
        correct: (correct?.toUpperCase() as 'A' | 'B' | 'C' | 'D') || 'A',
        hint1: hint1 || null,
        hint2: hint2 || null,
        hint3: hint3 || null,
        explanation: explanation || null,
      }
    })

    // Insert in batches
    const batchSize = 50
    for (let i = 0; i < questionsToInsert.length; i += batchSize) {
      const batch = questionsToInsert.slice(i, i + batchSize)
      await db.insert(questions).values(batch)
    }

    return NextResponse.json({
      success: true,
      count: questionsToInsert.length,
    })
  } catch (error) {
    console.error('Upload questions error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
