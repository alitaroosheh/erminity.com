import { useEffect, useState } from 'react'
import { adminGet, adminPost, ContactItem } from './api'

export function AdminContacts() {
  const [items, setItems] = useState<ContactItem[]>([])

  async function reload() {
    setItems(await adminGet<ContactItem[]>('/api/admin/contacts'))
  }

  useEffect(() => {
    void reload()
  }, [])

  return (
    <div className="admin-panel">
      <h1>Enterprise contacts</h1>
      <div className="contact-list">
        {items.map((c) => (
          <article key={c.id} className={`contact-card${c.isHandled ? ' is-handled' : ''}`}>
            <header>
              <strong>{c.name || c.email}</strong>
              <span className="muted">{new Date(c.createdAt).toLocaleString()}</span>
            </header>
            <div>{c.email}</div>
            <div className="muted">{c.company}</div>
            <p>{c.message}</p>
            {!c.isHandled && (
              <button
                type="button"
                className="btn btn-teal"
                onClick={() => {
                  void adminPost(`/api/admin/contacts/${c.id}/handled`).then(reload)
                }}
              >
                Mark handled
              </button>
            )}
          </article>
        ))}
        {items.length === 0 && <p className="muted">No inquiries yet.</p>}
      </div>
    </div>
  )
}
