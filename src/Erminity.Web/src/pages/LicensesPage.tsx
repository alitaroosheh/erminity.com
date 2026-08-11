import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'

type LicenseRow = {
  id: string
  plan: string
  status: string
  keyPrefix: string
  key: string | null
  billingInterval: string
  currentPeriodEnd?: string | null
  features: string[]
  createdAt: string
  device?: {
    label?: string | null
    ideProduct?: string | null
    activatedAt: string
    lastSeenAt?: string | null
  } | null
}

export function LicensesPage() {
  const { t } = useTranslation()
  const { locale = 'en' } = useParams()
  const { user, loading } = useAuth()
  const [items, setItems] = useState<LicenseRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  async function reload() {
    const res = await fetch('/api/license/me', { credentials: 'include' })
    if (!res.ok) throw new Error('load_failed')
    setItems((await res.json()) as LicenseRow[])
  }

  useEffect(() => {
    if (!user) return
    void reload().catch(() => setError(t('licenses.loadError')))
  }, [user, t])

  if (loading) return <div className="page-narrow">{t('auth.loading')}</div>
  if (!user) return <Navigate to={`/${locale}/signin`} replace />

  async function deactivate(id: string) {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/license/me/${id}/deactivate-device`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('deactivate_failed')
      await reload()
    } catch {
      setError(t('licenses.deactivateError'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page-narrow auth-card" style={{ maxWidth: '52rem' }}>
      <h1>{t('licenses.title')}</h1>
      <p className="muted">{t('licenses.lead')}</p>
      <p>
        <Link to={`/${locale}/account`}>{t('licenses.backAccount')}</Link>
      </p>
      {error && <p className="form-error">{error}</p>}
      {items.length === 0 ? (
        <p className="muted" style={{ marginTop: '1.5rem' }}>
          {t('licenses.empty')}
        </p>
      ) : (
        <div className="license-list">
          {items.map((lic) => (
            <article key={lic.id} className="license-card">
              <header>
                <strong>
                  {lic.plan} · {lic.status}
                </strong>
                <span className="muted">{lic.billingInterval}</span>
              </header>
              <div className="license-key-row">
                <code>{lic.key ?? `${lic.keyPrefix}…`}</code>
                {lic.key && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      void navigator.clipboard.writeText(lic.key!)
                      setCopied(lic.id)
                      setTimeout(() => setCopied(null), 1500)
                    }}
                  >
                    {copied === lic.id ? t('licenses.copied') : t('licenses.copy')}
                  </button>
                )}
              </div>
              <div className="muted">
                {t('licenses.features')}: {lic.features.join(', ') || '—'}
              </div>
              {lic.currentPeriodEnd && (
                <div className="muted">
                  {t('licenses.periodEnd')}: {new Date(lic.currentPeriodEnd).toLocaleString()}
                </div>
              )}
              <div className="license-device">
                <strong>{t('licenses.device')}</strong>
                {lic.device ? (
                  <>
                    <div>
                      {lic.device.label || 'Device'} {lic.device.ideProduct ? `· ${lic.device.ideProduct}` : ''}
                    </div>
                    <div className="muted">
                      {t('licenses.activated')}: {new Date(lic.device.activatedAt).toLocaleString()}
                    </div>
                    <button
                      type="button"
                      className="btn btn-teal"
                      disabled={busyId === lic.id}
                      onClick={() => void deactivate(lic.id)}
                    >
                      {t('licenses.deactivate')}
                    </button>
                  </>
                ) : (
                  <div className="muted">{t('licenses.noDevice')}</div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
