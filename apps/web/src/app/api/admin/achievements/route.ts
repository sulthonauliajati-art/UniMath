import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { achievements } from '@/lib/db/schema'
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

    const allAchievements = await db.select().from(achievements)
    return NextResponse.json({ achievements: allAchievements })
  } catch (error) {
    console.error('Get achievements error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}

// Seed default achievements
export async function POST(request: NextRequest) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const defaultAchievements = [
      { id: 'ACH001', name: 'Pemula', description: 'Selesaikan latihan pertama', icon: '🌟', type: 'FLOOR' as const, requirement: 1, points: 10 },
      { id: 'ACH002', name: 'Naik 10 Lantai', description: 'Capai total 10 lantai', icon: '🏠', type: 'FLOOR' as const, requirement: 10, points: 20 },
      { id: 'ACH003', name: 'Naik 50 Lantai', description: 'Capai total 50 lantai', icon: '🏢', type: 'FLOOR' as const, requirement: 50, points: 50 },
      { id: 'ACH004', name: 'Naik 100 Lantai', description: 'Capai total 100 lantai', icon: '🏰', type: 'FLOOR' as const, requirement: 100, points: 100 },
      { id: 'ACH005', name: 'Akurasi 70%', description: 'Capai akurasi 70%', icon: '🎯', type: 'ACCURACY' as const, requirement: 70, points: 30 },
      { id: 'ACH006', name: 'Akurasi 90%', description: 'Capai akurasi 90%', icon: '💯', type: 'ACCURACY' as const, requirement: 90, points: 50 },
      { id: 'ACH007', name: 'Rajin Latihan', description: 'Selesaikan 10 sesi latihan', icon: '📚', type: 'STREAK' as const, requirement: 10, points: 40 },
      { id: 'ACH008', name: 'Master Latihan', description: 'Selesaikan 50 sesi latihan', icon: '🎓', type: 'STREAK' as const, requirement: 50, points: 100 },
    ]

    for (const ach of defaultAchievements) {
      try {
        await db.insert(achievements).values(ach)
      } catch {
        // Ignore duplicate errors
      }
    }

    return NextResponse.json({ success: true, count: defaultAchievements.length })
  } catch (error) {
    console.error('Seed achievements error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
