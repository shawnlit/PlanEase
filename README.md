# PlanEase — Stage 1: Integrated Task Manager

PlanEase is a clean, minimalist, privacy-friendly task and deadline manager tailored for students. Backed by an embedded SQLite database using `better-sqlite3`, raw SQL schemas and views, and integrated with FullCalendar, PlanEase is built as a unified Next.js application with zero ORM overhead.

---

## Features (Stage 1)

- **Responsive Minimalist Dashboard:**
  - Metric summary cards (Total Tasks, Pending Tasks, Completed Tasks, and Overdue Tasks).
  - Compact navigation sidebar with quick access to Overview, Checklist, and Calendar views.
  - PlanEase branding, quick task creation, and dark/light theme switching.

- **Task Management & Persistent Checklist:**
  - Create tasks with a title, type (`exam`, `assignment`, or `task`), and optional deadline date.
  - Edit task titles, types, deadlines, and statuses.
  - Delete tasks with an explicit confirmation dialog.
  - Checkbox toggle for marking tasks complete or pending again with persistent SQLite state.
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
  - Server-side database access using Next.js App Router API routes (`src/app/api/tasks/`).

---

## Technology Stack

- **Framework:** Next.js (App Router, Node.js runtime for API routes)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Neutral palette, sleek borders, dark & light themes)
- **Icons:** Lucide React
- **Calendar:** FullCalendar (`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`)
- **Database:** SQLite via `better-sqlite3`
- **Schema Management:** Raw SQL (`db/schema.sql`, `db/views.sql`, `db/seed.sql`)
- **Validation:** Zod

---

## Prerequisites

- **Node.js:** v18.17+ or v20+ / v22+
- **npm:** v9+ or v10+

---

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **(Optional) Seed sample student tasks:**
   To populate initial academic tasks (midterms, assignments, problem sets):
   ```bash
   npm run seed
   ```
   *Note: Seeding is idempotent and will not duplicate tasks if the database already contains records.*

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000).

5. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

---

## Database Architecture & Initialization

- **Database location:** `data/planease.db` (git-ignored for privacy).
- **Initialization:**
  - Upon server startup, `src/lib/db.ts` ensures the `data/` directory exists.
  - It enables `PRAGMA foreign_keys = ON;` and `PRAGMA journal_mode = WAL;`.
  - It safely executes `db/schema.sql` (`CREATE TABLE IF NOT EXISTS item ...`) and `db/views.sql`.
  - It preserves existing task records across server restarts without recreation.
- **SQL Views:**
  - `overdue_items`: Pending tasks with deadlines before the current date (`date(deadline) < date('now')`).
  - `upcoming_items`: Pending tasks with deadlines today or later (`date(deadline) >= date('now')`).

> **Important Note on SQLite Persistence:**
> The SQLite database file resides locally on the server filesystem (`data/planease.db`). Data is persistent on the local machine running the server, but is not synchronized to external cloud databases or multi-region serverless instances without volume mounts.

---

## Project Structure

```text
planease/
├── db/
│   ├── schema.sql         # Raw SQL table definitions & indexes
│   ├── views.sql          # Raw SQL views (overdue_items, upcoming_items)
│   └── seed.sql           # Sample academic task data
├── data/
│   ├── .gitkeep           # Tracks the data folder while ignoring *.db files
│   └── planease.db        # SQLite database (auto-generated at runtime)
├── scripts/
│   └── seed.ts            # Development database seed script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── tasks/
│   │   │       ├── route.ts        # GET /api/tasks & POST /api/tasks
│   │   │       └── [id]/
│   │   │           └── route.ts    # GET, PATCH, DELETE /api/tasks/[id]
│   │   ├── globals.css    # Tailwind CSS & theme tokens
│   │   ├── layout.tsx     # Root layout with ToastProvider
│   │   └── page.tsx       # Main PlanEase Dashboard
│   ├── components/
│   │   ├── calendar/
│   │   │   └── task-calendar.tsx   # FullCalendar integration
│   │   ├── dashboard/
│   │   │   ├── header.tsx          # Brand header & quick action
│   │   │   ├── sidebar.tsx         # Navigation sidebar & SQLite status
│   │   │   └── summary-cards.tsx   # Metric summary cards
│   │   ├── tasks/
│   │   │   ├── delete-dialog.tsx   # Task deletion confirmation
│   │   │   ├── task-dialog.tsx     # Create / Edit task modal
│   │   │   ├── task-item.tsx       # Individual task checklist row
│   │   │   └── task-list.tsx       # Filterable & searchable task checklist
│   │   └── ui/
│   │       ├── badge.tsx           # Type & status badges
│   │       ├── button.tsx          # Action buttons
│   │       ├── card.tsx            # Minimalist cards
│   │       ├── checkbox.tsx        # Accessible task checkbox
│   │       ├── dialog.tsx          # Modal dialog primitive
│   │       ├── input.tsx           # Form inputs
│   │       ├── skeleton.tsx        # Loading skeletons
│   │       ├── theme-toggle.tsx    # Light/Dark mode toggle
│   │       └── toast.tsx           # Toast notifications system
│   └── lib/
│       ├── db.ts          # SQLite connection and SQL file execution
│       ├── tasks.ts       # Parameterized SQL data-access functions
│       ├── utils.ts       # Formatting and class utilities
│       └── validation.ts  # Zod validation schemas & TypeScript types
├── next.config.ts         # Next.js configuration with serverExternalPackages
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

---

## Current Limitations (Stage 1)

- Single-user local setup (no multi-user authentication or accounts).
- No natural language task parsing or LLM integrations (planned for subsequent stages).
- Calendar displays deadlines; automatic study timetable slotting is not included.
