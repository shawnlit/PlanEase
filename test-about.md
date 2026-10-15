# PlanEase: Architecture, Database, API, and Security Notes

This document explains how PlanEase is organized, why the project uses its current boundaries, and how authentication, task requests, AI extraction, persistence, and data separation work together.

It is intended as a technical companion to the short project overview in [README.md](./README.md).

## 1. Architecture at a glance

PlanEase is a Next.js App Router application with four practical layers:

```text
Browser UI
  ├─ Auth forms
  ├─ Dashboard, checklist, calendar, dialogs
  └─ Quick Add with AI and proposal preview
          │ fetch / Supabase browser auth
          ▼
Next.js server boundary
  ├─ proxy.ts session refresh and route protection
  ├─ API route handlers
  ├─ Supabase server/admin helpers
  └─ Groq/date/usage services
          │
          ├─ Supabase Auth
          ├─ Supabase task, usage, and audit data
          └─ Groq Free-tier completion API

Local support layer
  ├─ db/schema.sql
  ├─ db/views.sql
  ├─ data/planease.db
  └─ src/lib/db.ts
```

The active authenticated application path uses Supabase for user identity and task persistence. The checked-in SQLite schema and helper remain a local/legacy support layer used by the repository's local database tooling and migration history. The two schemas should not be assumed to be interchangeable: the active task helpers in `src/lib/tasks.ts` query Supabase tables and require a `user_id`.

### Why this shape?

- **Next.js App Router** keeps page, server, and API concerns in one deployable application.
- **Route handlers** provide a narrow HTTP boundary for browser mutations.
- **Server helpers** centralize identity checks and persistence operations.
- **Zod schemas** give the UI, API, and AI pipeline the same accepted data shapes.
- **Supabase Auth** provides session handling without implementing password storage or token verification.
- **FullCalendar** handles calendar rendering while task state remains owned by PlanEase.
- **Groq is isolated behind `src/lib/llm/groq.ts`**, so the provider can be controlled, audited, and rejected without coupling the UI to SDK details.
- **SQLite support is lightweight and dependency-free at the application-model level**, making local scripts and migration checks straightforward.

## 2. File architecture

### Application routes

- `src/app/page.tsx` is the authenticated dashboard composition. It owns task loading, active view state, dialog state, and user-facing success/error notifications.
- `src/app/auth/login/page.tsx` and `src/app/auth/signup/page.tsx` render the shared auth form in the appropriate mode.
- `src/app/auth/callback/route.ts` completes the Supabase email-confirmation flow.
- `src/app/layout.tsx` defines metadata, fonts, theme handling, and the global toast provider.
- `src/app/globals.css` defines design tokens, accessible focus states, responsive calendar overrides, reduced motion, and theme colors.

### UI components

- `components/dashboard/`: header actions, view navigation, and summary metrics.
- `components/tasks/`: list filtering, task rows, create/edit dialog, and delete confirmation.
- `components/calendar/`: maps task deadlines into FullCalendar events.
- `components/ai/quick-add-ai.tsx`: sends natural-language input to `/api/parse`.
- `components/ai/proposed-tasks-preview.tsx`: lets the user select, edit, or discard extracted proposals before saving.
- `components/auth/`: login, signup, and logout interactions.
- `components/ui/`: reusable button, card, input, dialog, checkbox, badge, skeleton, toast, and theme primitives.

### Server libraries

- `src/lib/supabase/browser.ts`: creates the browser-safe Supabase client with the publishable key.
- `src/lib/supabase/server.ts`: reads cookies and verifies the current user with `auth.getUser()`.
- `src/lib/supabase/admin.ts`: creates a server-only client using `SUPABASE_SECRET_KEY`.
- `src/lib/tasks.ts`: user-scoped task CRUD and summary operations.
- `src/lib/validation.ts`: task, filter, AI request, AI response, and batch schemas.
- `src/lib/date-resolver.ts`: converts spoken deadlines into explicit dates/times.
- `src/lib/llm/config.ts`: provider, model allowlist, and limit configuration.
- `src/lib/llm/groq.ts`: server-only Groq call, response parsing, validation, and audit logging.
- `src/lib/llm/usage-guard.ts`: daily/minute limits, cooldowns, request mutex, and usage/audit RPC calls.

## 3. Database design

### Active Supabase data model

The active application expects Supabase tables and database functions for:

- `tasks`: task records with `user_id`, title, type, deadline, status, and creation timestamp.
- `ai_usage`: per-user request reservations with calendar date and minute timestamp.
- `llm_log`: audit entries for AI requests, model, reference date, status, token count, and errors.
- `reserve_ai_request`: an RPC used to reserve a request atomically against the daily and per-minute limits.
- `insert_llm_log`: an RPC used to record AI success/error events.

