import { redirect } from 'next/navigation'

// Legacy redirect: /student/pretest → /student/evaluasi
export default function PretestAlias() {
  redirect('/student/evaluasi')
}
