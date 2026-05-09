import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { materials, materialContents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { id } = await params
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

    await db
      .update(materials)
      .set({
        title,
        description: description || null,
        grade: grade || '10',
        videoUrl: videoUrl || null,
        summaryUrl: summaryUrl || null,
        fullUrl: fullUrl || null,
      })
      .where(eq(materials.id, id))

    // Upsert content variants (treat undefined as "don't touch", null as "clear")
    if (summaryContent !== undefined) {
      await upsertContentVariant(id, 'SHORT', summaryContent || null, title || id)
    }
    if (fullContent !== undefined) {
      await upsertContentVariant(id, 'FULL', fullContent || null, title || id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update material error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { id } = await params

    // Cascade: remove material_contents first to avoid orphan rows
    await db.delete(materialContents).where(eq(materialContents.materialId, id))
    await db.delete(materials).where(eq(materials.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete material error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
