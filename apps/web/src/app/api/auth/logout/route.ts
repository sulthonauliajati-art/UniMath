import { NextRequest, NextResponse } from 'next/server'
import { revokeToken } from '@/lib/auth/utils'

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      await revokeToken(token)
    }

    return NextResponse.json({ success: true, message: 'Berhasil logout' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
