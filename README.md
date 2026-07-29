# MyNilam (Rentel) — Real Estate & Hostel Management Platform

**MyNilam** is a modern, high-performance real estate and hostel management platform. Built as a monorepo, it integrates a Next.js web application, a React Native mobile client, a Node.js/Express service, a Django REST backend service, and shared TypeScript libraries.

---

## 🏗️ Repository Architecture

This repository uses **pnpm workspaces** and **Turborepo** to orchestrate dependencies and build pipelines across multiple applications and packages.

```
my-nilam/
├── apps/
│   ├── web/               # Next.js 14 Web Application (Tailwind CSS, Leaflet, React Query)
│   ├── backend/           # Node.js + Express API Backend (Prisma ORM, RBAC, Redis)
│   ├── django-backend/    # Django 5.2 REST Framework Service (Celery, Channels, SimpleJWT)
│   └── mobile/            # React Native / Expo Mobile Application
├── packages/
│   └── shared/            # Shared TypeScript utilities, types, and API SDK
├── package.json           # Root package configuration & Turborepo scripts
├── pnpm-workspace.yaml    # pnpm workspace configuration
└── turbo.json             # Turborepo task pipeline configuration
```

---

## 🚀 Tech Stack

### Frontend & Mobile
- **Web**: Next.js 14, React 18, Tailwind CSS, TanStack React Query, Leaflet Maps, Lucide Icons
- **Mobile**: React Native, Expo 49, TanStack React Query, Axios

### Backends & Services
- **Express Backend**: Node.js, Express, Prisma ORM, PostgreSQL, Redis, Custom RBAC Authorization Framework
- **Django Service**: Python 3.13+, Django 5.2, Django REST Framework, Celery, Django Channels, SimpleJWT, PostgreSQL, Daphne / Gunicorn
- **Shared Package**: TypeScript API client, shared models, utility helpers

---

## 🔑 Role-Based Access Control (RBAC)

The platform supports a 5-tier role hierarchy:

| Role | Access Level & Scope |
|---|---|
| `GUEST` | Unauthenticated visitor. Public property & hostel browsing and search. |
| `NORMAL` | Registered user. Browse properties, post ads/listings, submit inquiries, leave reviews. |
| `HOSTEL_ADMIN` | Hostel Owner. Exclusive access to assigned hostel management dashboard (rooms, vacancies, bookings). |
| `EMPLOYEE` | Moderator / Staff. View listings, verify ads, moderate reviews, limited admin access. |
| `SUPER_ADMIN` | Platform Owner. Unrestricted access to all resources, user roles, logs, and system metrics. |

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js**: `v18.x` or later
- **pnpm**: `v8.10.0` or later (`npm i -g pnpm`)
- **Python**: `v3.13+` with [`uv`](https://github.com/astral-sh/uv) or standard virtual environment
- **PostgreSQL**: `v14+` database instance
- **Redis**: `v6+` server (for caching and Celery/Channels task queues)

---

### Installation & Local Development

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd my-nilam
   ```

2. **Install Node Dependencies**
   ```bash
   pnpm install
   ```

3. **Set Up Django Backend**
   ```bash
   cd apps/django-backend
   uv sync

   # Activate virtual environment (or prefix commands with `uv run`)
   source .venv/bin/activate

   # Run Django migrations
   python manage.py migrate
   ```

4. **Set Up Express Backend & Prisma**
   ```bash
   cd ../backend
   pnpm prisma generate
   pnpm prisma db push
   ```

5. **Start Development Servers**
   From the repository root:
   ```bash
   pnpm dev
   ```
   *Runs Next.js web client, Node.js backend, and shared builds concurrently via Turborepo.*

   To start Django service independently:
   ```bash
   cd apps/django-backend
   uv run python manage.py runserver 8000
   ```

---

## 🌿 Git Branching Strategy

- **`prod`**: Production branch containing verified production-ready code. Connected to production hosting pipelines.
- **`staging`**: Integration branch where feature branches are merged and tested prior to production release.
- **`feature/*`**: Short-lived branches created off `staging` for active development.
- **`main`**: Documentation entry point and repository root.

---

## 📜 Available Scripts

Run these scripts from the repository root:

- `pnpm dev` — Start all applications in development mode with live reloading
- `pnpm build` — Build production artifacts across all apps and packages
- `pnpm lint` — Run linters across the entire workspace

---

## 📄 License

Private & Proprietary. All rights reserved.
