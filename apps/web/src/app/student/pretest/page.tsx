import { redirect } from 'next/navigation'

// Alias: /student/pretest -> /student/test?type=pretest
// Kept so old bookmarks/shares and the 404 in the audit are resolved.
export default function PretestAlias() {
  redirect('/student/test?type=pretest')
}
