# MyNilam — Architecture & System Design Document

**Version:** 1.0  
**Date:** September 2026  
**Stack:** Next.js 14 (App Router) + Django 5.2 DRF + PostgreSQL

---

## 1. Executive Summary

MyNilam is an Indian real-estate and co-living marketplace connecting tenants with verified flats, houses, commercial spaces, hostels, PG accommodations, and roommate shares. The platform supports five user roles with distinct dashboards, real-time messaging, lease management, and a hostel bed-level inventory system.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Next.js Web  │  │  Expo Mobile │  │  Shared TS SDK   │  │
│  │  (React 18)   │  │  (React Nat) │  │  (types + api)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
│         │                 │                                  │
└─────────┼─────────────────┼──────────────────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                        API LAYER                            │
│                                                             │
│  Django REST Framework + SimpleJWT + Channels (WebSocket)   │
│  /api/auth/   /api/properties/   /api/communications/       │
│  /api/leases/ /api/maintenance/  /api/geo/                  │
│                                                             │
│  drf-spectacular (OpenAPI 3.0 auto-generated docs)          │
│  /api/schema/swagger-ui/   /api/schema/redoc/               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                             │
│                                                             │
│  PostgreSQL (primary database)                              │
│  Redis (Channels layer + Celery broker, production only)    │
│  WhiteNoise (static files) + FileSystem (media uploads)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Monorepo Structure

The project is a **pnpm + Turborepo monorepo** with four workspaces:

```
mynilam/
├── apps/
│   ├── web/                    # Next.js 14 customer-facing app
│   │   ├── app/                # App Router pages (route-based)
│   │   │   ├── layout.tsx      # Root layout (Header, Footer, ThemeProvider)
│   │   │   ├── page.tsx        # Homepage (property catalog)
│   │   │   ├── login/          # Login page + model
│   │   │   ├── signup/         # Signup page + model
│   │   │   ├── post/           # 4-step post ad wizard
│   │   │   ├── dashboard/      # Role-based dashboard
│   │   │   ├── settings/       # Profile management
│   │   │   ├── properties/     # Property detail page
│   │   │   ├── hooks/          # React Query data hooks
│   │   │   └── providers/      # QueryClient + ThemeProvider
│   │   ├── components/
│   │   │   ├── layout/         # Header, Footer, ThemeToggle
│   │   │   ├── properties/     # PropertyCard, SearchBar, Filters, Gallery, etc.
│   │   │   ├── dashboard/      # Dashboard tabs (shared components)
│   │   │   └── ui/             # Primitives: Button, Card, Input, Skeleton
│   │   └── utils/              # distance.ts, geocode.ts, image-compression.ts
│   │
│   ├── django-backend/         # Django 5.2 REST API
│   │   ├── Project/            # Settings, URLs, ASGI/WSGI, Celery
│   │   ├── core/               # CommonModel base, JWT auth, management commands
│   │   ├── accounts/           # User, Role, Permission, Session, OTP
│   │   ├── geo/                # Country > State > City > Area > Locality
│   │   ├── properties/         # Property, HostelConfig, Room, Bed, Media
│   │   ├── communications/     # Favorites, Inquiries, Reviews, Messages
│   │   ├── leases/             # Applications, Contracts, Payments, Invoices
│   │   ├── maintenance/        # Maintenance requests
│   │   └── audits/             # Audit trail (admin only)
│   │
│   └── mobile/                 # Expo React Native (stub)
│
└── packages/
    └── shared/                 # Shared TypeScript SDK
        └── src/
            ├── types/          # Property, User, Lease, Communication types
            ├── api/            # ApiClient (axios), mock-data, per-domain API modules
            └── index.ts        # Package entry point
```

---

## 4. Frontend Architecture

### 4.1 PageModel Convention

Every page follows a strict separation of concerns:

```
page.tsx (view)  ──>  XxxPageModel.ts (state + logic)  ──>  use-* hook (data)
```

