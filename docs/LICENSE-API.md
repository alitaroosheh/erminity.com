# License activation API (IDE extensions)

Base URL: `/api/license`

## Activate (bind one device)

`POST /api/license/activate`

```json
{
  "key": "ERM-PRO-....",
  "deviceFingerprint": "stable-machine-id",
  "deviceLabel": "Ali-Laptop",
  "ideProduct": "vscode"
}
```

Success returns `plan`, `features`, `offlineToken` (7-day grace).

Errors: `invalid_key`, `license_inactive`, `device_bound` (deactivate from dashboard first).

## Validate / refresh token

`POST /api/license/validate` — same body fields (`key`, `deviceFingerprint`).

## User dashboard

- `GET /api/license/me` (auth cookie)
- `POST /api/license/me/{id}/deactivate-device` (auth cookie)

## Admin

- Issue test key: Admin → Licenses
- `POST /api/admin/licenses` `{ "userEmail", "plan": "Pro"|"Enterprise", "billingInterval": "month"|"year" }`
