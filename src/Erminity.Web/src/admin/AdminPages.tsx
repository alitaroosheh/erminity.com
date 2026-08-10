import { FormEvent, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminGet, adminPost, PageSummary } from './api'

export function AdminPages() {
  const { locale = 'en' } = useParams()
  const [pages, setPages] = useState<PageSummary[]>([])
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    setPages(await adminGet<PageSummary[]>('/api/admin/pages'))
  }

  useEffect(() => {
    void reload()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const page = await adminPost<{ id: string }>('/api/admin/pages', { slug, title: slug })
      setSlug('')
      await reload()
      window.location.href = `/${locale}/admin/pages/${page.id}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'create_failed')
    }
  }

  return (
    <div className="admin-panel">
      <h1>Pages</h1>
      <p className="muted">Edit marketing pages per locale. Publish when ready for the public site.</p>

      <form className="form admin-form admin-inline" onSubmit={onCreate}>
        <label>
          New slug
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="home" required />
        </label>
        <button className="btn btn-primary" type="submit">
          Create page
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Slug</th>
            <th>Published</th>
            <th>Locales</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.id}>
              <td>{p.slug}</td>
              <td>{p.isPublished ? 'Yes' : 'Draft'}</td>
              <td>{p.locales.join(', ')}</td>
              <td>
                <Link to={`/${locale}/admin/pages/${p.id}`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
