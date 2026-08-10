# Erminity.com

Cloud-agnostic license & marketing platform for **EmbeddedFlow**.

## Stack

- Backend: **.NET 10** / ASP.NET Core 10 + OpenIddict + Identity + PostgreSQL
- Frontend: React + Vite + i18n (EN/DE/FR/AR + RTL)
- Payments: Paddle (MoR) — wiring in later phase
- Email: Resend abstraction
- Deploy: Docker Compose

## Spec

See [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md).

## Local (frontend only)

```bash
cd src/Erminity.Web
npm install
npm run dev
```

## Local API (needs PostgreSQL)

```bash
docker compose up db -d
cd src/Erminity.Api
dotnet run --launch-profile http
```

API: http://localhost:5080 · Web: http://localhost:5173

## Full stack Docker

```bash
docker compose up --build
```

Web: http://localhost:8088

Default admin (change immediately): `admin@erminity.com` / `ChangeMe!Erminity1`

## Theme

**Ermine Night** — charcoal `#0F1419`, gold `#D4A017`, teal `#3D8B8B`.