The important relationship is ownership:

```text
auth.users.id
    │
    ├── tasks.user_id
    ├── ai_usage.user_id
    └── llm_log.user_id
```

Every active task query includes `.eq('user_id', userId)`. This is repeated in reads, updates, and deletes rather than relying on an ID alone. As a result, knowing another user's numeric task ID does not grant access to that task.

### Local SQLite schema

`db/schema.sql` defines:

- `item`: local task records with title, type, deadline, status, and creation time.
- `llm_log`: local audit records for transmitted AI requests.
- `ai_usage`: local usage counters.

`db/views.sql` defines:

- `overdue_items`: pending tasks whose date is before today.
- `upcoming_items`: pending tasks whose date is today or later.

`src/lib/db.ts` opens `data/planease.db`, enables foreign keys, enables WAL mode, and idempotently applies the schema and views. It does not drop tables or erase data on restart.

The local schema predates the current Supabase user-scoped runtime path and does not represent the complete active authorization model. Any future migration from SQLite to Supabase must add explicit ownership before it becomes the production source of truth.

## 4. Authentication flow

### Sign up

The browser calls Supabase Auth through `createSupabaseBrowserClient()`:

```text
AuthForm (signup)
  → supabase.auth.signUp({ email, password, emailRedirectTo })
  → Supabase email confirmation
  → /auth/callback
  → session cookie
```

If email confirmation is enabled and no session is returned, the UI displays a confirmation message instead of navigating into the dashboard.

### Sign in

```text
AuthForm (login)
  → supabase.auth.signInWithPassword({ email, password })
  → session cookie managed by @supabase/ssr
  → window.location.assign(next || '/')
```

### Request protection

`proxy.ts` runs for application and API paths. It:

1. Creates a Supabase server client using request cookies.
2. Calls `supabase.auth.getUser()`.
3. Redirects unauthenticated page requests to `/auth/login`.
4. Returns `401` JSON for unauthenticated API requests.
5. Redirects an already-authenticated user away from `/auth/login`.
6. Preserves the requested page in the `next` query parameter.

Route handlers repeat `getAuthenticatedUser()` instead of trusting only the proxy. This defense in depth matters because authorization must be enforced at the data boundary as well as the navigation boundary.

## 5. API calls and request shapes

### `GET /api/tasks`

Lists the authenticated user's tasks.

Supported query parameters:

```text
status=all|pending|completed
type=all|exam|assignment|task
search=free-text
summary=true
```

The response contains:

```json
{
  "success": true,
  "tasks": [],
  "summary": {
    "total": 0,
    "pending": 0,
    "completed": 0,
    "overdue": 0
  }
}
```

### `POST /api/tasks`

Creates one task after `createTaskSchema` validation.

```json
{
  "title": "Submit DBMS assignment",
  "type": "assignment",
  "deadline": "2026-10-25T17:00",
  "status": "pending"
}
```

The server obtains the user from the session, inserts `user_id` itself, and returns the created task plus a recalculated summary.

### `GET /api/tasks/:id`

Returns one task only if the authenticated user owns the supplied positive integer ID. A missing owned task and a task belonging to another user both resolve to a non-success response.

### `PATCH /api/tasks/:id`

Updates any supplied subset of:

```json
{
  "title": "Submit revised DBMS assignment",
  "type": "assignment",
  "deadline": "2026-10-26",
  "status": "completed"
}
```

The route validates the body and applies both the ID and `user_id` filter.

### `DELETE /api/tasks/:id`

Deletes one owned task. The route returns `404` when the task does not exist for the current user and recalculates the summary after deletion.

### `POST /api/tasks/batch`

Saves selected AI proposals after the user confirms them.

```json
{
  "tasks": [
    {
      "title": "DBMS assignment",
      "type": "assignment",
      "deadline": "2026-10-22",
      "status": "pending"
    }
  ]
}
```

The batch schema requires at least one and allows at most eight tasks. The server supplies ownership and never accepts a client-provided `user_id`.

### `GET /api/parse`

Returns the authenticated user's AI usage status. It does not contact Groq.

### `POST /api/parse`

Accepts:

```json
{
  "text": "DBMS assignment due Thursday and revise normalization tomorrow"
}
```

Processing:

1. Verify the Supabase session.
2. Validate and trim the text with a 1,500-character limit.
3. Reserve a usage slot through the server-side guard.
4. Call Groq with the configured allowlisted model.
5. Require structured JSON output.
6. Validate model output with `llmExtractionResponseSchema`.
7. Resolve deadline phrases with `chrono-node`.
8. Mark ambiguous dates unselected for clarification.
9. Return proposals and usage information to the browser.

