# Latinos Trading Platform

A comprehensive algorithmic trading platform featuring a public CMS-driven website, a user dashboard for strategy management, and a Python-based trading engine.

## 📂 Project Structure

| Path | Component | Description | Tech Stack |
|------|-----------|-------------|------------|
| `frontend/` | **Dashboard** | Main user interface for managing bots, backtests, and billing. | Next.js 14, Tailwind, Recharts |
| `app/` | **Website (CMS)** | Public marketing site and content management. | Next.js 15, Payload CMS 3.0 |
| `backend/` | **Trading Engine** | Core logic, strategy execution, and API. | Python, FastAPI, Pandas |
| `infrastructure/` | **DevOps** | Docker Compose services (DB, Redis). | Docker, Postgres, Redis |
| `apps/` | **Legacy/Misc** | Contains additional packages or experimental code (e.g., `trading`). | - |

## 🚀 Status & Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Auth** | ✅ Functional | NextAuth (Frontend) proxies to FastAPI Backend. |
| **Strategy Workbench** | ✅ Functional | Create/Edit strategies with code editor. |
| **Market Data** | ✅ Functional | Live charts (1H/1D/1W/1M) via Yahoo Finance integration. |
| **Billing** | ⚠️ Beta | Stripe integration implemented (`BillingPlans.tsx`) supporting Monthly/Annual. |
| **CMS** | ✅ Functional | Payload CMS for managing marketing pages and content. |
| **Backtesting** | ⚠️ In Progress | UI exists (see `GUIA_BACKTESTING.md`), connected to API via proxy. |

## 🛠️ Installation & Usage

### Prerequisites
- Node.js v18+ (v20 recommended)
- Python 3.11+
- Docker (optional but recommended for DB)
- pnpm (recommended for `app/` workspace)

### 1. Start Infrastructure (DB + Redis)
```bash
cd infrastructure
docker compose up -d
```
*Services: Postgres (5432), Redis (6379)*

### 2. Start Backend (API)
```bash
cd backend
# Create venv
python -m venv venv && source venv/bin/activate
pip install -e ".[dev]"
# Run API
uvicorn app.main:app --reload --port 8000
```
*API Docs: http://localhost:8000/docs*

### 3. Start Dashboard (Frontend)
```bash
cd frontend
cp .env.example .env.local
# Ensure NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```
*Dashboard: http://localhost:3003*

### 4. Start Website (CMS)
```bash
cd app
cp .env.example .env
pnpm install
pnpm dev
```
*Website: http://localhost:3000 | Admin Panel: http://localhost:3000/admin*

## ⚠️ Gap Analysis & Roadmap

As of Feb 2026, the following areas require attention to reach v1.0 complete status:

### 1. Architecture Cleanup
- **Issue:** Confusion between `app/` (root directory) and `apps/` (potential workspace).
- **Gap:** `frontend/` is outside the `apps/` structure usually found in monorepos.
- **Action:** Move all applications to `apps/` (e.g., `apps/web`, `apps/dashboard`) and implement a unified workspace (Turbo/Nx).

### 2. Unified Authentication
- **Issue:** The CMS (`app/`) and Dashboard (`frontend/`) appear to have separate authentication sessions.
- **Gap:** Users logging into the marketing site are not automatically authenticated in the dashboard.
- **Action:** Implement shared session state or SSO between the two Next.js applications.

### 3. Billing Integration Verification
- **Issue:** `BillingPlans.tsx` exists and handles Stripe logic, but needs end-to-end verification.
- **Gap:** Confirm webhook handling in `backend/` or `frontend/` to update user status in DB upon payment success.

### 4. Backtesting Visualization
- **Issue:** Backtesting functionality is available via API and basic UI.
- **Gap:** Lack of advanced equity curve plotting and trade-by-trade visualization in the Dashboard.

## 📚 Documentation
- [Backtesting Guide](GUIA_BACKTESTING.md)
- [Original Project Plan](docs/plan.md)
