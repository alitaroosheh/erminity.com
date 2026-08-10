import { FormEvent, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminGet, adminPut, MediaItem, PageDetail } from './api'

const LOCALES = ['en', 'de', 'fr', 'ar']

type Block = {
  type: string
  text?: string | null
  mediaId?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
}

export function AdminPageEdit() {
  const { locale: routeLocale = 'en', pageId } = useParams()
  const [editLocale, setEditLocale] = useState('en')
  const [page, setPage] = useState<PageDetail | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pageId) return
    void Promise.all([
      adminGet<PageDetail>(`/api/admin/pages/${pageId}?locale=${editLocale}`),
      adminGet<MediaItem[]>('/api/admin/media'),
    ]).then(([p, m]) => {
      setPage(p)
      setMedia(m)
    })
  }, [pageId, editLocale])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!page || !pageId) return
    setError(null)
    setMessage(null)
    try {
      const saved = await adminPut<PageDetail>(`/api/admin/pages/${pageId}`, {
        locale: editLocale,
        isPublished: page.isPublished,
        title: page.title,
        metaDescription: page.metaDescription,
        canonicalPath: page.canonicalPath,
        robots: page.robots,
        ogTitle: page.ogTitle,
        ogDescription: page.ogDescription,
        ogImageMediaId: page.ogImageMediaId || null,
        sections: page.sections,
      })
      setPage(saved)
      setMessage('Saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save_failed')
    }
  }

  function updateBlock(sectionIndex: number, blockIndex: number, patch: Partial<Block>) {
    if (!page) return
    const sections = page.sections.map((s, si) => {
      if (si !== sectionIndex) return s
      return {
        ...s,
        blocks: s.blocks.map((b, bi) => (bi === blockIndex ? { ...b, ...patch } : b)),
      }
    })
    setPage({ ...page, sections })
  }

  function addBlock(sectionIndex: number, type: string) {
    if (!page) return
    const sections = page.sections.map((s, si) => {
      if (si !== sectionIndex) return s
      const block: Block =
        type === 'cta'
          ? { type: 'cta', ctaLabel: 'CTA', ctaHref: '/' }
          : type === 'image'
            ? { type: 'image', mediaId: media[0]?.id ?? null }
            : { type: 'text', text: '' }
      return { ...s, blocks: [...s.blocks, block] }
    })
    setPage({ ...page, sections })
  }

  if (!page) return <div className="admin-panel">Loading…</div>

  return (
    <div className="admin-panel">
      <p>
        <Link to={`/${routeLocale}/admin/pages`}>← Pages</Link>
      </p>
      <h1>
        Edit <code>{page.slug}</code>
      </h1>

      <div className="lang-switch" style={{ marginBottom: '1rem' }}>
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            className={`lang-btn${editLocale === l ? ' active' : ''}`}
            onClick={() => setEditLocale(l)}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <form className="form admin-form" onSubmit={onSubmit}>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={page.isPublished}
            onChange={(e) => setPage({ ...page, isPublished: e.target.checked })}
          />
          Published
        </label>
        <label>
          Title
          <input value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} required />
        </label>
        <label>
          Meta description
          <textarea
            value={page.metaDescription ?? ''}
            onChange={(e) => setPage({ ...page, metaDescription: e.target.value })}
          />
        </label>
        <label>
          Robots
          <input value={page.robots} onChange={(e) => setPage({ ...page, robots: e.target.value })} />
        </label>
        <label>
          OG title
          <input value={page.ogTitle ?? ''} onChange={(e) => setPage({ ...page, ogTitle: e.target.value })} />
        </label>
        <label>
          OG description
          <textarea
            value={page.ogDescription ?? ''}
            onChange={(e) => setPage({ ...page, ogDescription: e.target.value })}
          />
        </label>
        <label>
          OG image
          <select
            value={page.ogImageMediaId ?? ''}
            onChange={(e) => setPage({ ...page, ogImageMediaId: e.target.value || null })}
          >
            <option value="">— none —</option>
            {media.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fileName}
              </option>
            ))}
          </select>
        </label>

        {page.sections.map((section, si) => (
          <div key={`${section.key}-${si}`} className="admin-section">
            <h2>Section: {section.key}</h2>
            {section.blocks.map((block, bi) => (
              <div key={bi} className="admin-block">
                <div className="muted">#{bi + 1} · {block.type}</div>
                {block.type === 'text' && (
                  <textarea
                    value={block.text ?? ''}
                    onChange={(e) => updateBlock(si, bi, { text: e.target.value })}
                  />
                )}
                {block.type === 'cta' && (
                  <>
                    <input
                      placeholder="Label"
                      value={block.ctaLabel ?? ''}
                      onChange={(e) => updateBlock(si, bi, { ctaLabel: e.target.value })}
                    />
                    <input
                      placeholder="Href"
                      value={block.ctaHref ?? ''}
                      onChange={(e) => updateBlock(si, bi, { ctaHref: e.target.value })}
                    />
                  </>
                )}
                {block.type === 'image' && (
                  <select
                    value={block.mediaId ?? ''}
                    onChange={(e) => updateBlock(si, bi, { mediaId: e.target.value || null })}
                  >
                    <option value="">— select media —</option>
                    {media.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fileName} ({m.altText})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
            <div className="admin-inline">
              <button type="button" className="btn btn-ghost" onClick={() => addBlock(si, 'text')}>
                + Text
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => addBlock(si, 'cta')}>
                + CTA
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => addBlock(si, 'image')}>
                + Image
              </button>
            </div>
          </div>
        ))}

        {message && <p className="form-ok">{message}</p>}
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" type="submit">
          Save page ({editLocale})
        </button>
      </form>
    </div>
  )
}
