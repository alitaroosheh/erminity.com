import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

export function DownloadPage() {
  const { t } = useTranslation()
  const items = [
    { title: t('download.vscode'), href: '#' },
    { title: t('download.eclipse'), href: '#' },
    { title: t('download.vs'), href: '#' },
  ]

  return (
    <section className="section">
      <div className="shell">
        <div className="section__head">
          <h2>{t('download.title')}</h2>
          <p>{t('download.lead')}</p>
        </div>
        <div className="feature-rail">
          {items.map((item, i) => (
            <motion.a
              key={item.title}
              href={item.href}
              className="feature"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <h3>{item.title}</h3>
              <p>{t('download.hint')}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
