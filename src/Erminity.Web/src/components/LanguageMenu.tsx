import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { SUPPORTED_LOCALES } from '../i18n'

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'fa', label: 'فارسی' },
] as const

function swapLocalePath(pathname: string, nextLocale: string) {
  const parts = pathname.split('/')
  if (parts.length > 1 && (SUPPORTED_LOCALES as readonly string[]).includes(parts[1])) {
    parts[1] = nextLocale
    return parts.join('/') || `/${nextLocale}`
  }
  return `/${nextLocale}`
}

export function LanguageMenu() {
  const { locale = 'en' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = LANGS.find((l) => l.code === locale) ?? LANGS[0]

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className={`lang-menu${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="lang-menu__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{current.label}</span>
        <span className="lang-menu__chevron" aria-hidden />
      </button>
      {open && (
        <ul id={listId} className="lang-menu__list" role="listbox" aria-label="Language">
          {LANGS.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === locale}>
              <button
                type="button"
                className={`lang-menu__option${l.code === locale ? ' is-active' : ''}`}
                onClick={() => {
                  setOpen(false)
                  if (l.code !== locale) navigate(swapLocalePath(location.pathname, l.code))
                }}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
