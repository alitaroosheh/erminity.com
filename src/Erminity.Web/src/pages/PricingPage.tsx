import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

type SitePayload = {
  pricing: {
    currency: string
    proMonthly: number | null
    proYearly: number | null
    showComingSoon: boolean
  }
}

export function PricingPage() {
  const { t } = useTranslation()
  const { locale = 'en' } = useParams()
  const [site, setSite] = useState<SitePayload | null>(null)

  useEffect(() => {
    void fetch('/api/public/site')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSite(data))
      .catch(() => setSite(null))
  }, [])

  const proPrice = site?.pricing.showComingSoon
    ? t('pricing.comingSoon')
    : site?.pricing.proMonthly != null
      ? `${site.pricing.currency} ${site.pricing.proMonthly}/mo`
      : t('pricing.comingSoon')

  return (
    <section className="section">
      <div className="shell">
        <div className="section__head">
          <h2>{t('pricing.title')}</h2>
          <p>{t('pricing.lead')}</p>
        </div>
        <div className="plans">
          <motion.article className="plan" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="plan__name">{t('pricing.free')}</h3>
            <div className="plan__price">{t('pricing.freePrice')}</div>
            <ul>
              {(t('pricing.freeItems', { returnObjects: true }) as string[]).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="btn btn-ghost" to={`/${locale}/download`}>
              {t('hero.ctaFree')}
            </Link>
          </motion.article>

          <motion.article
            className="plan plan--featured"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <h3 className="plan__name">{t('pricing.pro')}</h3>
            <div className="plan__price">{proPrice}</div>
            <ul>
              {(t('pricing.proItems', { returnObjects: true }) as string[]).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="btn btn-primary" to={`/${locale}/enterprise`}>
              {t('hero.ctaPro')}
            </Link>
          </motion.article>

          <motion.article
            className="plan"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            <h3 className="plan__name">{t('pricing.enterprise')}</h3>
            <div className="plan__price">{t('pricing.contact')}</div>
            <ul>
              {(t('pricing.entItems', { returnObjects: true }) as string[]).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="btn btn-teal" to={`/${locale}/enterprise`}>
              {t('pricing.contact')}
            </Link>
          </motion.article>
        </div>
      </div>
    </section>
  )
}
