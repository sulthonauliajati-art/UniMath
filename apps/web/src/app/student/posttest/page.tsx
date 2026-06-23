import { redirect } from 'next/navigation'

// Legacy redirect: /student/posttest → /student/evaluasi
export default function PosttestAlias() {
  redirect('/student/evaluasi')
}
