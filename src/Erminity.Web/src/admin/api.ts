async function parseError(res: Response) {
  try {
    const data = (await res.json()) as { error?: string }
    return data.error ?? `http_${res.status}`
  } catch {
    return `http_${res.status}`
  }
}

export async function adminGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: 'include' })
  if (!res.ok) throw new Error(await parseError(res))
  return (await res.json()) as T
}

export async function adminPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return (await res.json()) as T
}

export async function adminPost<T>(path: string, body?: unknown): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: isForm || body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: isForm ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(await parseError(res))
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function adminDelete(path: string) {
  const res = await fetch(path, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) throw new Error(await parseError(res))
}

export type SiteSettings = {
  id: string
  siteName: string
  slogan: string
  faviconMediaId?: string | null
  logoMediaId?: string | null
  defaultOgImageMediaId?: string | null
  legalName?: string | null
  legalAddress?: string | null
  privacyEmail?: string | null
  jurisdiction?: string | null
  legalNamePlaceholder: string
  legalAddressPlaceholder: string
  privacyEmailPlaceholder: string
  jurisdictionPlaceholder: string
}

export type PricingConfig = {
  id: string
  currency: string
  proMonthlyPrice?: number | null
  proYearlyPrice?: number | null
  paddlePriceIdMonthly?: string | null
  paddlePriceIdYearly?: string | null
  showComingSoonWhenEmpty: boolean
}

export type MediaItem = {
  id: string
  fileName: string
  contentType: string
  altText: string
  title?: string | null
  caption?: string | null
  sizeBytes: number
  url: string
}

export type PageSummary = {
  id: string
  slug: string
  isPublished: boolean
  updatedAt: string
  locales: string[]
}

export type PageDetail = {
  id: string
  slug: string
  isPublished: boolean
  locale: string
  availableLocales: string[]
  title: string
  metaDescription?: string | null
  canonicalPath?: string | null
  robots: string
  ogTitle?: string | null
  ogDescription?: string | null
  ogImageMediaId?: string | null
  sections: { key: string; blocks: { type: string; text?: string | null; mediaId?: string | null; ctaLabel?: string | null; ctaHref?: string | null }[] }[]
}

export type ContactItem = {
  id: string
  name: string
  email: string
  company: string
  message: string
  locale: string
  isHandled: boolean
  createdAt: string
}
