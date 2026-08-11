# Erminity.com — Design & Requirements

Living document. Update checkboxes as work completes.  
Brand: **erminity.com** · Slogan: **Ermine Community**  
Product: **EmbeddedFlow** (beyond UI design — code-symbol binding, future MQTT/protocol binding)

Last updated: 2026-08-09

---

## 0. Progress legend

- `[ ]` not started
- `[x]` done
- `[~]` in progress / partial

---

## 1. Product & business

- [x] Brand name: erminity.com / Ermine Community
- [x] Product name: EmbeddedFlow
- [x] Competitors context: SquareLine Studio, LVGL Pro, EEZ Studio (pricing competitive; product goes further)
- [x] Plans: Free / Pro / Enterprise
- [x] Seat model: **1 user · 1 device** per license
- [x] Billing: **subscription** monthly / yearly (not perpetual)
- [x] Free: personal use, **no registration required**
- [x] Pro: code-symbol binding; future UI object binding via MQTT and other protocols
- [x] Enterprise: same as Pro + support; purchase via **contact sales** (not self-serve checkout)
- [x] Pro prices: undecided; stored in **admin/config**, site shows **placeholders** until set
- [ ] Final Pro monthly/yearly prices decided and published
- [ ] Marketing copy entered via CMS (EN/DE/FR/AR) — not hardcoded

### Feature matrix (license enforcement)

| Capability | Free | Pro | Enterprise |
|---|---|---|---|
| Core UI / base EmbeddedFlow usage | Yes | Yes | Yes |
| Bind to code symbols | No | Yes | Yes |
| Bind UI objects to MQTT / protocols (future) | No | Yes | Yes |
| Support | Community | — | Yes (contact) |
| Account required | No | Yes | Yes |

---

## 2. Visual design system

Theme name: **Ermine Night**

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0F1419` | Page background |
| `--surface` | `#1A222C` | Panels / elevated surfaces |
| `--text` | `#E8EEF4` | Primary text |
| `--accent` | `#D4A017` | CTA, highlights (ermine gold) |
| `--accent-2` | `#3D8B8B` | Links, technical accents (teal) |
| `--danger` | `#C45C5C` | Errors / destructive |

- [x] Theme tokens chosen and approved
- [x] CSS variables + shared design tokens in frontend
- [x] Typography: expressive non-default fonts (display + body)
- [x] Landing: one composition, brand-first, full-bleed hero, minimal first viewport
- [x] Motion: at least 2–3 intentional motions
- [x] No generic purple/AI-default look; avoid card clutter in hero
- [x] Responsive desktop + mobile
- [x] RTL polish for Arabic (mirroring, spacing, icons)

---

## 3. Localization

- [x] Languages v1: **English, German, French, Arabic, Persian (Farsi)**
- [x] Persian included with RTL
- [x] Architecture must allow adding languages later
- [x] **RTL** required (Arabic + Persian)
- [x] Language UI: dropdown selector (preserves current path)- [x] i18n for **app chrome** (dashboard buttons, validation, system UI)
- [ ] **Marketing/content strings** come from CMS per locale (not only static JSON)
- [x] Language switcher in UI
- [x] Locale detection / default English
- [ ] Legal pages managed via CMS (and/or legal module) per locale

---

## 4. Site surfaces (pages / areas)

### Public marketing (content-driven)

All visitor-visible marketing content is editable from Admin CMS (see §4.1).

- [ ] Home / product introduction (EmbeddedFlow)
- [ ] Pricing (Free / Pro / Enterprise; Pro from config; Enterprise CTA → contact)
- [ ] Features / differentiation vs UI-only tools
- [ ] Download / IDE extensions (VS Code, Eclipse, Visual Studio)
- [ ] Docs link or placeholder
- [ ] Contact / Enterprise inquiry form
- [ ] Legal: Terms, Privacy, Cookie Policy, Imprint/Legal notice (as required)

### Auth

- [ ] Register / Login (email + password)
- [ ] Email verification
- [ ] Forgot / reset password
- [ ] Social login: **Google, GitHub, Microsoft**
- [ ] Logout / session management

### User dashboard (authenticated)

- [ ] Profile / account settings
- [ ] Privacy center: export data, delete account (GDPR)
- [ ] Consent preferences (marketing cookies if any)
- [ ] Licenses: view plan, key, status, expiry
- [ ] Device: see bound device; **Deactivate** (unlimited) then Activate on new device
- [ ] Subscription: upgrade to Pro via Paddle; manage billing portal / payment methods via Paddle
- [ ] Cancel / renew visibility (driven by Paddle webhooks)

### Admin — operations

