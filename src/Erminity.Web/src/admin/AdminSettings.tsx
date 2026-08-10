import { FormEvent, useEffect, useState } from 'react'
import { adminGet, adminPut, MediaItem, SiteSettings } from './api'

export function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void Promise.all([
      adminGet<SiteSettings>('/api/admin/settings'),
      adminGet<MediaItem[]>('/api/admin/media'),
    ]).then(([s, m]) => {
      setSettings(s)
      setMedia(m)
    })
  }, [])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!settings) return
    setError(null)
    setMessage(null)
    try {
      const saved = await adminPut<SiteSettings>('/api/admin/settings', {
        siteName: settings.siteName,
        slogan: settings.slogan,
        faviconMediaId: settings.faviconMediaId || null,
        logoMediaId: settings.logoMediaId || null,
        defaultOgImageMediaId: settings.defaultOgImageMediaId || null,
        legalName: settings.legalName || null,
        legalAddress: settings.legalAddress || null,
        privacyEmail: settings.privacyEmail || null,
        jurisdiction: settings.jurisdiction || null,
      })
      setSettings(saved)
      setMessage('Saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save_failed')
    }
  }

  if (!settings) return <div className="admin-panel">Loading…</div>

  return (
    <div className="admin-panel">
      <h1>Site settings</h1>
      <p className="muted">Brand, favicon/logo media IDs, and legal imprint fields (placeholders until filled).</p>
      <form className="form admin-form" onSubmit={onSubmit}>
        <label>
          Site name
          <input
            value={settings.siteName}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            required
          />
        </label>
        <label>
          Slogan
          <input
            value={settings.slogan}
            onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
            required
          />
        </label>
        <label>
          Favicon media
          <select
            value={settings.faviconMediaId ?? ''}
            onChange={(e) => setSettings({ ...settings, faviconMediaId: e.target.value || null })}
          >
            <option value="">— none —</option>
            {media.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fileName} ({m.altText})
              </option>
            ))}
          </select>
        </label>
        <label>
          Logo media
          <select
            value={settings.logoMediaId ?? ''}
            onChange={(e) => setSettings({ ...settings, logoMediaId: e.target.value || null })}
          >
            <option value="">— none —</option>
            {media.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fileName} ({m.altText})
              </option>
            ))}
          </select>
        </label>

        <h2>Legal / imprint</h2>
        <label>
          Legal name
          <input
            placeholder={settings.legalNamePlaceholder}
            value={settings.legalName ?? ''}
            onChange={(e) => setSettings({ ...settings, legalName: e.target.value })}
          />
        </label>
        <label>
          Address
          <input
            placeholder={settings.legalAddressPlaceholder}
            value={settings.legalAddress ?? ''}
            onChange={(e) => setSettings({ ...settings, legalAddress: e.target.value })}
          />
        </label>
        <label>
          Privacy email
          <input
            placeholder={settings.privacyEmailPlaceholder}
            value={settings.privacyEmail ?? ''}
            onChange={(e) => setSettings({ ...settings, privacyEmail: e.target.value })}
          />
        </label>
        <label>
          Jurisdiction
          <input
            placeholder={settings.jurisdictionPlaceholder}
            value={settings.jurisdiction ?? ''}
            onChange={(e) => setSettings({ ...settings, jurisdiction: e.target.value })}
          />
        </label>

        {message && <p className="form-ok">{message}</p>}
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" type="submit">
          Save settings
        </button>
      </form>
    </div>
  )
}
