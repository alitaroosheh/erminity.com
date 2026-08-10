import { FormEvent, useEffect, useState } from 'react'
import { adminGet, adminPut, PricingConfig } from './api'

export function AdminPricing() {
  const [pricing, setPricing] = useState<PricingConfig | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void adminGet<PricingConfig>('/api/admin/pricing').then(setPricing)
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!pricing) return
    setError(null)
    setMessage(null)
    try {
      const saved = await adminPut<PricingConfig>('/api/admin/pricing', {
        currency: pricing.currency,
        proMonthlyPrice: pricing.proMonthlyPrice,
        proYearlyPrice: pricing.proYearlyPrice,
        paddlePriceIdMonthly: pricing.paddlePriceIdMonthly,
        paddlePriceIdYearly: pricing.paddlePriceIdYearly,
        showComingSoonWhenEmpty: pricing.showComingSoonWhenEmpty,
      })
      setPricing(saved)
      setMessage('Saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save_failed')
    }
  }

  if (!pricing) return <div className="admin-panel">Loading…</div>

  return (
    <div className="admin-panel">
      <h1>Pricing</h1>
      <p className="muted">Leave prices empty to show “coming soon” when the toggle is on.</p>
      <form className="form admin-form" onSubmit={onSubmit}>
        <label>
          Currency
          <input
            value={pricing.currency}
            onChange={(e) => setPricing({ ...pricing, currency: e.target.value })}
            required
          />
        </label>
        <label>
          Pro monthly
          <input
            type="number"
            step="0.01"
            value={pricing.proMonthlyPrice ?? ''}
            onChange={(e) =>
              setPricing({
                ...pricing,
                proMonthlyPrice: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </label>
        <label>
          Pro yearly
          <input
            type="number"
            step="0.01"
            value={pricing.proYearlyPrice ?? ''}
            onChange={(e) =>
              setPricing({
                ...pricing,
                proYearlyPrice: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </label>
        <label>
          Paddle price ID (monthly)
          <input
            value={pricing.paddlePriceIdMonthly ?? ''}
            onChange={(e) => setPricing({ ...pricing, paddlePriceIdMonthly: e.target.value })}
          />
        </label>
        <label>
          Paddle price ID (yearly)
          <input
            value={pricing.paddlePriceIdYearly ?? ''}
            onChange={(e) => setPricing({ ...pricing, paddlePriceIdYearly: e.target.value })}
          />
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={pricing.showComingSoonWhenEmpty}
            onChange={(e) => setPricing({ ...pricing, showComingSoonWhenEmpty: e.target.checked })}
          />
          Show “coming soon” when prices are empty
        </label>
        {message && <p className="form-ok">{message}</p>}
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" type="submit">
          Save pricing
        </button>
      </form>
    </div>
  )
}
