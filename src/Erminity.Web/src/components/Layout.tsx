import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CookieBanner } from './CookieBanner'
import { LanguageMenu } from './LanguageMenu'
import { useAuth } from '../auth/AuthContext'

type SiteInfo = {
  siteName: string
  slogan: string
  faviconUrl?: string | null
  logoUrl?: string | null
}

export function Layout() {
  const { t } = useTranslation()
  const { locale = 'en' } = useParams()
  const prefix = `/${locale}`
  const { user, loading } = useAuth()
  const [site, setSite] = useState<SiteInfo>({ siteName: 'Erminity', slogan: 'Ermine Community' })

  useEffect(() => {
    void fetch('/api/public/site')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        setSite({
          siteName: data.siteName ?? 'Erminity',
          slogan: data.slogan ?? 'Ermine Community',
          faviconUrl: data.faviconUrl,
          logoUrl: data.logoUrl,
        })
        if (data.faviconUrl) {
          let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
          if (!link) {
            link = document.createElement('link')
            link.rel = 'icon'
            document.head.appendChild(link)
          }
          link.href = data.faviconUrl
        }
        document.title = `${data.siteName} — ${data.slogan}`
      })
      .catch(() => undefined)
  }, [])

  return (
    <>
      <header className="site-header">
        <div className="shell site-header__inner">
          <NavLink to={prefix} className="brand" aria-label={`${site.siteName} home`}>
            {site.logoUrl ? (
              <img className="brand__logo" src={site.logoUrl} alt={site.siteName} />
            ) : (
              <span className="brand__mark" aria-hidden />
            )}
            <span className="brand__text">
              <span className="brand__name">{site.siteName}</span>
              <span className="brand__slogan">{site.slogan}</span>
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
            <LanguageMenu />
            {!loading && user ? (
              <NavLink className="btn btn-primary" to={`${prefix}/account`}>
                {user.displayName || t('nav.account')}
              </NavLink>
            ) : (
              <NavLink className="btn btn-ghost" to={`${prefix}/signin`}>
                {t('nav.signIn')}
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__grid">
          <div>
            <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{site.siteName}</strong>
            <div>{site.slogan}</div>
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
