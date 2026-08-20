# MyNilam (Rentel) — Developer Guide

Full-stack real-estate & hostel/PG management platform. This doc is the fast on-ramp for
new developers — read it before touching code.

---

## 1. What this is

A **pnpm + Turborepo monorepo** with four workspaces:

| Workspace | What | Stack |
|-----------|------|-------|
| `apps/web` | Customer-facing web app | Next.js 14 (App Router), React 18, Tailwind, TanStack Query, Leaflet |
| `apps/django-backend` | REST API | Django 5.2 + Django REST Framework + SimpleJWT + PostgreSQL |
| `apps/mobile` | Mobile app (stub) | Expo 49 / React Native |
| `packages/shared` | Shared TS SDK + types | TypeScript, axios, zod |

> ⚠️ The repo is named "MyNilam-Django" but the default `main` branch is **frontend-only**.
> **Work on the `staging` branch** — that's where the full stack lives. The README mentions an
> Express backend and a `prod` branch; **neither exists**. Trust `git branch -a`, not the README.

---

## 2. Running locally

Prereqs: Node 18+, pnpm 8.10, Python 3.13 (via `uv`), PostgreSQL (local DB `rentora_db`).

```bash
# 1. Install Node deps (repo root)
pnpm install

# 2. Backend
cd apps/django-backend
uv sync                     # creates .venv + installs Python 3.13 deps
.venv/Scripts/python.exe manage.py runserver 8000

# 3. Frontend (new terminal, repo root)
pnpm dev                    # -> http://localhost:3000
```

Backend env config lives in `apps/django-backend/.env` (see `.env` for `SECRET_KEY`,
`DB_*`, `REFRESH_COOKIE_*`, `CORS_*`).

API docs (once backend is running): `/api/schema/swagger-ui/` and `/api/schema/redoc/`.

---

## 3. Architecture & data flow

```
page.tsx (view)  ->  XxxPageModel.ts (state/logic hook)  ->  use-* hook (TanStack Query)
      ->  @repo/shared ApiClient (axios)  ->  Django DRF /api/*  ->  PostgreSQL
```

### The PageModel convention (follow it for every page)
Every page is split into two files:
- `page.tsx` — pure JSX view, no logic.
- `XxxPageModel.ts` — a custom hook (`useXxxPageModel`) owning **all** state + side effects.

```
app/
├── page.tsx + HomepageModel.ts          # home
├── login/page.tsx + LoginPageModel.ts
├── signup/page.tsx + SignupPageModel.ts
├── post/page.tsx + PostPageModel.ts     # multi-step "post an ad" wizard
├── dashboard/page.tsx + DashboardPageModel.ts
├── settings/page.tsx + SettingsPageModel.ts
├── properties/[id]/page.tsx             # detail page
├── hooks/                               # data layer (React Query)
│   ├── use-auth.ts  use-properties.ts  use-conversations.ts
│   ├── use-favorites.ts  use-hostel-config.ts  use-inquiries.ts
│   ├── use-reviews.ts  use-visits.ts
└── providers/query-provider.tsx         # TanStack QueryClient
```

### Mock vs real API
The shared `ApiClient` reads `NEXT_PUBLIC_USE_MOCK` (web) / `EXPO_PUBLIC_USE_MOCK` (mobile).
- `true`  -> serves `mock-data.ts` (no backend needed).
- `false` -> hits the Django API (`NEXT_PUBLIC_API_URL`, default `http://localhost:8000/api`).
Unset defaults to `false` (real API).

### Frontend design system (shared UI primitives)
All dashboard tabs share one UI module: `apps/web/components/dashboard/shared.tsx`.
It exports the formatters (`formatMoney`, `formatDate`), badges (`StatusBadge`,
`PriorityBadge`), layout/feedback (`Panel`, `Spinner`, `EmptyState`, `Banner`),
and form primitives (`Field`, `TextInput`, `TextArea`, `Select`). Import from
there — do not copy-paste styles between panels.

---

## 4. Backend — 8 domain apps (all under `/api/`)

| App | Purpose | Has API? |
|-----|---------|----------|
| `core` | `CommonModel` base + custom JWT | n/a |
| `accounts` | Users, roles, sessions, OTP | ✅ |
| `geo` | Country→State→…→Locality + autocomplete | ✅ |
| `properties` | Listings + hostels (rooms/beds/photos) | ✅ |
| `communications` | favorites, inquiries, reviews, messages | ✅ |
| `leases` | applications, contracts, payments, invoices | ✅ |
| `maintenance` | maintenance requests | ✅ |
| `audits` | audit trail | admin only |

