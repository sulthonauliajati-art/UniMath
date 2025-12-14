import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { materials, questions } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

async function validateAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null

  const tokenData = await validateToken(token)
  if (!tokenData.valid || tokenData.role !== 'ADMIN') return null
  return tokenData
}

export async function GET(request: NextRequest) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const allMaterials = await db.select().from(materials).orderBy(materials.order)

    // Get question count for each material
    const materialsWithCount = await Promise.all(
      allMaterials.map(async (mat) => {
        const [count] = await db
          .select({ count: sql<number>`count(*)` })
          .from(questions)
          .where(eq(questions.materialId, mat.id))
        return { ...mat, questionCount: count?.count || 0 }
      })
    )

    return NextResponse.json({ materials: materialsWithCount })
  } catch (error) {
    console.error('Get materials error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { title, description, grade, videoUrl, summaryUrl, fullUrl } = await request.json()

    if (!title) {
      return NextResponse.json({ error: { message: 'Judul diperlukan' } }, { status: 400 })
    }

    // Get max order
    const [maxOrder] = await db
      .select({ max: sql<number>`COALESCE(MAX(${materials.order}), 0)` })
      .from(materials)

    const newId = `MAT${Date.now().toString(36).toUpperCase()}`
    const newMaterial = {
      id: newId,
      title,
      description: description || null,
      grade: grade || '4',
      videoUrl: videoUrl || null,
      summaryUrl: summaryUrl || null,
      fullUrl: fullUrl || null,
      order: (maxOrder?.max || 0) + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    await db.insert(materials).values(newMaterial)

    return NextResponse.json({ material: newMaterial })
  } catch (error) {
    console.error('Create material error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
