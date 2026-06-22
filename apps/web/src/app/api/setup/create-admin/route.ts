import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

/**
 * One-time setup endpoint to create the first admin account.
 *
 * REQUIRED environment variables:
 *   SETUP_SECRET_KEY   — shared secret to authorize setup
 *   ADMIN_EMAIL        — admin email address
 *   ADMIN_PASSWORD     — admin password (min 8 chars)
 *
 * Optional:
 *   ADMIN_NAME         — display name (default: "Super Admin")
 *   ADMIN_ID           — user ID (default: "ADMIN001")
 *
 * SECURITY: Delete this file or unset SETUP_SECRET_KEY after first admin creation.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Check if setup is still enabled ──
    const setupKey = process.env.SETUP_SECRET_KEY
    if (!setupKey) {
      return NextResponse.json(
        { error: { code: 'SETUP_DISABLED', message: 'Setup admin tidak tersedia. SETUP_SECRET_KEY tidak dikonfigurasi.' } },
        { status: 410 }
      )
    }

    const { secretKey } = await request.json()

    if (secretKey !== setupKey) {
      return NextResponse.json(
        { error: { code: 'INVALID_KEY', message: 'Kunci setup tidak valid' } },
        { status: 403 }
      )
    }

    // ── Check if admin already exists ──
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.role, 'ADMIN'))
      .limit(1)

    if (existingAdmin) {
      return NextResponse.json(
        { error: { code: 'ADMIN_EXISTS', message: 'Admin sudah ada. Setup hanya bisa dilakukan sekali.' } },
        { status: 409 }
      )
    }

    // ── Read credentials from environment ──
    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: 'CONFIG_ERROR', message: 'ADMIN_EMAIL dan ADMIN_PASSWORD harus dikonfigurasi di environment variables.' } },
        { status: 500 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Password admin minimal 8 karakter.' } },
        { status: 400 }
      )
    }

    const adminName = process.env.ADMIN_NAME || 'Super Admin'
    const adminId = process.env.ADMIN_ID || 'ADMIN001'
    const hashedPassword = await bcrypt.hash(password, 10)

    await db.insert(users).values({
      id: adminId,
      role: 'ADMIN',
      name: adminName,
      email,
      password: hashedPassword,
      passwordStatus: 'SET',
      createdAt: new Date().toISOString(),
    })

    // ⚠️ NEVER return credentials in production — only confirm success
    return NextResponse.json({
      success: true,
      message: 'Admin berhasil dibuat! Silakan login dengan kredensial yang telah dikonfigurasi.',
    })
  } catch (error) {
    console.error('Create admin error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