| File | Responsibility |
|------|---------------|
| `page.tsx` | Pure JSX. No state management, no side effects. Renders the view using the model's return values. |
| `XxxPageModel.ts` | Custom hook owning ALL component state, form logic, navigation, validation. Returns everything the view needs. |
| `use-*.ts` (in hooks/) | TanStack Query hooks for data fetching, caching, and mutations. Calls `@repo/shared` API functions. |

This pattern keeps views testable and logic reusable. The page component is a dumb template; the model is a pure function that returns UI state.

### 4.2 Data Flow

```
page.tsx  →  XxxPageModel  →  useProperties(filters)
                                    │
                                    ▼
                              @repo/shared api/properties.ts
                                    │
                                    ▼
                              ApiClient (axios) ──→ Django /api/properties/
                                    │
                                    ▼
                              TanStack Query cache ←→ React re-render
```

### 4.3 Authentication & Session

| Token | Storage | Lifetime | Refresh |
|-------|---------|----------|---------|
| Access token | `localStorage` | 15 minutes | Auto via axios interceptor on 401 |
| Refresh token | httpOnly cookie (`/api/auth/`) | 7 days | Rotating, blacklisted after rotation |

**Flow:**
1. Login → backend creates `UserSession` row + returns access + refresh tokens
2. Axios interceptor attaches `Authorization: Bearer <access_token>` to every request
3. On 401 response → interceptor calls `/api/auth/refresh/` → gets new access token → retries original request
4. On refresh failure → clears tokens → redirects to `/login`

### 4.4 Design System

**Styling:** Tailwind CSS with custom design tokens

| Element | Specification |
|---------|--------------|
| Surfaces | `white/90` (light) / `slate-950/90` (dark) with `backdrop-blur-2xl` |
| Borders | `border-2 border-black` (light) / `border-slate-600` (dark) |
| Border radius | `rounded-3xl` cards, `rounded-2xl` inner elements, `rounded-xl` buttons |
| Primary gradient | `indigo-600` to `violet-700` |
| Hostel accent | `purple-600` to `pink-700` |
| Typography | `font-black` / `font-extrabold` headings, `tracking-widest` micro-labels |
| Shadows | `shadow-xl shadow-slate-900/10` (light), `shadow-black/50` (dark) |
| Micro-interactions | `hover:scale-105`, `active:scale-95`, `hover:-translate-y-1.5` |

**UI Primitives** (in `components/ui/`):
- `Button` — variants: default, outline, ghost, gradient; `isLoading` prop with spinner
- `Card` — glassmorphic surface with optional `hoverEffect`
- `Input` — label, icon, error state
- `Skeleton` — animated placeholder for loading states
- `LoadingOverlay` — blocks pointer events + shows spinner during async operations

### 4.5 Key Components

| Component | Purpose |
|-----------|---------|
| `Header` | Glassmorphic sticky header with animated logo, nav, Go Pro pill, role chip, Post Ad CTA. Hides on scroll-down, reappears on scroll-up. |
| `PropertyCard` | Grid/list card with auto-rotating image carousel (3s), distance badge, type/status pills, bookmark button, "View listing details" link |
| `SearchBar` | Hero search with autocomplete dropdown (popular + recent), location filter |
| `PropertyFilters` | Sidebar with draft-state pattern (changes accumulate locally, "Search" button triggers API call) |
| `PropertyGallery` | Main + thumbnail gallery on detail page |
| `DistanceCalculator` | Interactive map with Nominatim geocoding — search any location, see distance + travel times |
| `InquiryForm` | Contact form that sends messages to property owners |
| `ReviewSection` | Star rating + review list with write-review form |
| `MoveInSummaryDrawer` | Bottom drawer for hostel room selection + booking summary |

### 4.6 Responsive Design

| Breakpoint | Layout |
|-----------|--------|
| Desktop (>= 1024px) | 3-column detail layout, sticky sidebar, full header nav, 3-column property grid |
| Tablet (768-1023px) | 2-column grids, condensed nav |
| Mobile (< 768px) | Single column, collapsible filters, fixed bottom action bar on detail page |

---

## 5. Backend Architecture

### 5.1 Django Apps

