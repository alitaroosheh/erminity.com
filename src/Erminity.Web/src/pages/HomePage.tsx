import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

export function HomePage() {
  const { t } = useTranslation()
  const { locale = 'en' } = useParams()
  const prefix = `/${locale}`

  const title = t('hero.title')
  const accent = t('hero.titleAccent')
  const titled = title.includes(accent)
    ? title.replace(accent, `|||${accent}|||`).split('|||')
    : [title]

  return (
    <>
      <section className="hero">
        <div className="hero__plane" aria-hidden />
        <div className="shell hero__content">
          <motion.div
            className="eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {t('hero.eyebrow')}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05 }}
          >
            {titled.length === 3 ? (
              <>
                {titled[0]}
                <span>{titled[1]}</span>
                {titled[2]}
              </>
            ) : (
              title
            )}
          </motion.h1>
          <motion.p
            className="hero__lead"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {t('hero.lead')}
          </motion.p>
          <motion.div
            className="hero__cta"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25 }}
          >
            <Link className="btn btn-primary" to={`${prefix}/pricing`}>
              {t('hero.ctaPro')}
            </Link>
            <Link className="btn btn-teal" to={`${prefix}/download`}>
              {t('hero.ctaFree')}
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="section" id="product">
        <div className="shell">
          <div className="section__head">
            <h2>{t('features.title')}</h2>
            <p>{t('features.lead')}</p>
          </div>
          <div className="feature-rail">
            {[
              ['f1Title', 'f1Body'],
              ['f2Title', 'f2Body'],
              ['f3Title', 'f3Body'],
            ].map(([titleKey, bodyKey], i) => (
              <motion.article
                key={titleKey}
                className="feature"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <h3>{t(`features.${titleKey}`)}</h3>
                <p>{t(`features.${bodyKey}`)}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
