import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, classes, classStudents, testSessions, testAttempts, questions, materials } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const testTypeFilter = url.searchParams.get('testType')

    // Fetch URAIAN answers
    let query = db
      .select({
        studentName: users.name,
        nisn: users.nisn,
        className: classes.name,
        testType: testSessions.testType,
        materialTitle: materials.title,
        questionId: questions.id,
        questionText: questions.question,
        answer: testAttempts.answer,
        submittedAt: testAttempts.createdAt,
        attemptId: testAttempts.id,
      })
      .from(testAttempts)
      .innerJoin(testSessions, eq(testAttempts.sessionId, testSessions.id))
      .innerJoin(users, eq(testSessions.studentUserId, users.id))
      .innerJoin(questions, eq(testAttempts.questionId, questions.id))
      .innerJoin(materials, eq(testSessions.materialId, materials.id))
      .leftJoin(classStudents, eq(users.id, classStudents.studentUserId))
      .leftJoin(classes, eq(classStudents.classId, classes.id))
      .where(
        and(
          eq(questions.questionType, 'URAIAN'),
          isNull(testAttempts.isCorrect) // Only fetch ungraded
        )
      )

    const results = await query

    const filtered = testTypeFilter 
      ? results.filter(r => r.testType === testTypeFilter)
      : results

    return NextResponse.json({
      success: true,
      data: filtered.map(r => ({
        ...r,
        // Send a truncated version of the question for easy display
        questionTextShort: r.questionText.length > 50 ? r.questionText.substring(0, 50) + '...' : r.questionText
      }))
    })

  } catch (error) {
    console.error('Fetch essays error:', error)
    return NextResponse.json({ error: 'Failed to fetch essays' }, { status: 500 })
  }
}