| App | Models | Purpose |
|-----|--------|---------|
| `core` | `CommonModel` (base), `CustomJWTAuthentication` | Soft-delete base model, JWT with session validation |
| `accounts` | `User`, `Role`, `UserRole`, `Permission`, `RolePermission`, `UserSession`, `OTPVerification`, `SocialAccount` | RBAC, authentication, account lockout |
| `geo` | `Country`, `State`, `District`, `City`, `Area`, `Locality` | Hierarchical geography for addresses |
| `properties` | `Property`, `PropertyMedia`, `HostelConfig`, `HostelRoom`, `HostelBed`, `HostelPhoto`, `PropertyVisit` | Core property listings + hostel inventory |
| `communications` | `Favorite`, `Inquiry`, `Review`, `Conversation`, `Message`, `Notification` | User interactions + real-time chat |
| `leases` | `LeaseApplication`, `LeaseContract`, `LeasePayment`, `LeaseInvoice` | Rental agreements + payments |
| `maintenance` | `MaintenanceRequest` | Property maintenance tracking |
| `audits` | `AuditLog` | Login attempts, data changes (admin only) |

### 5.2 Response Envelope

Every API endpoint returns a consistent JSON structure:

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total_pages": 5, "count": 48 }
}

// Error
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "errors": { "email": ["This field is required."] }
  }
}
```

### 5.3 Authentication & RBAC

**Five roles:** `guest`, `normal`, `employee`, `super_admin`, `hostel_admin`

```
User ──< UserRole >── Role ──< RolePermission >── Permission
```

**Permission checks:**
- DRF default: `IsAuthenticated`
- Custom: `IsSuperAdmin`, `IsHostelAdmin`, `IsEmployee` — check `user.user_roles.filter(role__name=...)`
- Account lockout: 5 failed attempts → locked for 15 minutes
- Session guard (`core/jwt.py`): access token is valid ONLY if user has at least one non-revoked `UserSession`

### 5.4 Data Model — Property

```
Property (CommonModel)
├── owner (User FK)
├── property_type (PropertyType FK)
├── title, description, price, currency_code
├── address_line_1, address_line_2, building_name
├── country > state > district > city > area > locality (Geo FKs)
├── latitude, longitude (Decimal)
├── bedrooms, bathrooms, area_sqft
├── furnishing_status, listing_purpose, listing_status, verification_status
├── specs (JSON) — furniture_list, water_source, security_features, etc.
├── PropertyMedia (images, videos, floor plans)
├── PropertyAmenity (amenity badges)
├── PropertyDocument (title deed, NOC, etc.)
├── PropertyRule (pet/smoking/guest policies)
├── PropertyVisit (scheduled visits)
└── HostelConfig (1:1 for hostel/PG properties)
    ├── HostelRoom (rooms with sharing types)
    │   └── HostelBed (individual beds with status)
    ├── HostelPhoto (categorized gallery)
    └── pricing, amenities, vacancy tracking
```

### 5.5 Soft Delete Pattern

Every model inherits `CommonModel` which provides:
- `is_active` (BooleanField, default=True)
- `is_deleted` (BooleanField, default=False)
- `created_at`, `updated_at` (auto timestamps)

`BaseModelManager` filters out `is_deleted=True` or `is_active=False` rows by default. **Never call `.delete()` in app code** — flip flags instead.

---

## 6. Real-Time Layer

### 6.1 WebSocket Chat

```
Browser ──WS──> ChatConsumer (Django Channels)
                    │
                    ├── JWT + Session validation on connect
                    ├── Group join (chat_<conversation_id>)
                    ├── On new message → broadcast to group
                    └── Celery task → create Notification for other participant
