import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { materials } from '@/lib/db/schema'

export async function GET() {
  try {
    const allMaterials = await db.select().from(materials).orderBy(materials.order)

    return NextResponse.json({ materials: allMaterials })
  } catch (error) {
    console.error('Get materials error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
