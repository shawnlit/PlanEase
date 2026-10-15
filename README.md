# PlanEase

PlanEase is a private, student-focused task and deadline manager. It combines a calm checklist and calendar workspace with an optional natural-language AI capture flow, so a student can write something like “DBMS assignment due Thursday” and review the extracted tasks before saving them.

The project is intentionally small: one Next.js application, typed API routes, Supabase authentication and persistence, FullCalendar for scheduling, and a server-only Groq integration with strict local usage limits.

## What it does

- Create, edit, complete, filter, search, and delete tasks.
- Organize tasks as exams, assignments, or general tasks.
- Add date-only or date-and-time deadlines.
- View deadlines in month and week calendar modes.
- Use keyboard-friendly controls and responsive layouts on mobile.
- Extract up to eight proposed tasks from natural-language input.
- Review and edit AI proposals before saving them in one batch.
- Keep task queries scoped to the authenticated Supabase user.
- Offer light and dark themes with a restrained acid-lime accent.

## Product flow

1. A user signs up or signs in through Supabase Auth.
2. The protected dashboard loads only that user's tasks.
3. Tasks can be entered directly or drafted with Quick Add with AI.
4. AI output is schema-validated and shown in an editable preview.
5. Natural-language deadlines are resolved in `Asia/Kolkata` with `chrono-node`.
6. The user confirms selected proposals.
7. The browser sends one validated batch request to save the tasks.

AI extraction is deliberately confirm-before-save. The model never writes directly to the task table.

## Tech stack

| Area | Choice |
| --- | --- |
| Application | Next.js 16 App Router |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4 |
| Authentication | Supabase Auth with `@supabase/ssr` |
| Active application data | Supabase database accessed through server-side helpers |
| Local database support | SQLite via `better-sqlite3` |
| Calendar | FullCalendar |
| AI provider | Groq Free-tier API |
| Date parsing | `chrono-node` |
| Validation | Zod |
| Icons | Lucide React |
| Testing | `tsx` test runner and repository test suite |

## Getting started

### Requirements

- Node.js 18.17+ (or a current Node LTS release)
- npm 9+
- A Supabase project
- A Groq API key if AI extraction is enabled

### Install

```bash
npm install
```

### Configure environment

Create `.env.local` in the repository root. Never commit this file or paste secret values into source files.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_server_only_supabase_secret

LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

The publishable Supabase key may be used by the browser client. `SUPABASE_SECRET_KEY` and `GROQ_API_KEY` are server-only and must never be exposed through `NEXT_PUBLIC_*` variables.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available commands

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm run start     # Serve the production build
npm run lint      # Run ESLint
npm test          # Run the repository test suite
npm run seed      # Run the optional local seed script
```

## Repository map

```text
PlanEase/
├── db/
│   ├── schema.sql       # Local SQLite schema and AI audit/usage tables
│   ├── views.sql        # Local SQLite overdue/upcoming views
│   └── seed.sql         # Optional local seed data
├── data/
│   └── planease.db      # Local SQLite runtime data (do not commit secrets)
├── scripts/
│   └── seed.ts          # Optional seed runner
├── tests/
│   └── stage6.test.ts   # Validation, ownership, AI, and configuration checks
├── proxy.ts             # Session refresh and protected-route enforcement
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── parse/route.ts
│   │   │   └── tasks/
│   │   │       ├── route.ts
│   │   │       ├── [id]/route.ts
│   │   │       └── batch/route.ts
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ai/             # AI input and confirmation preview
│   │   ├── auth/           # Login, signup, and logout UI
│   │   ├── calendar/       # FullCalendar integration
│   │   ├── dashboard/      # Header, navigation, summaries
│   │   ├── tasks/          # Task list, dialogs, and rows
│   │   └── ui/             # Shared primitives
│   └── lib/
│       ├── date-resolver.ts
│       ├── db.ts
│       ├── tasks.ts
│       ├── validation.ts
│       ├── llm/
│       └── supabase/
└── package.json
```

For the complete architecture, database, API, security, and design rationale, read [test-about.md](./test-about.md).

## Design principles

- **Private by default:** every protected request identifies the user from the server session.
- **Validate at boundaries:** request bodies, query filters, task types, statuses, and AI output are validated with Zod.
- **Confirm before persistence:** AI suggestions are drafts until the user selects and saves them.
- **Fail closed:** unverified models, missing server configuration, invalid output, and usage-limit violations stop the operation.
- **Small surface area:** shared UI primitives and server helpers avoid introducing a large UI framework or ORM.
- **Accessible by default:** visible focus states, semantic labels, responsive controls, reduced-motion support, and explicit loading/error/empty states.

## License and status

PlanEase is a private project currently under active development. Add a license before distributing it publicly.
