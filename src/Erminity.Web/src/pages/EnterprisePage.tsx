import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

export function EnterprisePage() {
  const { t } = useTranslation()
  const { locale = 'en' } = useParams()
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setPending(true)
    try {
      await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          email: fd.get('email'),
          company: fd.get('company'),
          message: fd.get('message'),
          locale,
          isEnterpriseInquiry: true,
        }),
      })
      setDone(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="page-narrow">
      <h1>{t('enterprise.title')}</h1>
      <p className="muted">{t('enterprise.lead')}</p>
      {done ? (
        <p style={{ marginTop: '1.5rem', color: 'var(--accent)' }}>{t('enterprise.thanks')}</p>
      ) : (
        <form className="form" onSubmit={onSubmit}>
          <label>
            {t('enterprise.name')}
            <input name="name" required autoComplete="name" />
          </label>
          <label>
            {t('enterprise.email')}
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            {t('enterprise.company')}
            <input name="company" autoComplete="organization" />
          </label>
          <label>
            {t('enterprise.message')}
            <textarea name="message" required />
          </label>
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {t('enterprise.submit')}
          </button>
        </form>
      )}
    </div>
  )
}