This endpoint does not save tasks. Saving happens later through the authenticated batch route.

## 6. AI methodology and safeguards

The AI feature is intentionally a constrained extraction tool, not an autonomous assistant.

### Prompt contract

The server prompt requires each result to contain:

- A non-empty title.
- A type of exactly `exam`, `assignment`, or `task`.
- The original spoken deadline phrase, or `null`.

The model is explicitly told not to calculate dates. Date calculation belongs to application code so it can be tested deterministically and handled consistently across providers.

### Validation and date resolution

- Zod rejects malformed or unsupported model output.
- Results are capped at eight proposed tasks.
- `chrono-node` resolves phrases relative to an explicit `Asia/Kolkata` reference date.
- Explicit times are preserved.
- Day-only phrases without a month are treated as ambiguous instead of guessed.
- Past dates receive a warning.
- Ambiguous tasks are unselected by default.

### Usage controls

The configured local policy is:

- Maximum 10 requests per calendar day.
- Maximum 3 requests per minute.
- Maximum 1 active request per process.
- Maximum 1,500 input characters.
- Maximum 8 proposed tasks.
- Low output token limit.
- 60-second provider cooldown after HTTP 429.

The request slot is reserved before the provider call. Audit logging records success and failure events with the user, reference date, model, and optional token count. There are no automatic paid-provider fallbacks or hidden retries.

## 7. Separation and security of data

### Identity separation

- Browser authentication uses only the Supabase publishable key.
- Server data access uses the verified session user ID.
- The service-role/secret Supabase key is loaded only in `src/lib/supabase/admin.ts`.
- The Groq key is loaded only on the server.
- No client request can choose the `user_id` written to a task.

### Authorization separation

Every protected route:

1. Verifies the current user.
2. Validates route IDs and request bodies.
3. Passes the verified user ID into the data helper.
4. Applies ownership constraints in the database query.

This prevents a common insecure pattern where the server checks login but queries by an unscoped task ID.

### Input and output safety

- Request bodies are parsed as JSON and validated with Zod.
- Task titles are trimmed and cannot be empty.
- Task types and statuses are closed enums.
- AI output is parsed as JSON and validated before it reaches the preview.
- Database errors are logged server-side while API responses use controlled messages.
- Secret environment variables are not prefixed with `NEXT_PUBLIC_`.

### AI privacy boundary

The text submitted to Quick Add with AI is sent to Groq because extraction is an external provider operation. The UI communicates this through its privacy notice. The account's unrelated task data is not included in the model prompt; the request contains the entered text and the server-generated reference date.

## 8. Package choices

### Runtime dependencies

- `next`, `react`, `react-dom`: application runtime and App Router.
- `@supabase/ssr`, `@supabase/supabase-js`: cookie-aware auth and server/browser clients.
- `groq-sdk`: typed provider integration.
- `better-sqlite3`: local SQLite support and migration-era tooling.
- `chrono-node`: natural-language date interpretation.
- `zod`: runtime validation shared by route and AI boundaries.
- `@fullcalendar/*`: calendar views and interaction.
- `lucide-react`: lightweight accessible icon components.
- `next-themes`: persisted light/dark theme switching.
- `class-variance-authority`, `clsx`, `tailwind-merge`: small, composable class utilities.

### Development dependencies

- `typescript`: static typing.
- `eslint`, `eslint-config-next`: linting.
- `tsx`: TypeScript scripts and the test command.
- Tailwind CSS 4 and its Turbopack integration: utility styling without a component framework.
- Node and React type packages: editor and build-time type safety.

## 9. Testing and verification

The repository test suite in `tests/stage6.test.ts` covers the security-sensitive migration behavior, including:

- Preservation of date-time deadlines.
- AI task type restrictions.
- Input length limits.
- Explicit time preservation.
- Date-only phrase handling.
- User ownership filters in task persistence.
- Session-derived route ownership.
- Authenticated AI operations and trusted database access.
- Secret environment variable separation.
- Groq model allowlist configuration.

Useful local checks:

```bash
npm test
npm run lint
npm run build
git diff --check
```

## 10. Development methodology

The project favors small, inspectable boundaries over broad abstractions:

1. Define accepted data with Zod.
2. Authenticate at the route boundary.
3. Pass the verified identity into server data helpers.
4. Keep provider calls server-only.
5. Make external results reviewable before persistence.
6. Keep date interpretation deterministic and testable.
7. Keep UI state local to the component that owns the interaction.
8. Use shared UI primitives for repeated behavior and accessibility.
9. Return explicit error statuses instead of silent fallbacks.
10. Validate builds and tests after changes.

That methodology keeps the product understandable for a small team while leaving clear seams for future changes such as richer recurring tasks, more providers, or a formal database migration.
