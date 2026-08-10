import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { adminGet, ContactItem, PageSummary } from './api'

export function AdminHome() {
  const { locale = 'en' } = useParams()
  const [pages, setPages] = useState<PageSummary[]>([])
  const [contacts, setContacts] = useState<ContactItem[]>([])

  useEffect(() => {
    void Promise.all([
      adminGet<PageSummary[]>('/api/admin/pages'),
      adminGet<ContactItem[]>('/api/admin/contacts'),
    ]).then(([p, c]) => {
      setPages(p)
      setContacts(c)
    })
  }, [])

  const openContacts = contacts.filter((c) => !c.isHandled).length

  return (
    <div className="admin-panel">
      <h1>Admin overview</h1>
      <p className="muted">Control brand, content, pricing, media, and enterprise inquiries.</p>
      <div className="admin-cards">
        <article>
          <h3>Pages</h3>
          <p>{pages.length} CMS page(s)</p>
          <Link to={`/${locale}/admin/pages`}>Manage pages</Link>
        </article>
        <article>
          <h3>Contacts</h3>
          <p>{openContacts} open inquiry(ies)</p>
          <Link to={`/${locale}/admin/contacts`}>View inbox</Link>
        </article>
        <article>
          <h3>Site settings</h3>
          <p>Name, slogan, favicon, legal imprint</p>
          <Link to={`/${locale}/admin/settings`}>Edit settings</Link>
        </article>
      </div>
    </div>
  )
}
