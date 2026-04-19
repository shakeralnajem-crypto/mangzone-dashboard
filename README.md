# MangZone Dental — Clinic Management System

A full-featured dental clinic management system built with React, Vite, and Supabase.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript 5 |
| Build | Vite 6 |
| Backend / DB | Supabase (Postgres + Auth + Realtime) |
| Styling | Tailwind CSS 3 + CSS design tokens |
| State | Zustand (auth, theme, undo/redo) |
| Data fetching | TanStack Query v5 |
| Routing | React Router DOM v7 |
| i18n | react-i18next (English + Arabic / RTL) |
| Charts | Recharts |
| UI primitives | Radix UI |

## Features

- **Appointments** — schedule, filter by doctor/status/date, compare-days view, status updates with undo/redo
- **Patients** — searchable patient list, full patient detail modal (visits, invoices, treatments)
- **Leads** — CRM pipeline with WhatsApp integration and one-click patient conversion
- **Billing** — invoices, payments, balance tracking, CSV export
- **Treatments** — treatment plan management per patient
- **Staff** — doctor profiles and clinic staff management
- **Reports** — revenue charts, appointment analytics, lead sources
- **Accounting** — expenses, doctor dues, monthly P&L
- **Content** — clinic content/post management
- **Role-based access** — Admin, Doctor, Receptionist, Accountant roles

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with the clinic schema applied

## Setup

**1. Clone and install**

```bash
git clone <repo-url>
cd mangzone-dental
npm install
```

**2. Configure environment**

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase credentials (see [Environment Variables](#environment-variables) below).

**3. Run locally**

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

| Variable | Description | Where to find it |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (public) key | Supabase Dashboard → Settings → API |

These variables must be prefixed with `VITE_` to be exposed to the browser by Vite.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run test:api` | Run API integration tests (Vitest) |

## Project Structure

```
src/
├── features/          # Feature-based modules (one folder per domain)
│   ├── appointments/
│   │   ├── components/   # Sub-components (modal, status dropdown, etc.)
│   │   └── pages/        # Page-level component
│   ├── billing/
│   ├── patients/
│   ├── leads/
│   ├── treatments/
│   ├── reports/
│   ├── staff/
│   ├── accounting/
│   ├── services/
│   ├── followup/
│   ├── content/
│   ├── settings/
│   ├── auth/
│   └── landing/
├── components/
│   ├── shared/        # Reusable cross-feature components
│   └── ui/            # Low-level Radix UI wrappers
├── hooks/             # Shared data-fetching hooks (one file per domain)
├── layouts/           # AppLayout, AuthLayout
├── lib/               # supabase client, permissions, i18n, utils
├── routes/            # Router configuration (all routes lazy-loaded)
├── store/             # Zustand stores (auth, theme, history)
├── config/            # Brand and env config
└── types/             # Generated Supabase types
```

## Authentication & Roles

The app uses Supabase Auth. After sign-in, a `profiles` row is fetched to determine the user's `role` and `clinic_id`.

| Role | Access |
|---|---|
| `ADMIN` | Full access, can delete anything |
| `DOCTOR` | Appointments, patients, treatments, reports |
| `RECEPTIONIST` | Appointments, patients, leads |
| `ACCOUNTANT` | Billing, accounting, reports |

## Known Limitations / Technical Debt

- Most data hooks fetch without a server-side `LIMIT` — this works fine for small clinics but will need server-side pagination as data grows.
- The Supabase client is cast to `any` in every hook file to work around a type-generation gap. Fixing this requires regenerating `src/types/supabase.ts` against the live schema.
- The revenue chart on the Dashboard page uses placeholder bar heights, not real data.
- `useDeleteExpense` performs a hard DELETE unlike the rest of the app which uses soft deletes.
