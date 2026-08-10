import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { PricingPage } from './pages/PricingPage'
import { DownloadPage } from './pages/DownloadPage'
import { EnterprisePage } from './pages/EnterprisePage'
import { LegalPage } from './pages/LegalPage'

const LOCALES = ['en', 'de', 'fr', 'ar'] as const

function LocaleGate({ children }: { children: React.ReactNode }) {
  const { locale } = useParams()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (locale && LOCALES.includes(locale as (typeof LOCALES)[number])) {
      void i18n.changeLanguage(locale)
    }
  }, [locale, i18n])

  if (!locale || !LOCALES.includes(locale as (typeof LOCALES)[number])) {
    return <Navigate to="/en" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/en" replace />} />
      <Route
        path="/:locale"
        element={
          <LocaleGate>
            <Layout />
          </LocaleGate>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="download" element={<DownloadPage />} />
        <Route path="enterprise" element={<EnterprisePage />} />
        <Route path="privacy" element={<LegalPage kind="privacy" />} />
        <Route path="terms" element={<LegalPage kind="terms" />} />
        <Route path="cookies" element={<LegalPage kind="cookies" />} />
        <Route path="imprint" element={<LegalPage kind="imprint" />} />
      </Route>
      <Route path="*" element={<Navigate to="/en" replace />} />
    </Routes>
  )
}