- [ ] Users list / detail
- [ ] Licenses list / revoke / force deactivate
- [ ] Subscriptions / payment status (from Paddle sync)
- [ ] Enterprise contact requests inbox
- [ ] Pricing config (Pro monthly/yearly placeholders → live values)
- [ ] Basic abuse controls (disable account / license)
- [ ] Full **CMS** for public site content (§4.1)
- [ ] SEO fields per page/locale (§5)
- [ ] Media library (images + alt + metadata)
- [ ] Privacy / consent configuration (cookie categories, policy versions)
- [ ] Audit log viewer (admin actions, license events, consent)

### 4.1 CMS — admin-controlled public content (required)

Everything a visitor sees on marketing pages must be controllable from Admin, including:

| Area | Editable |
|---|---|
| Brand | Site name, slogan, logo, **favicon**, og/default share image |
| Navigation | Menu labels/links per locale |
| Pages / sections | Hero, intro, features, CTAs, pricing blurbs, footer, etc. |
| Copy | All public texts per locale (EN/DE/FR/AR) |
| Media | Upload/replace images; **required alt text**; optional title/caption |
| Theme accents (optional later) | Keep code tokens as default; CMS may override logo/favicon first |
| Legal | Privacy, Terms, Cookies, Imprint bodies per locale + version/effective date |
| Company / imprint fields | Legal name, address, privacy email, jurisdiction — **admin-editable**; seed as visible placeholders until filled |

Implementation notes:

- [ ] Content model: Page → Sections → Blocks (text/image/CTA/list) keyed by locale
- [ ] Draft / publish workflow (at least draft vs published)
- [ ] Media library with virus-safe file types, size limits, stored outside public guessable paths or via signed URLs
- [ ] **Alt text mandatory** before publish for content images
- [ ] Cache/CDN-friendly content API for frontend
- [ ] Seed defaults matching Ermine Community branding so site is not empty on first boot
- [ ] No hardcoded marketing copy in React except fallbacks for missing CMS keys
- [ ] **Legal entity / imprint settings** exposed in Admin (name, address, privacy contact email, jurisdiction); prefilled with clear placeholders like “Configure in Admin”; public Imprint/Privacy show these fields when set

Out of scope for v1: full arbitrary blog platform / community forum (can add later on same CMS primitives).

---

## 5. SEO

Must work for EU/US discovery and multi-locale.

- [ ] Per-page SEO in CMS: `title`, `meta description`, canonical URL, robots index/nofollow
- [ ] Open Graph + Twitter cards (title, description, image) per page/locale
- [ ] `hreflang` for EN/DE/FR/AR (+ `x-default`)
- [ ] Semantic HTML landmarks/headings
- [ ] Image `alt` from CMS (see §4.1)
- [ ] XML sitemap(s) per locale or multilingual sitemap index
- [ ] `robots.txt` configurable
- [ ] Structured data (JSON-LD): Organization, SoftwareApplication / Product, FAQ if present
- [ ] Fast LCP: optimized images (modern formats where possible), lazy-load below fold
- [ ] Clean routes (`/en/...`, `/de/...`, …) or equivalent locale routing
- [ ] No duplicate thin content across locales without hreflang
- [ ] Prefer SSR or prerender for public marketing pages so crawlers see content (SPA-only shell is not enough)

---

## 6. License activation (IDE extensions)

Flow agreed:

1. User obtains license key from dashboard (Pro/Enterprise after purchase/approval)
2. User enters key in extension (VS Code / Eclipse / Visual Studio)
3. Extension calls license API; device fingerprint bound (**1 device**)
4. Server returns signed license token for short offline grace
5. User may **Deactivate** from web dashboard (no monthly cap) and activate elsewhere

- [ ] License key generation & storage (hashed/secret-safe)
- [ ] Device fingerprint schema + binding rules
- [ ] Activate / deactivate / validate endpoints
- [ ] Signed token (expiry + plan features claims)
- [ ] Free mode: no account/key; Pro features gated client + server validation
- [ ] Public API docs for extension authors
- [ ] Rate limiting & anti-abuse on activate/validate

---

## 7. Payments (Paddle)

- [x] Provider: **Paddle** as Merchant of Record (tax/VAT handled by Paddle)
- [ ] Paddle sandbox + production config via env
- [ ] Checkout for Pro monthly / yearly
- [ ] Webhooks: create/update/cancel subscription → local license state
- [ ] Customer portal / payment method management (Paddle-hosted)
- [ ] Enterprise: no self-serve charge; contact workflow only
- [ ] Idempotent webhook processing
- [ ] Map Paddle customer ↔ local user
- [ ] Privacy docs mention Paddle as payment MoR / processor

---

## 8. Security (application & infrastructure)

Goal: production-hardened by default; reduce fingerprinting; block common vulns.

### 8.1 Hide stack fingerprints

