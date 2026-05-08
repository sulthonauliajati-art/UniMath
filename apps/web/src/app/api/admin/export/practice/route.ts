import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, classes, classStudents, practiceSessions, practiceAttempts, questions, materials } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    let query = db
      .select({
        studentName: users.name,
        materialTitle: materials.title,
        floor: practiceAttempts.floor,
        questionId: questions.id,
        indicator: questions.indicator,
        difficulty: questions.difficulty,
        hintCountAtAnswer: practiceAttempts.hintCountAtAnswer,
        difficultyAtAnswer: practiceAttempts.difficultyAtAnswer,
        isCorrect: practiceAttempts.isCorrect,
        isRemedialSession: practiceAttempts.isRemedialSession,
        createdAt: practiceAttempts.createdAt,
      })
      .from(practiceAttempts)
      .innerJoin(practiceSessions, eq(practiceAttempts.sessionId, practiceSessions.id))
      .innerJoin(users, eq(practiceSessions.studentUserId, users.id))
      .innerJoin(questions, eq(practiceAttempts.questionId, questions.id))
      .innerJoin(materials, eq(practiceSessions.materialId, materials.id))

    const results = await query

    // Generate CSV
    const headers = [
      'Student Name', 'Material', 'Floor', 'Question ID', 'Indicator', 
      'Difficulty', 'Difficulty At Answer', 'Hint Count At Answer', 'Is Correct', 'Is Remedial Session', 'Timestamp'
    ]

    const csvRows = [headers.join(',')]
    results.forEach(r => {
      const row = [
        `"${r.studentName || ''}"`,
        `"${r.materialTitle || ''}"`,
        r.floor,
        `"${r.questionId}"`,
        `"${r.indicator}"`,
        r.difficulty,
        r.difficultyAtAnswer || 0,
        r.hintCountAtAnswer || 0,
        r.isCorrect ? '1' : '0',
        r.isRemedialSession ? '1' : '0',
        `"${r.createdAt}"`
      ]
      csvRows.push(row.join(','))
    })

    return new NextResponse(csvRows.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=practice_data_${Date.now()}.csv`
      }
    })
  } catch (error) {
    console.error('Export practice error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
