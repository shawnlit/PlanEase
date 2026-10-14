# PlanEase — Privacy-Friendly Student Task Manager

PlanEase is a clean, minimalist, privacy-friendly task and deadline manager tailored for students. Backed by an embedded SQLite database using `better-sqlite3`, raw SQL schemas and views, FullCalendar, and Free-Tier-Only Groq AI task extraction, PlanEase is built as a unified Next.js application with zero ORM overhead.

---

## Features

### Stage 1: Core Task Management & Calendar
- **Responsive Minimalist Dashboard:**
  - Metric summary cards (Total Tasks, Pending Tasks, Completed Tasks, and Overdue Tasks).
  - Compact navigation sidebar with quick access to Overview, Checklist, and Calendar views.
  - PlanEase branding, quick task creation, and dark/light theme switching.
- **Task Management & Persistent Checklist:**
  - Create tasks with title, type (`exam`, `assignment`, or `task`), and optional deadline date.
  - Edit task titles, types, deadlines, and statuses.
  - Delete tasks with an explicit confirmation dialog.
  - Checkbox toggle for marking tasks complete or pending with persistent SQLite state.
  - Real-time search by task title.
  - Filter tasks by status (`All`, `Pending`, `Completed`) and type (`All`, `Exams`, `Assignments`, `General Tasks`).
  - Clear empty states when no tasks match or when the database is empty.
- **Academic Calendar Integration (FullCalendar):**
  - Interactive month and week calendar views.
  - Displays tasks on their deadline dates.
  - Distinct colour indicators for Exams (Rose), Assignments (Indigo), and General Tasks (Slate).
  - Clicking any calendar event opens the edit dialog for that task.
  - Clicking any empty date opens the task creation dialog prefilled with that date.
  - Tasks without deadlines are preserved in the database and shown on the checklist, but omitted from the calendar.
- **Robust SQLite Architecture:**
  - Raw SQL schema (`db/schema.sql`) and views (`db/views.sql`).
  - Views for `overdue_items` and `upcoming_items`.
  - Safe, idempotent database initialization in `src/lib/db.ts` (never drops tables or erases data on restart).
  - Parameterized queries to eliminate SQL injection vulnerabilities.

### Stage 2: Free-Tier-Only AI Task Extraction ("Quick Add with AI")
- **Prominent Natural-Language Input Card:**
  - Large multiline text area with character counter (max 1,500 characters).
  - Example chips (`DBMS assignment due Thursday`, `Maths exam on October 25`, `Revise normalization tomorrow`) populate text without auto-submitting.
  - Submits on click or `Ctrl+Enter` / `Cmd+Enter`.
  - Exactly one API request per deliberate user click; never calls the model on typing or rendering.
- **Strict Free-Tier-Only Groq Configuration:**
  - Operates exclusively on Groq's Free plan with zero paid provider fallbacks.
  - Whitelist of verified Free models (defaults to `llama-3.3-70b-versatile`). Fails closed on unverified or billable models.
  - Model outputs structured JSON with spoken deadline phrases.
- **Hard Local Safety Limits:**
  - Maximum **10 outbound requests per calendar day** in `Asia/Kolkata` timezone.
  - Maximum **2 outbound requests per minute**.
  - Maximum **1 active request at a time** (mutex lock).
  - Maximum **1,500 characters** per prompt.
  - Maximum **8 proposed tasks** per extraction.
  - Low output token limit (~500 tokens).
  - Atomic request slot reservation in SQLite `ai_usage` table before provider transmission.
  - Daily counters persist in SQLite across server restarts.
  - 60-second cooldown on HTTP 429 rate limits.
- **Deterministic Date Resolution (`chrono-node`):**
  - Spoken deadline phrases are resolved in code relative to `Asia/Kolkata` reference dates without timezone shifts.
  - Incomplete dates without months (e.g., "on the 25th") are flagged as ambiguous rather than guessed.
  - Past deadlines are clearly flagged with visual warnings.
- **Editable Confirmation Preview:**
  - Proposed tasks are rendered directly below the input card.
  - Each task can be checked/unchecked, edited in-place, cleared, or removed.
  - Selected tasks are saved in a single atomic SQLite transaction (`POST /api/tasks/batch`).
  - Cancelling the preview saves zero tasks.

