import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from './client'
import { users } from './schema'
import bcrypt from 'bcryptjs'

async function createAdmin() {
  const email = 'admin@unimath.com'
  const password = 'admin123' // Ganti dengan password yang lebih aman
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    await db.insert(users).values({
      id: 'ADMIN001',
      role: 'ADMIN',
      name: 'Super Admin',
      email,
      password: hashedPassword,
      passwordStatus: 'SET',
      createdAt: new Date().toISOString(),
    })
    console.log('✅ Admin created successfully!')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
  } catch (error) {
    console.error('Error creating admin:', error)
  }
  process.exit(0)
}

createAdmin()