- [x] Remove / suppress `Server`, `X-Powered-By`, ASP.NET / Kestrel version headers
- [x] Reverse proxy does not leak upstream tech
- [x] Frontend production build: no source maps publicly exposed
- [x] Do not expose React / Vite / ASP.NET versions in public HTML comments or error pages
- [x] Generic error pages (no stack traces, no detailed exception messages to clients)
- [x] Health endpoints not publicly informative beyond liveness (or IP-restricted)

### 8.2 OWASP-oriented controls

- [ ] **SQL injection**: EF Core parameterized queries only; no raw SQL string concat; review any `FromSql` usage
- [ ] **XSS**: encode output; strict CSP; sanitize any rich text from CMS before render
- [ ] **CSRF**: anti-forgery where cookie auth applies; SameSite cookies
- [ ] **SSRF**: no user-controlled server-side URL fetch without allowlist
- [ ] **Path traversal / upload abuse**: allowlisted extensions, content sniffing, size caps, stored outside web root or via controlled handler
- [ ] **AuthZ**: role checks on all admin/CMS/license admin APIs; deny by default
- [ ] **IDOR**: authorize resource ownership on license/device/user endpoints
- [ ] **Mass assignment**: DTOs; never bind entity models directly
- [ ] **Rate limiting**: auth, password reset, license activate/validate, contact form
- [ ] **Brute force**: lockout / backoff on login
- [ ] **Secrets**: env only; never commit keys
- [ ] **Dependencies**: keep patched; commercial-OK FOSS only; periodic audit
- [ ] **HTTPS** everywhere in prod; HSTS
- [ ] Security headers: CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Frame ancestors
- [ ] Request size limits; JSON depth limits
- [ ] Webhook signature verification (Paddle)
- [ ] Admin audit trail for privileged actions

### 8.3 Auth stack

- [x] Preference: **OpenIddict** on ASP.NET Core **10** (.NET 10)
- [x] OpenIddict authorization server configured
- [x] Auth code + PKCE for SPA (avoid insecure implicit flows)
- [ ] Refresh tokens; secure storage strategy for SPA
- [x] External providers: Google, GitHub, Microsoft
- [x] Roles: `User`, `Admin`
- [x] Password hashing (ASP.NET Identity)
- [ ] Email verification before Pro purchase (recommended)
- [ ] Anti-enumeration on auth endpoints

---

## 9. Privacy, GDPR & global equivalents

Audience includes **EU and US** (and worldwide). Design for GDPR as baseline; map to CCPA/CPRA and similar.

### 9.1 Legal & UX

- [ ] Privacy Policy, Cookie Policy, Terms, Imprint/Legal notice — CMS-managed, versioned, effective dates
- [ ] Company legal fields (name, address, privacy email, jurisdiction) via Admin; **v1 ships with placeholders**, capability visible in UI/API; real values filled later by operator
- [ ] Cookie / consent banner **before** non-essential cookies/scripts (EU ePrivacy + GDPR)
- [ ] Consent categories: necessary / preferences / analytics / marketing (only enable what we actually use)
- [ ] Record consent (what, when, policy version, locale) — auditable
- [ ] Easy withdraw consent
- [ ] Clear processor list: Paddle, Resend, OAuth providers, host, etc.
- [ ] Lawful bases documented (contract, legitimate interest, consent) in policy

### 9.2 Data subject rights

- [ ] Access / export (portable JSON)
- [ ] Rectification (profile edit)
- [ ] Erasure / account deletion (with license/subscription rules documented)
- [ ] Restriction / objection flows (documented; support path if not fully automated)
- [ ] No sale of personal data (CCPA “Do Not Sell” — if no sale, state so)
- [ ] Retention schedule (accounts, logs, consents, support messages)

### 9.3 Engineering controls

- [ ] Privacy by design: minimize PII; no unnecessary tracking in v1
- [ ] Encryption in transit (TLS); encryption at rest via disk/volume where hosted
- [ ] Admin access limited; audit privileged access to user PII
- [ ] Breach notification process documented (runbook)
- [ ] DPA/terms awareness for Paddle & Resend (ops checklist)

### 9.4 Final compliance audit (required before public launch)

- [ ] Checklist pass: GDPR rights, cookies, policies, processors
- [ ] Security review pass (§8)
- [ ] SEO smoke pass (§5)
- [ ] Written audit notes in `docs/AUDIT.md` (findings + remediations)

---

## 10. Email

- [x] Provider: **Resend**
- [x] Abstraction `IEmailSender` so SES/SMTP can replace later
- [ ] Domain `erminity.com` verified in Resend
- [ ] SPF / DKIM / DMARC DNS records
- [ ] Templates: verify email, reset password, license issued, Enterprise reply ack
- [ ] Env-based API key
- [ ] Mentioned as processor in Privacy Policy

---

## 11. Technical stack (all commercial-friendly FOSS)

