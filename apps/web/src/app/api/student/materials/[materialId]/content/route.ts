import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { materialContents, materials } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * GET /api/student/materials/[materialId]/content?variant=SHORT
 * 
 * Returns the learning content for a given material.
 * Used by the "Wajib Belajar" flow to show the correct material
 * when a student gets 3 consecutive wrong answers.
 * 
 * Query params:
 *   variant: "SHORT" (default) or "FULL"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const { materialId } = await params
    const { searchParams } = new URL(request.url)
    const variant = searchParams.get('variant')?.toUpperCase() || 'SHORT'

    // Validate variant
    if (!['SHORT', 'FULL'].includes(variant)) {
      return NextResponse.json(
        { error: { code: 'INVALID_VARIANT', message: 'Variant harus SHORT atau FULL' } },
        { status: 400 }
      )
    }

    // Get material info
    const [material] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1)

    if (!material) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Materi tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Get content for this material + variant
    const [content] = await db
      .select()
      .from(materialContents)
      .where(
        and(
          eq(materialContents.materialId, materialId),
          eq(materialContents.contentVariant, variant)
        )
      )
      .limit(1)

    if (!content) {
      return NextResponse.json(
        { error: { code: 'CONTENT_NOT_FOUND', message: `Konten ${variant} untuk materi ${materialId} tidak ditemukan` } },
        { status: 404 }
      )
    }

    // Parse JSON fields safely
    const parseJSON = (raw: string | null) => {
      if (!raw) return null
      try {
        return JSON.parse(raw)
      } catch {
        return raw // return as-is if not valid JSON
      }
    }

    return NextResponse.json({
      material: {
        id: material.id,
        title: material.title,
      },
      content: {
        id: content.id,
        materialId: content.materialId,
        materialType: content.materialType,
        contentVariant: content.contentVariant,
        displayTitle: content.displayTitle,
        shortDescription: content.shortDescription,
        whyRedirected: content.whyRedirected,
        learningObjectives: parseJSON(content.learningObjectives),
        conceptText: content.conceptText,
        formulas: parseJSON(content.formulas),
        steps: parseJSON(content.steps),
        examples: parseJSON(content.examples),
        commonMistakes: parseJSON(content.commonMistakes),
        checkpointItems: parseJSON(content.checkpointItems),
        bodyMarkdown: content.bodyMarkdown,
        wajibBelajarMessage: content.wajibBelajarMessage,
        triggerCommonErrors: content.triggerCommonErrors,
        relatedFloorStart: content.relatedFloorStart,
        relatedFloorEnd: content.relatedFloorEnd,
        relatedIndicators: content.relatedIndicators,
        relatedRemedialIds: content.relatedRemedialIds,
        estimatedReadingMinutes: content.estimatedReadingMinutes,
      },
    })
  } catch (error) {
    console.error('Get material content error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
