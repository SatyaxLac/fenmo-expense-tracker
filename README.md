# Expense Tracker — Full-Stack Personal Finance Tool

A minimal, production-ready expense tracker with a **Node.js/Express** backend and **React** frontend. Built for data correctness and resilience under real-world conditions (network retries, browser refreshes, double-clicks).

## Live Application

- **Frontend**: [Deployed URL — add after deployment]
- **Backend API**: [Deployed URL — add after deployment]

---

## Quick Start (Local Development)

```bash
# Clone the repository
git clone <your-repo-url>
cd expense-tracker

# Backend
cd backend
npm install
npm run dev        # Starts on http://localhost:3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev        # Starts on http://localhost:5173 (proxies API to :3001)
```

### Run Tests

```bash
cd backend
npm test
```

---

## Architecture

```
expense-tracker/
├── backend/               # Express + SQLite API
│   ├── src/
│   │   ├── index.js       # Server entry, middleware, graceful shutdown
│   │   ├── db.js          # SQLite schema, WAL mode, singleton
│   │   ├── routes/
│   │   │   └── expenses.js    # POST/GET with idempotency + filtering
│   │   ├── middleware/
│   │   │   └── validation.js  # Zod schemas + Express middleware
│   │   └── __tests__/
│   │       └── expenses.test.js  # 12 unit/integration tests
│   └── package.json
├── frontend/              # React (Vite) + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ExpenseForm.jsx     # Form with idempotency key
│   │   │   ├── ExpenseList.jsx     # List with loading/empty states
│   │   │   ├── FilterControls.jsx  # Category filter + sort toggle
│   │   │   └── SummaryView.jsx     # Per-category breakdown
│   │   ├── hooks/
│   │   │   └── useExpenses.js      # Centralized state + API calls
│   │   └── utils/
│   │       ├── api.js              # API client with error handling
│   │       └── money.js            # Currency formatting + validation
│   └── package.json
└── README.md
```

---

## Key Design Decisions

### 1. Integer Money (Cents/Paise)
**All monetary amounts are stored as integers** in the smallest currency unit (paise for INR). This avoids IEEE 754 floating-point precision issues that plague financial calculations.

```
User enters: ₹42.50
Stored as:   4250 (integer)
Displayed:   ₹42.50 (converted back)
```

The frontend sends human-readable amounts; the backend converts to cents via `Math.round(amount * 100)` before storage. Totals are computed using integer `SUM()` in SQL, guaranteeing exact arithmetic.

### 2. Idempotency Keys (Handling Network Retries)
The `POST /expenses` endpoint accepts an `Idempotency-Key` header. If a client retries a request with the same key (due to network timeout or page reload), the API returns the existing record instead of creating a duplicate.

**How it works:**
1. Frontend generates a `crypto.randomUUID()` when the form mounts
2. This key is sent with the `Idempotency-Key` header on submit
3. The backend checks for an existing record with that key before inserting
4. On success, a **new key is generated** for the next submission
5. The SQLite `UNIQUE` constraint on `idempotency_key` provides a database-level safety net for race conditions

### 3. SQLite with WAL Mode
**Why SQLite?**
- ACID-compliant — transactions, constraints, and data integrity out of the box
- Zero configuration — no external database server to manage
- WAL (Write-Ahead Logging) mode for concurrent read performance
- Perfect for a single-server deployment within a 4-hour assessment window

In production, this could be migrated to PostgreSQL without changing the API layer.

### 4. Zod Validation (Shared Schema Logic)
Request bodies and query parameters are validated using Zod schemas on the backend. This provides:
- Type-safe parsing and transformation (e.g., category normalization to lowercase)
- Clear, structured error messages returned to the client
- Domain constraints enforced at the API boundary (amount > 0, date format, max lengths)

### 5. UI Resilience Patterns
- **Disabled submit button** while a request is in-flight — prevents double-click duplicates
- **Loading skeletons** during data fetch — prevents layout shift
- **Error banners** with clear messages — users know what went wrong
- **Form resets only on success** — failed submissions preserve user input

---

## API Reference

### `POST /expenses`
Create a new expense.

**Headers:**
- `Idempotency-Key` (optional but recommended): UUID to prevent duplicate creation

**Request Body:**
```json
{
  "amount": 42.50,
  "category": "food",
  "description": "Lunch with team",
  "date": "2025-05-01"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "amount": 42.50,
    "amount_cents": 4250,
    "category": "food",
    "description": "Lunch with team",
    "date": "2025-05-01",
    "created_at": "2025-05-01T12:00:00"
  }
}
```

### `GET /expenses`
Return a list of expenses.

**Query Parameters:**
- `category` (optional): Filter by category
- `sort` (optional): `date_desc` (default) or `date_asc`

**Response:**
```json
{
  "data": [...],
  "total_cents": 4250,
  "total": "42.50",
  "count": 1
}
```

### `GET /expenses/categories`
Return distinct categories for filter dropdowns.

### `GET /expenses/summary`
Return per-category spending breakdown.

---

## Trade-offs (Due to 4-Hour Timebox)

| Decision | Trade-off |
|----------|-----------|
| **SQLite (file-based)** | Chose for zero-config simplicity. Would use PostgreSQL in production for concurrent write scalability. |
| **No authentication** | Assumed single-user tool per the requirements. Would add JWT/session auth for multi-user. |
| **No pagination** | The expense list loads all records. Would add cursor-based pagination for large datasets. |
| **No soft deletes / edit** | Only CREATE and READ. Would add UPDATE/DELETE endpoints for a full CRUD system. |
| **In-process validation only** | No rate limiting or request size throttling beyond Express's JSON limit. |
| **No CI/CD pipeline** | Tests run locally. Would add GitHub Actions for automated test + deploy. |

---

## What I Intentionally Did NOT Do

- **Charts/graphs** — Visual appeal without data integrity doesn't impress in a production assessment
- **Complex state management (Redux/Zustand)** — React hooks + custom `useExpenses` hook is sufficient for this scope
- **Server-side rendering** — Not needed for a client-side expense form
- **Database migrations framework** — Single-table schema created inline; would use Knex/Prisma for evolving schemas
- **E2E tests** — Focused testing budget on the data-layer correctness (money handling, idempotency) where bugs have the highest cost

---

## Tests

12 automated tests covering the critical paths:

```
✓ Database Schema (3 tests)
  - Table creation
  - amount_cents > 0 constraint (negative amounts)
  - amount_cents > 0 constraint (zero amounts)

✓ Money Storage (3 tests)
  - ₹42.50 → 4250 cents conversion
  - Floating-point edge cases (0.1 + 0.2)
  - Integer SUM accuracy across multiple entries

✓ Idempotency (2 tests)
  - Duplicate key prevention
  - Null key permissiveness

✓ Filtering & Sorting (4 tests)
  - Category filtering
  - Date DESC sorting
  - Date ASC sorting
  - Filtered total calculation
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Node.js + Express | Industry standard, fast to build |
| Database | SQLite (better-sqlite3) | ACID, zero-config, WAL mode |
| Validation | Zod | Type-safe, composable schemas |
| Frontend | React (Vite) | Fast DX, component model |
| Styling | Tailwind CSS v4 | Utility-first, rapid UI |
| Tests | Jest | Standard Node.js testing |
