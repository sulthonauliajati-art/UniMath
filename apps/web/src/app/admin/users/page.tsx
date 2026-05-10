import AdminUsersClient from './AdminUsersClient'

export const dynamic = 'force-dynamic'

export default function AdminUsersPage() {
  // Server fetching removed — the client fetches `/api/admin/users` so the
  // list can be refreshed after create/edit/reset without a full page reload.
  return <AdminUsersClient />
}
