import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { materials } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import StrictTestClient from './StrictTestClient'

export const dynamic = 'force-dynamic'

interface TestPageProps {
  params: Promise<{
    materialId: string
    testType: string
  }>
}

export default async function TestPage({ params }: TestPageProps) {
  const resolvedParams = await params
  const { materialId, testType } = resolvedParams

  // Validate testType
  const upperTestType = testType.toUpperCase()
  if (upperTestType !== 'PRETEST' && upperTestType !== 'POSTTEST') {
    redirect('/student/dashboard')
  }

  // Fetch material
  const [material] = await db
    .select()
    .from(materials)
    .where(eq(materials.id, materialId))

  if (!material) {
    redirect('/student/dashboard')
  }

  return (
    <StrictTestClient
      materialId={material.id}
      materialTitle={material.title}
      testType={upperTestType as 'PRETEST' | 'POSTTEST'}
    />
  )
}
