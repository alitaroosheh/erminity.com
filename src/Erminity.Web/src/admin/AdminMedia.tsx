import { FormEvent, useEffect, useState } from 'react'
import { adminDelete, adminGet, adminPost, MediaItem } from './api'

export function AdminMedia() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function reload() {
    setItems(await adminGet<MediaItem[]>('/api/admin/media'))
  }

  useEffect(() => {
    void reload()
  }, [])

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    const fd = new FormData(e.currentTarget)
    const alt = String(fd.get('altText') ?? '').trim()
    if (!alt) {
      setError('alt_required')
      return
    }
    try {
      await adminPost('/api/admin/media', fd)
      e.currentTarget.reset()
      setMessage('Uploaded.')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload_failed')
    }
  }

  return (
    <div className="admin-panel">
      <h1>Media library</h1>
      <p className="muted">Alt text is required before upload. Max ~5MB. Images only.</p>

      <form className="form admin-form" onSubmit={onUpload}>
        <label>
          File
          <input name="file" type="file" accept="image/*,.ico" required />
        </label>
        <label>
          Alt text *
          <input name="altText" required />
        </label>
        <label>
          Title
          <input name="title" />
        </label>
        <label>
          Caption
          <input name="caption" />
        </label>
        {message && <p className="form-ok">{message}</p>}
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" type="submit">
          Upload
        </button>
      </form>

      <div className="media-grid">
        {items.map((m) => (
          <article key={m.id} className="media-card">
            <img src={m.url} alt={m.altText} />
            <div>
              <strong>{m.fileName}</strong>
              <div className="muted">{m.altText}</div>
              <code>{m.id}</code>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                void adminDelete(`/api/admin/media/${m.id}`).then(reload)
              }}
            >
              Delete
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
