import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

const KEY = 'erminity.consent.v1'

export function CookieBanner() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setOpen(true)
  }, [])

  function save(analytics: boolean) {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        necessary: true,
        analytics,
        marketing: false,
        at: new Date().toISOString(),
        policyVersion: '1',
      }),
    )
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cookie-bar"
          role="dialog"
          aria-live="polite"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35 }}
        >
          <p>{t('cookies.text')}</p>
          <div className="cookie-bar__actions">
            <button type="button" className="btn btn-ghost" onClick={() => save(false)}>
              {t('cookies.necessary')}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => save(true)}>
              {t('cookies.accept')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
