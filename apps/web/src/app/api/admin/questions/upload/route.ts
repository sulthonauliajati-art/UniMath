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

    const questionsToInsert: any[] = []
    const errors: string[] = []

    dataRows.forEach((row, index) => {
      const rowNum = index + 2
      if (row.length < 10) {
        errors.push(`Baris ${rowNum}: Jumlah kolom tidak mencukupi.`)
        return
      }

      const [
        modeRaw, indicatorRaw, difficultyRaw, questionTypeRaw, question,
        optA, optB, optC, optD, correctRaw,
        hint1, hint2, hint3, explanation, remedialMaterialId,
      ] = row

      const mode = modeRaw?.toUpperCase() || 'ALL'
      if (!['PRACTICE', 'PRETEST', 'POSTTEST', 'ALL'].includes(mode)) {
        errors.push(`Baris ${rowNum}: Mode "${mode}" tidak valid. Harus PRACTICE/PRETEST/POSTTEST/ALL.`)
      }

      const indicator = indicatorRaw?.toUpperCase() || 'I1'
      if (!['I1', 'I2', 'I3', 'I4'].includes(indicator)) {
        errors.push(`Baris ${rowNum}: Indikator "${indicator}" tidak valid. Harus I1/I2/I3/I4.`)
      }

      const difficulty = parseInt(difficultyRaw) || 1
      if (difficulty < 1 || difficulty > 3) {
        errors.push(`Baris ${rowNum}: Difficulty harus 1, 2, atau 3.`)
      }

      const questionType = questionTypeRaw?.toUpperCase() || 'PG'
      if (!['PG', 'URAIAN'].includes(questionType)) {
        errors.push(`Baris ${rowNum}: Tipe soal "${questionType}" tidak valid. Harus PG/URAIAN.`)
      }

      let correct = correctRaw?.toUpperCase() || 'A'
      if (questionType === 'PG' && !['A', 'B', 'C', 'D'].includes(correct)) {
        errors.push(`Baris ${rowNum}: Kunci jawaban PG harus A/B/C/D.`)
      }

      if (!question || question.trim() === '') {
        errors.push(`Baris ${rowNum}: Soal tidak boleh kosong.`)
      }

      if (errors.length === 0) {
        questionsToInsert.push({
          id: `Q${Date.now().toString(36)}${index.toString(36).toUpperCase()}`,
          materialId,
          mode,
          indicator,
          difficulty,
          questionType,
          question: question || '',
          optA: optA || '',
          optB: optB || '',
          optC: optC || '',
          optD: optD || '',
          correct: correct as 'A' | 'B' | 'C' | 'D',
          hint1: hint1 || null,
          hint2: hint2 || null,
          hint3: hint3 || null,
          explanation: explanation || null,
          remedialMaterialId: remedialMaterialId || null,
        })
      }
    })

    if (errors.length > 0) {
      return NextResponse.json({ error: { message: 'Validasi CSV gagal:\n' + errors.join('\n') } }, { status: 400 })
    }

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
