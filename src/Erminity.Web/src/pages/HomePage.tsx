import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

type CmsBlock = {
  type: string
  text?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
  media?: { id: string; alt: string; contentType: string } | null
}

type CmsPage = {
  title?: string
  metaDescription?: string
  sections?: { key: string; blocks: CmsBlock[] }[]
}

function resolveHref(href: string | null | undefined, prefix: string) {
  if (!href) return prefix
  if (href.startsWith('http')) return href
  if (href.startsWith('/')) return `${prefix}${href === '/' ? '' : href}`
  return `${prefix}/${href}`
}

export function HomePage() {
  const { t } = useTranslation()
  const { locale = 'en' } = useParams()
  const prefix = `/${locale}`
  const [cms, setCms] = useState<CmsPage | null>(null)

  useEffect(() => {
    void fetch(`/api/public/pages/home?locale=${locale}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setCms(data))
      .catch(() => setCms(null))
  }, [locale])

  const hero = cms?.sections?.find((s) => s.key === 'hero')
  const texts = hero?.blocks.filter((b) => b.type === 'text' && b.text) ?? []
  const ctas = hero?.blocks.filter((b) => b.type === 'cta') ?? []
  const images = hero?.blocks.filter((b) => b.type === 'image' && b.media) ?? []

  const headline = texts[0]?.text || t('hero.title')
  const lead = texts[1]?.text || t('hero.lead')
  const primaryCta = ctas[0]
  const secondaryCta = ctas[1]

  useEffect(() => {
    if (cms?.metaDescription) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = cms.metaDescription
    }
    if (cms?.title) document.title = cms.title
  }, [cms])

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
            {headline}
          </motion.h1>
          <motion.p
            className="hero__lead"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {lead}
          </motion.p>
          {images[0]?.media && (
            <motion.img
              className="hero__image"
              src={`/api/public/media/${images[0].media.id}`}
              alt={images[0].media.alt}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
          )}
          <motion.div
            className="hero__cta"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25 }}
          >
            <Link
              className="btn btn-primary"
              to={resolveHref(primaryCta?.ctaHref ?? '/pricing', prefix)}
            >
              {primaryCta?.ctaLabel || t('hero.ctaPro')}
            </Link>
            <Link
              className="btn btn-teal"
              to={resolveHref(secondaryCta?.ctaHref ?? '/download', prefix)}
            >
              {secondaryCta?.ctaLabel || t('hero.ctaFree')}
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
