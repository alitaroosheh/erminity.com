import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CookieBanner } from './CookieBanner'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'AR' },
] as const

export function Layout() {
  const { t } = useTranslation()
  const { locale = 'en' } = useParams()
  const prefix = `/${locale}`

  return (
    <>
      <header className="site-header">
        <div className="shell site-header__inner">
          <NavLink to={prefix} className="brand" aria-label="Erminity home">
            <span className="brand__mark" aria-hidden />
            <span className="brand__text">
              <span className="brand__name">Erminity</span>
              <span className="brand__slogan">Ermine Community</span>
            </span>
          </NavLink>

          <nav className="nav" aria-label="Primary">
            <NavLink to={prefix} end>
              {t('nav.product')}
            </NavLink>
            <NavLink to={`${prefix}/pricing`}>{t('nav.pricing')}</NavLink>
            <NavLink to={`${prefix}/download`}>{t('nav.download')}</NavLink>
            <NavLink to={`${prefix}/enterprise`}>{t('nav.enterprise')}</NavLink>
          </nav>

          <div className="header-actions">
            <div className="lang-switch" role="group" aria-label="Language">
              {LANGS.map((l) => (
                <NavLink
                  key={l.code}
                  to={`/${l.code}`}
                  className={({ isActive }) => `lang-btn${isActive || locale === l.code ? ' active' : ''}`}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
            <a className="btn btn-ghost" href={`${prefix}/enterprise`}>
              {t('nav.signIn')}
            </a>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__grid">
          <div>
            <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Erminity</strong>
            <div>{t('footer.rights')}</div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <NavLink to={`${prefix}/privacy`}>{t('footer.privacy')}</NavLink>
            <NavLink to={`${prefix}/terms`}>{t('footer.terms')}</NavLink>
            <NavLink to={`${prefix}/cookies`}>{t('footer.cookies')}</NavLink>
            <NavLink to={`${prefix}/imprint`}>{t('footer.imprint')}</NavLink>
          </div>
        </div>
      </footer>

      <CookieBanner />
    </>
  )
}