| Layer | Choice |
|---|---|
| Backend | **.NET 10** / ASP.NET Core 10 (C#) — `TargetFramework: net10.0` |
| Auth | OpenIddict + ASP.NET Identity |
| Frontend | React (Vite) + prerender/SSR strategy for public SEO pages |
| DB | PostgreSQL |
| Cache/queue (if needed) | Redis (optional v1) |
| Payments | Paddle |
| Email | Resend |
| Deploy | Docker + Docker Compose, **cloud-agnostic** |
| Reverse proxy | Caddy or nginx (FOSS) — strip identifying headers |

- [x] Solution / monorepo structure created
- [x] Backend API project
- [x] Frontend React app
- [~] EF Core + PostgreSQL migrations (EnsureCreated seed for now; migrations next)
- [x] CMS + media + SEO schema
- [x] Dockerfiles (api, web)
- [x] `docker-compose.yml` (api, web, postgres, proxy)
- [x] `.env.example` documented
- [x] Health checks
- [ ] CI placeholder (optional)

Ignore prior experiments under sibling folders (`ErmineBroker`, `Erminity.com old`, etc.).

---

## 12. Project location

- Root: `D:\Works\erminity.com\Erminity.com`
- Spec file: `docs/REQUIREMENTS.md` (this file)
- Audit file (later): `docs/AUDIT.md`

---

## 13. Non-goals (v1)

- [x] Persian UI (added with RTL; language dropdown)
- [x] Self-hosted mail server as primary sender
- [x] Stripe as MoR/payment (decided against; Paddle)
- [x] Unlimited devices per seat
- [x] Free plan requiring registration
- [x] Hardcoded-only marketing site (CMS required instead)

---

## 14. Implementation phases (checklist)

### Phase A — Foundation

- [x] Repo scaffolding (backend + frontend + compose)
- [x] Design tokens + base layout shell
- [x] i18n + RTL shell (app chrome)
- [~] Identity + OpenIddict + social stubs
- [x] PostgreSQL core models: User, License, Device, Subscription, PricingConfig, ContactRequest
- [x] CMS models: SiteSettings, Page, Section, Block, MediaAsset, SeoMetadata, ContentPublication
- [x] Security header middleware + fingerprint suppression baseline
- [x] Admin CMS UI (deferred to Phase B)
- [x] Live Postgres/docker verification

### Phase B — CMS, SEO, commerce & licenses

- [x] Admin CMS UI (settings, pages, media+alt, SEO fields, publish)
- [~] Public site reads published CMS content (prerender/SSR for SEO)
- [x] Pricing page + config-driven Pro prices
- [ ] Paddle checkout + webhooks
- [x] Dashboard: licenses, device deactivate, billing portal link (licenses + deactivate done; billing portal with Paddle later)
- [x] License activate/validate API
- [x] Admin operations panel (users/licenses/contacts) — licenses + contacts (+ CMS)

### Phase C — Privacy, harden, polish, audit

- [ ] Consent banner + consent records
- [ ] GDPR export / delete account
- [ ] Policies via CMS + versioning
- [ ] Full landing visual polish (still CMS-driven)
- [ ] Security pass (OWASP + header/fingerprint checks)
- [ ] SEO pass (sitemap, hreflang, JSON-LD)
- [ ] Production compose + deploy notes
- [ ] DNS/email deliverability checklist
- [ ] Write `docs/AUDIT.md` and close findings

---

## 15. Decisions log

| Date | Decision |
|---|---|
| 2026-08-09 | Ignore previous partial work; greenfield site |
| 2026-08-09 | Subscription monthly/yearly; Free personal no signup |
| 2026-08-09 | Pro = symbol binding (+ future MQTT/protocols); Enterprise = Pro + support via contact |
| 2026-08-09 | Activation = license key in IDE extensions |
| 2026-08-09 | Device move = dashboard deactivate, unlimited |
| 2026-08-09 | Languages EN/DE/FR/AR + RTL |
| 2026-08-09 | Paddle MoR; Resend email; OpenIddict |
| 2026-08-09 | Social: Google + GitHub + Microsoft |
| 2026-08-09 | Cloud-agnostic Docker Compose |
| 2026-08-09 | Theme Ermine Night approved |
| 2026-08-09 | Prices from admin/config with placeholders |
| 2026-08-09 | Project path `D:\Works\erminity.com\Erminity.com` |
| 2026-08-10 | Language switcher becomes dropdown; Persian (`fa`) added with RTL |
| 2026-08-09 | Public site content fully CMS-driven (favicon → slogan → copy → images+alt) |
| 2026-08-09 | SEO required (meta, hreflang, sitemap, JSON-LD, prerender/SSR for public) |
| 2026-08-09 | Harden security: hide stack versions, OWASP controls, CSP, etc. |
| 2026-08-09 | GDPR + global privacy equivalents + final written audit before launch |
| 2026-08-09 | Legal/company imprint data: admin-editable placeholders for now; must be visible in Admin |