> **Important Notice on Free-Tier Access & Local Limits:**
> Local usage safeguards ensure PlanEase stops calling the provider once local allowances are reached. However, Groq free-tier access remains subject to Groq's provider-level terms and rate limits. Local limits cannot control external API key usage outside PlanEase or account billing changes made directly in the Groq console. PlanEase is designed to fail closed and will never attempt a paid fallback.

---

## Technology Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Neutral palette with subtle indigo accent, light & dark themes)
- **Icons:** Lucide React
- **Calendar:** FullCalendar (`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`)
- **Database:** SQLite via `better-sqlite3`
- **Schema Management:** Raw SQL (`db/schema.sql`, `db/views.sql`, `db/seed.sql`)
- **LLM SDK:** `groq-sdk` (Free Tier)
- **Date Parsing:** `chrono-node`
- **Validation:** Zod

---

## Prerequisites

- **Node.js:** v18.17+ or v20+ / v22+
- **npm:** v9+ or v10+
- **Groq API Key:** Free API key from [Groq Console](https://console.groq.com)

---

## Setup & Environment Configuration

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file in the project root:
   ```dotenv
   LLM_PROVIDER=groq
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```
   *Note: `.env.local` is git-ignored and never committed or exposed to the browser.*

3. **(Optional) Seed sample student tasks:**
   ```bash
   npm run seed
   ```

4. **Run automated test suite:**
   ```bash
   npm run test
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

---

## Project Structure

```text
planease/
├── db/
│   ├── schema.sql         # Raw SQL table definitions (item, llm_log, ai_usage)
│   ├── views.sql          # Raw SQL views (overdue_items, upcoming_items)
│   └── seed.sql           # Realistic student seed tasks
├── data/
│   ├── .gitkeep           # Tracks data folder in Git
│   └── planease.db        # Persistent SQLite database (git-ignored)
├── scripts/
│   └── seed.ts            # Idempotent database seeder
├── tests/
│   └── stage2.test.ts     # Automated test suite (14 test cases)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── parse/
│   │   │   │   └── route.ts        # POST: AI task extraction | GET: Usage status
│   │   │   ├── tasks/
│   │   │   │   ├── route.ts        # GET: List tasks | POST: Create task
│   │   │   │   ├── [id]/route.ts   # GET, PATCH, DELETE single task
│   │   │   │   └── batch/route.ts  # POST: Atomic batch task insertion
│   │   ├── globals.css    # Tailwind CSS & theme tokens
│   │   ├── layout.tsx     # Root layout with ToastProvider
│   │   └── page.tsx       # Main PlanEase Dashboard with QuickAddAi
│   ├── components/
│   │   ├── ai/
│   │   │   ├── quick-add-ai.tsx          # Natural language card with chips
│   │   │   └── proposed-tasks-preview.tsx # Editable confirmation preview
│   │   ├── calendar/
│   │   │   └── task-calendar.tsx         # FullCalendar integration
│   │   ├── dashboard/
│   │   │   ├── header.tsx                # Brand header & action
│   │   │   ├── sidebar.tsx               # Navigation & SQLite status
│   │   │   └── summary-cards.tsx         # Metric summary cards
│   │   ├── tasks/
│   │   │   ├── delete-dialog.tsx         # Task deletion confirmation
│   │   │   ├── task-dialog.tsx           # Create / Edit modal
│   │   │   ├── task-item.tsx             # Checklist row
│   │   │   └── task-list.tsx             # Filterable task checklist
│   │   └── ui/
│   │       ├── badge.tsx, button.tsx, card.tsx, checkbox.tsx, dialog.tsx,
│   │       ├── input.tsx, skeleton.tsx, theme-toggle.tsx, toast.tsx
│   └── lib/
│       ├── date-resolver.ts # chrono-node date parsing with Asia/Kolkata
│       ├── db.ts            # SQLite connection and safe schema runner
│       ├── tasks.ts         # Parameterized SQL queries & batch transaction
│       ├── utils.ts         # Utilities and formatting
│       ├── validation.ts    # Zod schemas & TypeScript types
│       └── llm/
│           ├── config.ts      # Model whitelist and safety limit constants
│           ├── groq.ts        # Free-tier Groq API integration
│           └── usage-guard.ts # Atomic request reservation & audit log
├── next.config.ts         # Next.js config with serverExternalPackages
├── package.json           # Scripts and dependencies
├── tsconfig.json          # TypeScript config
└── README.md              # Project documentation
```
