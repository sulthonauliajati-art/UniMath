import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { materials, materialContents, questions } from '@/lib/db/schema'
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

/**
 * Upsert the SHORT / FULL material_contents rows for a material.
 * Each variant is stored in material_contents with id `${materialId}-SHORT`
 * or `${materialId}-FULL` to match the CSV import convention.
 */
async function upsertContentVariant(
  materialId: string,
  variant: 'SHORT' | 'FULL',
  bodyMarkdown: string | null,
  displayTitle: string
) {
  const contentId = `${materialId}-${variant}`

  const existing = await db
    .select({ id: materialContents.id })
    .from(materialContents)
    .where(eq(materialContents.id, contentId))
    .limit(1)

  if (!bodyMarkdown) {
    // No content provided — if an old row exists, clear its body but keep the
    // record so it doesn't break foreign references.
    if (existing.length > 0) {
      await db
        .update(materialContents)
        .set({ bodyMarkdown: null })
        .where(eq(materialContents.id, contentId))
    }
    return
  }

  if (existing.length > 0) {
    await db
      .update(materialContents)
      .set({
        bodyMarkdown,
        contentVariant: variant,
        materialType: materialId.startsWith('R') ? 'REMEDIAL' : 'MAIN',
        displayTitle,
        isActive: true,
      })
      .where(eq(materialContents.id, contentId))
  } else {
    await db.insert(materialContents).values({
      id: contentId,
      materialId,
      materialType: materialId.startsWith('R') ? 'REMEDIAL' : 'MAIN',
      contentVariant: variant,
      displayTitle,
      bodyMarkdown,
      isActive: true,
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const allMaterials = await db.select().from(materials).orderBy(materials.order)

    // Single query: fetch all SHORT/FULL contents, then group in JS.
    const allContents = await db
      .select({
        materialId: materialContents.materialId,
        contentVariant: materialContents.contentVariant,
        bodyMarkdown: materialContents.bodyMarkdown,
      })
      .from(materialContents)

    const contentMap = new Map<string, { short: string | null; full: string | null }>()
    for (const c of allContents) {
      const entry = contentMap.get(c.materialId) || { short: null, full: null }
      if (c.contentVariant === 'SHORT') entry.short = c.bodyMarkdown
      else if (c.contentVariant === 'FULL') entry.full = c.bodyMarkdown
      contentMap.set(c.materialId, entry)
    }

    // Get question count for each material (kept as loop for clarity; ~25 rows)
    const materialsWithMeta = await Promise.all(
      allMaterials.map(async (mat) => {
        const [count] = await db
          .select({ count: sql<number>`count(*)` })
          .from(questions)
          .where(eq(questions.materialId, mat.id))

        const contents = contentMap.get(mat.id) || { short: null, full: null }

        return {
          ...mat,
          questionCount: count?.count || 0,
          summaryContent: contents.short,
          fullContent: contents.full,
          hasSummaryContent: !!contents.short,
          hasFullContent: !!contents.full,
        }
      })
    )

    return NextResponse.json({ materials: materialsWithMeta })
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

    const {
      title,
      description,
      grade,
      videoUrl,
      summaryUrl,
      fullUrl,
      summaryContent,
      fullContent,
    } = await request.json()

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
      grade: grade || '10',
      videoUrl: videoUrl || null,
      summaryUrl: summaryUrl || null,
      fullUrl: fullUrl || null,
      order: (maxOrder?.max || 0) + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    await db.insert(materials).values(newMaterial)

    // Upsert SHORT/FULL content variants
    await upsertContentVariant(newId, 'SHORT', summaryContent || null, title)
    await upsertContentVariant(newId, 'FULL', fullContent || null, title)

    return NextResponse.json({ material: newMaterial })
  } catch (error) {
    console.error('Create material error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
