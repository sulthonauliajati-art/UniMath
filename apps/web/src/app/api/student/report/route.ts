import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { materials, practiceSessions, practiceAttempts, questions } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

const MIN_FLOORS = 15

const INDICATOR_LABELS: Record<string, string> = {
  I1: 'Pemahaman Konsep',
  I2: 'Penerapan Rumus',
  I3: 'Analisis Masalah',
  I4: 'Penalaran & Evaluasi',
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Mudah',
  2: 'Sedang',
  3: 'Sulit',
}

/**
 * GET /api/student/report
 *
 * Returns a detailed performance analysis for the authenticated student.
 * The report is only available after the student has completed at least
 * MIN_FLOORS (15) floors across all practice sessions.
 *
 * Analysis includes:
 * - Accuracy by indicator (I1-I4)
 * - Accuracy by difficulty level (Easy/Medium/Hard)
 * - Accuracy by material (M1A-M1F)
 * - Strengths (≥75% accuracy areas)
 * - Weaknesses (<50% accuracy areas)
 * - Actionable recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token diperlukan' } },
        { status: 401 }
      )
    }

    const tokenData = await validateToken(token)
    if (!tokenData.valid || !tokenData.userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token tidak valid' } },
        { status: 401 }
      )
    }

    const userId = tokenData.userId

    // ── Check total floors threshold ──
    const [floorStats] = await db
      .select({
        totalFloors: sql<number>`COALESCE(SUM(floor - 1), 0)`,
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.studentUserId, userId))

    const totalFloors = floorStats?.totalFloors || 0

    if (totalFloors < MIN_FLOORS) {
      return NextResponse.json({
        ready: false,
        totalFloors,
        minFloors: MIN_FLOORS,
        floorsNeeded: MIN_FLOORS - totalFloors,
      })
    }

    // ── Get all attempts with question details ──
    const allAttempts = await db
      .select({
        isCorrect: practiceAttempts.isCorrect,
        indicator: questions.indicator,
        difficulty: practiceAttempts.difficultyAtAnswer,
        materialId: questions.materialId,
      })
      .from(practiceAttempts)
      .innerJoin(practiceSessions, eq(practiceAttempts.sessionId, practiceSessions.id))
      .innerJoin(questions, eq(practiceAttempts.questionId, questions.id))
      .where(eq(practiceSessions.studentUserId, userId))

    const totalAttempts = allAttempts.length
    const totalCorrect = allAttempts.filter(a => a.isCorrect).length
    const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

    // ── Accuracy by Indicator ──
    const indicatorMap: Record<string, { correct: number; total: number }> = {}
    for (const a of allAttempts) {
      const ind = a.indicator || 'I1'
      if (!indicatorMap[ind]) indicatorMap[ind] = { correct: 0, total: 0 }
      indicatorMap[ind].total++
      if (a.isCorrect) indicatorMap[ind].correct++
    }
    const byIndicator = Object.entries(indicatorMap).map(([indicator, stats]) => ({
      indicator,
      label: INDICATOR_LABELS[indicator] || indicator,
      correct: stats.correct,
      total: stats.total,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    })).sort((a, b) => a.indicator.localeCompare(b.indicator))

    // ── Accuracy by Difficulty ──
    const difficultyMap: Record<number, { correct: number; total: number }> = {}
    for (const a of allAttempts) {
      const diff = a.difficulty || 2
      if (!difficultyMap[diff]) difficultyMap[diff] = { correct: 0, total: 0 }
      difficultyMap[diff].total++
      if (a.isCorrect) difficultyMap[diff].correct++
    }
    const byDifficulty = Object.entries(difficultyMap).map(([diff, stats]) => {
      const d = Number(diff)
      return {
        difficulty: d,
        label: DIFFICULTY_LABELS[d] || `Level ${d}`,
        correct: stats.correct,
        total: stats.total,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      }
    }).sort((a, b) => a.difficulty - b.difficulty)

    // ── Accuracy by Material ──
    const materialMap: Record<string, { correct: number; total: number }> = {}
    for (const a of allAttempts) {
      const mid = a.materialId
      if (!materialMap[mid]) materialMap[mid] = { correct: 0, total: 0 }
      materialMap[mid].total++
      if (a.isCorrect) materialMap[mid].correct++
    }

    // Get material titles
    const allMaterials = await db.select({ id: materials.id, title: materials.title }).from(materials)
    const materialTitleMap: Record<string, string> = {}
    for (const m of allMaterials) {
      materialTitleMap[m.id] = m.title
    }

    const byMaterial = Object.entries(materialMap).map(([materialId, stats]) => ({
      materialId,
      title: materialTitleMap[materialId] || materialId,
      correct: stats.correct,
      total: stats.total,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    })).sort((a, b) => a.materialId.localeCompare(b.materialId))

    // ── Determine Strengths & Weaknesses ──
    const strengths: string[] = []
    const weaknesses: string[] = []
    const recommendations: string[] = []

    // By indicator
    for (const ind of byIndicator) {
      if (ind.total >= 3) { // need minimum samples
        if (ind.accuracy >= 75) {
          strengths.push(`${ind.label} (${ind.indicator}): ${ind.accuracy}%`)
        } else if (ind.accuracy < 50) {
          weaknesses.push(`${ind.label} (${ind.indicator}): ${ind.accuracy}%`)
          recommendations.push(`Latih lebih banyak soal ${ind.label}`)
        }
      }
    }

    // By material
    for (const mat of byMaterial) {
      if (mat.total >= 3) {
        if (mat.accuracy >= 75) {
          strengths.push(`${mat.title}: ${mat.accuracy}%`)
        } else if (mat.accuracy < 50) {
          weaknesses.push(`${mat.title}: ${mat.accuracy}%`)
          recommendations.push(`Perkuat materi: ${mat.title}`)
        }
      }
    }

    // By difficulty
    for (const diff of byDifficulty) {
      if (diff.total >= 3 && diff.accuracy < 50) {
        recommendations.push(`Tingkatkan kemampuan soal tingkat ${diff.label}`)
      }
    }

    // Add general recommendations if lists are empty
    if (strengths.length === 0) {
      strengths.push('Terus berlatih untuk membangun keunggulan!')
    }
    if (weaknesses.length === 0) {
      weaknesses.push('Tidak ada kelemahan signifikan — kerja bagus! 🎉')
    }
    if (recommendations.length === 0) {
      recommendations.push('Pertahankan performa dan coba soal tingkat Sulit!')
    }

    return NextResponse.json({
      ready: true,
      totalFloors,
      totalAttempts,
      overallAccuracy,
      byIndicator,
      byDifficulty,
      byMaterial,
      strengths,
      weaknesses,
      recommendations,
    })
  } catch (error) {
    console.error('Student report error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