```

- Messages are **POSTed via REST** (`/api/communications/messages/<id>/send/`)
- On transaction commit → `broadcast_message()` sends to Channels group
- Browser receives new messages via WebSocket in real-time

### 6.2 Celery Background Tasks

| Task | Purpose |
|------|---------|
| `notify_new_message` | Create `NewMessage` notification when chat message is sent |
| `send_otp_email` | Send OTP verification emails |
| `generate_invoice` | Auto-generate lease invoices on schedule |

**Dev mode:** `CELERY_TASK_ALWAYS_EAGER=True` — tasks run inline, no Redis needed.  
**Production:** Requires Redis as broker + `django_celery_results` for result storage.

---

## 7. API Endpoints

### Authentication (`/api/auth/`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/login/` | Email + password login (creates UserSession) |
| POST | `/register/` | Create new account |
| POST | `/refresh/` | Rotate access token (uses httpOnly refresh cookie) |
| POST | `/logout/` | Revoke UserSession + blacklist refresh token |
| GET | `/me/` | Get current user profile |

### Properties (`/api/properties/`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List properties (filterable, paginated) |
| POST | `/` | Create new property (multipart for images) |
| GET | `/:id/` | Property detail |
| PATCH | `/:id/` | Update property |
| DELETE | `/:id/` | Soft-delete property |
| POST | `/:id/verify/` | Employee verifies + publishes listing |
| GET | `/hostels/` | List hostel/PG properties with configs |
| GET | `/:id/rooms/` | Room-level breakdown for hostels |
| POST | `/:id/visits/` | Schedule a visit |

### Communications (`/api/communications/`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/favorites/toggle/` | Toggle property bookmark |
| GET | `/favorites/` | List saved properties |
| POST | `/inquiries/` | Send inquiry to property owner |
| GET | `/inquiries/` | List received/sent inquiries |
| POST | `/reviews/` | Submit property review |
| GET | `/reviews/?property=:id` | Get reviews + rating summary for a property |

### Leases (`/api/leases/`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/applications/` | Apply for a lease |
| GET | `/contracts/` | List lease contracts |
| POST | `/payments/` | Record a payment |
| GET | `/invoices/` | List invoices |

---

## 8. Frontend Route Map

| Route | Page | Auth Required | Role |
|-------|------|--------------|------|
| `/` | Homepage (property catalog + hostels) | Yes (redirects to login or shows auth message) | Any |
| `/login` | Login page | No | Guest |
| `/signup` | Registration page | No | Guest |
| `/post` | Post Ad wizard (4 steps + success) | Yes | Normal, Employee, Super Admin |
| `/dashboard` | Role-based dashboard | Yes | Any authenticated |
| `/settings` | Profile management | Yes | Any authenticated |
| `/properties/:id` | Property detail page | Yes | Any authenticated |

---

## 9. External Services

| Service | Used For | API Key Required |
|---------|----------|-----------------|
| OpenStreetMap Nominatim | Geocoding (location name → coordinates) | No (free, rate-limited) |
| Leaflet / OpenStreetMap | Interactive maps (property locations, distance calculator) | No |
| Unsplash | Demo property images (seed data) | No |
| Google Fonts (Inter) | Typography | No |

---

## 10. Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | Vercel | Auto-deploy from `staging` branch. pnpm monorepo detection. |
| Backend | Render | `render.yaml` — Python 3.13, PostgreSQL addon, Redis addon (prod) |
| Database | PostgreSQL (Render addon or external) | SSL mode required in production |
| Redis | Render addon or external | Required for Channels + Celery in production |

**Production config requirements:**
- `SECRET_KEY` — must be set via env var (no hardcoded fallback)
- `REFRESH_COOKIE_SECURE=True` — cookies only sent over HTTPS
- `DEBUG=False`
- `ALLOWED_HOSTS` — explicit domain list
- `CELERY_TASK_ALWAYS_EAGER=False` — use real worker
- `USE_IN_MEMORY_CHANNEL_LAYER=False` — use Redis channel layer
- ASGI server: `daphne` or `gunicorn + uvicorn workers` (NOT plain gunicorn)

---

## 11. Security Model

| Layer | Mechanism |
|-------|-----------|
| Authentication | JWT (15min access + 7-day rotating refresh in httpOnly cookie) |
| Session validation | `UserSession` table — tokens are invalid if session is revoked |
| Account lockout | 5 failed attempts → locked for 15 minutes |
| RBAC | Role-based permissions (guest/normal/employee/super_admin/hostel_admin) |
| CORS | Whitelist: `localhost:3000`, `*.vercel.app` |
| CSRF | Trusted origins configured |
| Soft delete | All models use `is_deleted` flag, never hard-delete |
| Audit trail | Login events, data changes logged to `AuditLog` |
| Password | Django validators (min length, complexity, common password check) |

