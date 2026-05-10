import { redirect } from 'next/navigation'

// Alias: /student/posttest -> /student/test?type=posttest
export default function PosttestAlias() {
  redirect('/student/test?type=posttest')
}
