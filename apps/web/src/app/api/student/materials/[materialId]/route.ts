import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { materials } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const { materialId } = await params

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

    return NextResponse.json({
      material: {
        id: material.id,
        title: material.title,
        description: material.description,
        grade: material.grade,
        summaryUrl: material.summaryUrl,
        fullUrl: material.fullUrl,
        videoUrl: material.videoUrl,
        thumbnailUrl: material.thumbnailUrl,
      },
    })
  } catch (error) {
    console.error('Get material error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