**Response envelope** (consistent everywhere):
```json
{ "success": true, "data": { ... }, "pagination": { ... } }   // success
{ "success": false, "error": { "message": "..." } }             // failure
```

---

## 5. Auth & RBAC (the most important thing to get right)

Five roles: `guest`, `normal`, `employee`, `super_admin`, `hostel_admin`
(modeled as `Role` ↔ `UserRole`, plus `Permission` ↔ `RolePermission`).

- **Access token**: 15 min, in `localStorage`, sent as `Authorization: Bearer <token>`.
- **Refresh token**: 7 days, rotating + blacklisted, in an httpOnly cookie scoped to `/api/auth/`.

**Fail-closed session guard** (`core/jwt.py`): a request 401s unless the user has at least one
non-revoked `UserSession` row. So:
- **Login MUST create a `UserSession`** (the login serializer does this).
- **Logout MUST revoke it** (`is_revoked=True`), or the token stays valid.

DRF default permission is `IsAuthenticated`. `IsSuperAdmin` / `IsHostelAdmin` check
`user.user_roles.filter(role__name=...)`.

---

## 6. Gotchas (read before you write bugs)

1. **Soft delete is automatic** — every model inherits `CommonModel`
   (`is_active`/`is_deleted`), and `BaseModelManager` hides `is_deleted=False, is_active=True`
   rows from normal queries. Never `.delete()` rows in app code; flip flags.
2. **Field-naming mismatch** — frontend types use `listing_type` (`sale`/`rent`/`roommate`),
   `status`, `is_published`, `is_furnished`; Django uses `listing_purpose` (`Rent`/`Sale`),
   `listing_status` (`Draft`/`Active`/`Pending`/…), `verification_status`, `furnishing_status`.
   The input serializer maps some of these — verify `properties/api/serializers.py` before
   wiring a new real API call. **Don't assume mock type shapes match Django.**
3. **Real-time layer (Channels + Celery) is wired** — chat messages broadcast over WebSockets
   (see §9) and a Celery task creates `NewMessage` notifications. In dev both run WITHOUT Redis
   (in-memory channel layer + eager tasks); flip the env flags in §9 to use Redis.
4. **Repo name lies** (see §1) and the CI workflow is a placeholder.
5. **Access token in localStorage** (XSS-exposed by design) while refresh token is httpOnly — a deliberate split.

---

## 7. Deploy

- **Frontend → Vercel** (native pnpm monorepo detection).
- **Backend → Render** (`render.yaml`; `build.sh` = `pip install` + `collectstatic` + `migrate`;
  start = `gunicorn Project.wsgi:application`).
- CORS/CSRF allow `localhost:3000`, `127.0.0.1:3000`, and `*.vercel.app`.

---

## 8. Team rules (`.agents/AGENTS.md`)

- Keep a single task operation ≤ 1 minute.
- Check background command status every 20 seconds.

---

## 9. Real-time layer (WebSockets + Celery)

Chat is **REST for writes, WebSocket for reads**: messages are POSTed to
`/api/communications/messages/<id>/send/`, which broadcasts to a Channels group
(`chat_<conversation_id>`) via the channel layer. The browser connects to
`/ws/chat/<conversation_id>/?token=<access_token>` and receives new messages live
(`ChatConsumer` in `communications/consumers.py`). `send_message` also fires a
Celery task (`communications.tasks.notify_new_message`) that creates an in-app
`NewMessage` notification for the other participant.

Key files:
- `Project/asgi.py` + `communications/routing.py` — ASGI protocol routing.
- `communications/consumers.py` — the WebSocket consumer (JWT + session auth, group join).
- `communications/realtime.py` — `broadcast_message`, called on transaction commit.
- `communications/tasks.py` + `Project/celery.py` — background tasks.

Running locally (dev defaults work WITHOUT Redis):
- `manage.py runserver` is now ASGI (daphne is first in `INSTALLED_APPS`), so it serves WebSockets.
- Channel layer defaults to in-memory; Celery tasks run inline (`task_always_eager`).

To use real Redis (multi-process / production):
1. Start Redis (e.g. `docker run -d -p 6379:6379 redis:7`).
2. In `apps/django-backend/.env` set `USE_IN_MEMORY_CHANNEL_LAYER=false`.
3. Run a worker: `.venv/Scripts/python.exe -m celery -A Project worker -l info`.

Deploy note: WebSockets need an **ASGI** server. Render's start command should be
`daphne Project.asgi:application` (or gunicorn with uvicorn workers), NOT plain
`gunicorn Project.wsgi:application`, and needs a Redis add-on for the channel
layer + Celery broker.
