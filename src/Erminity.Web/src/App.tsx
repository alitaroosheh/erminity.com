import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LOCALES } from './i18n'
import { AuthProvider } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { PricingPage } from './pages/PricingPage'
import { DownloadPage } from './pages/DownloadPage'
import { EnterprisePage } from './pages/EnterprisePage'
import { LegalPage } from './pages/LegalPage'
import { AccountPage, SignInPage, SignUpPage } from './pages/AuthPages'
import { AdminLayout, RequireAdmin } from './admin/AdminLayout'
import { AdminHome } from './admin/AdminHome'
import { AdminSettings } from './admin/AdminSettings'
import { AdminPricing } from './admin/AdminPricing'
import { AdminMedia } from './admin/AdminMedia'
import { AdminPages } from './admin/AdminPages'
import { AdminPageEdit } from './admin/AdminPageEdit'
import { AdminContacts } from './admin/AdminContacts'
import { AdminLicenses } from './admin/AdminLicenses'
import { LicensesPage } from './pages/LicensesPage'

const LOCALES = SUPPORTED_LOCALES

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
    <AuthProvider>
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
          <Route path="signin" element={<SignInPage />} />
          <Route path="signup" element={<SignUpPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="licenses" element={<LicensesPage />} />
          <Route path="privacy" element={<LegalPage kind="privacy" />} />
          <Route path="terms" element={<LegalPage kind="terms" />} />
          <Route path="cookies" element={<LegalPage kind="cookies" />} />
          <Route path="imprint" element={<LegalPage kind="imprint" />} />
          <Route
            path="admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminHome />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="pricing" element={<AdminPricing />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="pages" element={<AdminPages />} />
            <Route path="pages/:pageId" element={<AdminPageEdit />} />
            <Route path="contacts" element={<AdminContacts />} />
            <Route path="licenses" element={<AdminLicenses />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/en" replace />} />
      </Routes>
    </AuthProvider>
  )
}