---

## 12. Feature Inventory

### Fully Implemented

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Login / Signup / Logout | Glass card UI, validation, error mapping | JWT + session + lockout | Production-ready |
| Property Listing | Grid/List/Map views, skeleton loading | Full filter support, pagination | Production-ready |
| Property Detail | Gallery, summary, reviews, distance calc | Full serializer with nested data | Production-ready |
| Post Ad Wizard | 4-step wizard with image compression | Creates property + media | Production-ready |
| Search + Filters | Hero search with autocomplete, draft-state filters | Server-side filtering | Production-ready |
| Image Carousel | Auto-rotate 3s, pause on hover, nav arrows | — | Production-ready |
| Favorites | Toggle + list | Toggle + list endpoints | Production-ready |
| Inquiries | Send message form | Creates inquiry, links to owner | Production-ready |
| Reviews | Star rating + body | Creates review + summary | Production-ready |
| Visit Scheduling | Date + time slot picker | Creates visit request | Production-ready |
| Distance Calculator | Nominatim geocoding + Leaflet map | — | Production-ready |
| User Location | Browser Geolocation API + Haversine distance | — | Production-ready |
| Hostel/PG Management | Room/bed grid, config form | HostelConfig + Room + Bed models | Production-ready |
| Dark Mode | ThemeToggle + next-themes | — | Production-ready |
| Responsive Design | Mobile-first, sticky header, bottom action bar | — | Production-ready |
| SEO | Dynamic title, OG tags, JSON-LD structured data | — | Production-ready |
| Real-time Chat | WebSocket consumer | Django Channels + Celery notifications | Production-ready |
| Role-Based Dashboard | 5 distinct views | RBAC middleware | Production-ready |
| Lease Management | Applications, contracts, payments | Full CRUD + status workflow | Production-ready |
| Maintenance | Request submission + tracking | CRUD + status tracking | Production-ready |
| Account Lockout | — | 5 attempts / 15 min lockout | Production-ready |
| API Documentation | — | Swagger UI + ReDoc via drf-spectacular | Production-ready |

### Demo Data

29 seeded properties across all types (apartments, houses, hostels, PGs, commercial, plots, roommate shares) with images, coordinates, reviews, favorites, leases, and maintenance requests.

---

## 13. Production Readiness Checklist

### Critical (Before Launch)
- [ ] Set `SECRET_KEY` via env var (remove hardcoded fallback)
- [ ] Set `REFRESH_COOKIE_SECURE=True`
- [ ] Set `DEBUG=False`
- [ ] Tighten `CORS_ALLOWED_ORIGINS` (remove `*.vercel.app` regex)
- [ ] Switch to ASGI server (`daphne`) for WebSocket support
- [ ] Set up Redis for Channels layer + Celery broker

### Important (Before Scaling)
- [ ] Add API rate limiting (DRF throttling classes)
- [ ] Add error tracking (Sentry on frontend + backend)
- [ ] Add structured logging (Django logging config)
- [ ] Add image upload size limits on backend (match frontend 5MB cap)
- [ ] Add `Cache-Control` headers on property listing API
- [ ] Add Open Graph / Twitter meta tags for social sharing (done on detail page, add to homepage)

### Nice-to-Have
- [ ] Unit + integration tests (auth flow, property CRUD, filter logic)
- [ ] PWA support (service worker for offline browsing)
- [ ] Analytics (Plausible or GA4)
- [ ] Accessibility audit (aria-labels, keyboard navigation)
- [ ] Internationalization (logo cycles 5 languages but app is English-only)
- [ ] Infinite scroll / "Load more" pagination
- [ ] Session timeout warning modal (30-min idle)

---

*Document generated from codebase analysis. For questions, see `DEVELOPERS.md` or the Swagger UI at `/api/schema/swagger-ui/`.*
