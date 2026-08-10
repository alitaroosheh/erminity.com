import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Kind = 'privacy' | 'terms' | 'cookies' | 'imprint'

type LegalInfo = {
  name: string
  address: string
  privacyEmail: string
  jurisdiction: string
  isConfigured: boolean
}

export function LegalPage({ kind }: { kind: Kind }) {
  const { t } = useTranslation()
  const [legal, setLegal] = useState<LegalInfo | null>(null)

  useEffect(() => {
    void fetch('/api/public/site')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setLegal(data?.legal ?? null))
      .catch(() => setLegal(null))
  }, [])

  const title = t(`footer.${kind === 'privacy' ? 'privacy' : kind === 'terms' ? 'terms' : kind === 'cookies' ? 'cookies' : 'imprint'}`)

  return (
    <div className="page-narrow">
      <h1>{title}</h1>
      <p className="muted">
        Content is managed from the Admin CMS. Until published, placeholders remain visible.
      </p>
      {kind === 'imprint' && legal && (
        <div style={{ marginTop: '1.5rem', lineHeight: 1.8 }}>
          <div>
            <strong>Legal name:</strong> {legal.name}
          </div>
          <div>
            <strong>Address:</strong> {legal.address}
          </div>
          <div>
            <strong>Privacy email:</strong> {legal.privacyEmail}
          </div>
          <div>
            <strong>Jurisdiction:</strong> {legal.jurisdiction}
          </div>
          {!legal.isConfigured && (
            <p className="muted" style={{ marginTop: '1rem' }}>
              Configure these fields in Admin → Site settings.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
