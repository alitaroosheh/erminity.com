import { Navigate, NavLink, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { locale = 'en' } = useParams()
  if (loading) return <div className="page-narrow">Loading…</div>
  if (!user) return <Navigate to={`/${locale}/signin`} replace />
  if (!user.roles.includes('Admin')) return <Navigate to={`/${locale}/account`} replace />
  return children
}

export function AdminLayout() {
  const { locale = 'en' } = useParams()
  const prefix = `/${locale}/admin`

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <div className="admin-nav__brand">Erminity Admin</div>
        <NavLink to={prefix} end>
          Overview
        </NavLink>
        <NavLink to={`${prefix}/settings`}>Site settings</NavLink>
        <NavLink to={`${prefix}/pricing`}>Pricing</NavLink>
        <NavLink to={`${prefix}/media`}>Media</NavLink>
        <NavLink to={`${prefix}/pages`}>Pages</NavLink>
        <NavLink to={`${prefix}/contacts`}>Contacts</NavLink>
        <NavLink className="admin-nav__back" to={`/${locale}`}>
          ← Back to site
        </NavLink>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  )
}
