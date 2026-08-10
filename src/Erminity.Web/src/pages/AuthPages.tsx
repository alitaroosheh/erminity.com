import { FormEvent, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'

function mapError(code: string, t: (k: string) => string) {
  switch (code) {
    case 'invalid_credentials':
      return t('auth.errors.invalid')
    case 'email_not_confirmed':
      return t('auth.errors.unconfirmed')
    case 'locked_out':
      return t('auth.errors.locked')
    case 'email_taken':
      return t('auth.errors.taken')
    case 'registration_failed':
      return t('auth.errors.registerFailed')
    default:
      return t('auth.errors.generic')
  }
}

export function SignInPage() {
  const { t } = useTranslation()
  const { locale = 'en' } = useParams()
  const { user, loading, login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!loading && user) return <Navigate to={`/${locale}/account`} replace />

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const fd = new FormData(e.currentTarget)
    const result = await login(String(fd.get('email') ?? ''), String(fd.get('password') ?? ''))
    setPending(false)
    if (!result.ok) setError(mapError(result.error, t))
  }

  return (
    <div className="page-narrow auth-card">
      <h1>{t('auth.signInTitle')}</h1>
      <p className="muted">{t('auth.signInLead')}</p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          {t('auth.email')}
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          {t('auth.password')}
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {t('auth.signInSubmit')}
        </button>
      </form>
      <p className="auth-switch">
        {t('auth.noAccount')}{' '}
        <Link to={`/${locale}/signup`}>{t('auth.signUpLink')}</Link>
      </p>
    </div>
  )
}

export function SignUpPage() {
  const { t } = useTranslation()
  const { locale = 'en' } = useParams()
  const { user, loading, register } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!loading && user) return <Navigate to={`/${locale}/account`} replace />

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const fd = new FormData(e.currentTarget)
    const result = await register(
      String(fd.get('email') ?? ''),
      String(fd.get('password') ?? ''),
      String(fd.get('displayName') ?? '') || undefined,
    )
    setPending(false)
    if (!result.ok) setError(mapError(result.error, t))
  }

  return (
    <div className="page-narrow auth-card">
      <h1>{t('auth.signUpTitle')}</h1>
      <p className="muted">{t('auth.signUpLead')}</p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          {t('auth.displayName')}
          <input name="displayName" autoComplete="name" />
        </label>
        <label>
          {t('auth.email')}
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          {t('auth.password')}
          <input name="password" type="password" autoComplete="new-password" required minLength={10} />
        </label>
        <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
          {t('auth.passwordHint')}
        </p>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {t('auth.signUpSubmit')}
        </button>
      </form>
      <p className="auth-switch">
        {t('auth.hasAccount')}{' '}
        <Link to={`/${locale}/signin`}>{t('auth.signInLink')}</Link>
      </p>
    </div>
  )
}

export function AccountPage() {
  const { t } = useTranslation()
  const { locale = 'en' } = useParams()
  const { user, loading, logout } = useAuth()

  if (loading) return <div className="page-narrow">{t('auth.loading')}</div>
  if (!user) return <Navigate to={`/${locale}/signin`} replace />

  return (
    <div className="page-narrow auth-card">
      <h1>{t('auth.accountTitle')}</h1>
      <p className="muted">{t('auth.accountLead')}</p>
      <div className="account-panel">
        <div>
          <strong>{t('auth.displayName')}</strong>
          <div>{user.displayName || '—'}</div>
        </div>
        <div>
          <strong>{t('auth.email')}</strong>
          <div>{user.email}</div>
        </div>
        <div>
          <strong>{t('auth.roles')}</strong>
          <div>{user.roles.join(', ') || 'User'}</div>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          void logout()
        }}
      >
        {t('auth.signOut')}
      </button>
    </div>
  )
}
