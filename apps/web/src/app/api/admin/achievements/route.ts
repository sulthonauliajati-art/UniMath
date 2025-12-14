import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { achievements } from '@/lib/db/schema'
import { validateToken } from '@/lib/auth/utils'
import { eq } from 'drizzle-orm'

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

    const allAchievements = await db.select().from(achievements)
    return NextResponse.json({ achievements: allAchievements })
  } catch (error) {
    console.error('Get achievements error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}

// Create new achievement
export async function POST(request: NextRequest) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { name, description, icon, type, requirement, points } = await request.json()

    if (!name || !description || !icon || !type) {
      return NextResponse.json({ error: { message: 'Data tidak lengkap' } }, { status: 400 })
    }

    const id = `ACH${Date.now()}`
    await db.insert(achievements).values({
      id,
      name,
      description,
      icon,
      type: type as 'FLOOR' | 'ACCURACY' | 'STREAK' | 'MATERIAL' | 'SPECIAL',
      requirement: requirement || 10,
      points: points || 10,
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Create achievement error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}

// Update achievement
export async function PUT(request: NextRequest) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { id, name, description, icon, type, requirement, points } = await request.json()

    if (!id) {
      return NextResponse.json({ error: { message: 'ID diperlukan' } }, { status: 400 })
    }

    await db
      .update(achievements)
      .set({
        name,
        description,
        icon,
        type: type as 'FLOOR' | 'ACCURACY' | 'STREAK' | 'MATERIAL' | 'SPECIAL',
        requirement,
        points,
      })
      .where(eq(achievements.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update achievement error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}

// Delete achievement
export async function DELETE(request: NextRequest) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: { message: 'ID diperlukan' } }, { status: 400 })
    }

    await db.delete(achievements).where(eq(achievements.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete achievement error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
