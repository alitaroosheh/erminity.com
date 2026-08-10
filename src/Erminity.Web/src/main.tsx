import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import App from './App'
import './i18n'
import { isRtl } from './i18n'
import './styles/global.css'

function DocumentDirection() {
  const { i18n } = useTranslation()
  useEffect(() => {
    const lng = i18n.resolvedLanguage ?? 'en'
    document.documentElement.lang = lng
    document.documentElement.dir = isRtl(lng) ? 'rtl' : 'ltr'
  }, [i18n.resolvedLanguage])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DocumentDirection />
      <App />
    </BrowserRouter>
  </StrictMode>,
)
