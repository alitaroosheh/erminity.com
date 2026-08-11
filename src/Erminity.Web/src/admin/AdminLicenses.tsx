import { FormEvent, useEffect, useState } from 'react'
import { adminGet, adminPost } from './api'

type LicenseAdminRow = {
  id: string
  plan: string
  status: string
  keyPrefix: string
  billingInterval: string
  currentPeriodEnd?: string | null
  createdAt: string
  userEmail?: string | null
  deviceLabel?: string | null
  ideProduct?: string | null
  hasDevice: boolean
}

type Issued = {
  id: string
  key: string
  userEmail?: string
  plan: string
}

export function AdminLicenses() {
  const [items, setItems] = useState<LicenseAdminRow[]>([])
  const [email, setEmail] = useState('admin@erminity.com')
  const [plan, setPlan] = useState('Pro')
  const [interval, setInterval] = useState('month')
  const [issued, setIssued] = useState<Issued | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    setItems(await adminGet<LicenseAdminRow[]>('/api/admin/licenses'))
  }

  useEffect(() => {
    void reload().catch(() => setError('load_failed'))
  }, [])

  async function onIssue(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIssued(null)
    try {
      const result = await adminPost<Issued>('/api/admin/licenses', {
        userEmail: email,
        plan,
        billingInterval: interval,
        periodDays: interval === 'year' ? 365 : 30,
      })
      setIssued(result)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'issue_failed')
    }
  }

  return (
    <div className="admin-panel">
      <h1>Licenses</h1>
      <p className="muted">Issue test Pro/Enterprise keys before Paddle is connected. One device per license.</p>

      <form className="form admin-form" onSubmit={onIssue}>
        <label>
          User email
          <input value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Plan
          <select value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </label>
        <label>
          Interval
          <select value={interval} onChange={(e) => setInterval(e.target.value)}>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        {issued && (
          <p className="form-ok">
            Issued {issued.plan} for {issued.userEmail}: <code>{issued.key}</code>
          </p>
        )}
        <button className="btn btn-primary" type="submit">
          Issue license
        </button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Key</th>
            <th>Device</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((l) => (
            <tr key={l.id}>
              <td>{l.userEmail}</td>
              <td>{l.plan}</td>
              <td>{l.status}</td>
              <td>
                <code>{l.keyPrefix}…</code>
              </td>
              <td>{l.hasDevice ? l.deviceLabel || l.ideProduct || 'Bound' : '—'}</td>
              <td className="admin-inline">
                {l.hasDevice && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      void adminPost(`/api/admin/licenses/${l.id}/force-deactivate`).then(reload)
                    }}
                  >
                    Free device
                  </button>
                )}
                {l.status !== 'Revoked' && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      void adminPost(`/api/admin/licenses/${l.id}/revoke`).then(reload)
                    }}
                  >
                    Revoke
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
