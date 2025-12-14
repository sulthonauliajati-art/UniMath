import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { materials, practiceSessions, attempts } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user')

  if (!userCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = JSON.parse(userCookie.value)

  // Get total floors and sessions from database
  const [sessionStats] = await db
    .select({
      totalFloors: sql<number>`COALESCE(SUM(floor - 1), 0)`,
      totalSessions: sql<number>`count(*)`,
    })
    .from(practiceSessions)
    .where(eq(practiceSessions.studentUserId, user.id))

  // Get accuracy from attempts
  const [attemptStats] = await db
    .select({
      totalAttempts: sql<number>`count(*)`,
      correctAttempts: sql<number>`sum(case when is_correct = 1 then 1 else 0 end)`,
    })
    .from(attempts)
    .innerJoin(practiceSessions, eq(attempts.sessionId, practiceSessions.id))
    .where(eq(practiceSessions.studentUserId, user.id))

  const totalFloors = sessionStats?.totalFloors || 0
  const totalSessions = sessionStats?.totalSessions || 0
  const totalAttempts = attemptStats?.totalAttempts || 0
  const correctAttempts = attemptStats?.correctAttempts || 0
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

  // Get all materials
  const allMaterials = await db.select().from(materials).orderBy(materials.order)

  // Determine current material based on total floors climbed
  const materialIndex = Math.min(Math.floor(totalFloors / 10), allMaterials.length - 1)
  const currentMaterial = allMaterials[materialIndex] || allMaterials[0]

  // Current floor within the material (1-10)
  const currentFloor = (totalFloors % 10) + 1

  return NextResponse.json({
    currentFloor,
    totalFloors,
    currentMaterial: currentMaterial?.title || 'Matematika',
    currentMaterialId: currentMaterial?.id || 'M001',
    accuracy,
    totalSessions,
  })
}
