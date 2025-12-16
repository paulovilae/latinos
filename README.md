# latinos
Investment bot management platform plan. See `docs/plan.md` for architecture, backlog, and delivery details covering formula editing, dashboards, user management, and subscription billing.

## GitHub Repository
This project is hosted on GitHub: https://github.com/paulovilae/latinos

## Quick Start Guide

### Prerequisites
- **Node.js**: v18.20.2 or >=20.9.0
- **pnpm**: v9 or v10 (package manager)
- **Python**: 3.11+ (for backend)
- **Docker & Docker Compose** (optional, for full-stack deployment)

### Option 1: Full-Stack with Docker (Recommended for beginners)

The easiest way to get everything running:

```bash
cd infrastructure
docker compose up --build
```

This starts:
- **Frontend**: http://localhost:3003
- **API**: http://localhost:8000
- **Postgres**: localhost:5432 (credentials: user/password `app`/`secret`)
- **Redis**: localhost:6379

### Option 2: Frontend + Backend (Local Development)

#### 1. Start the Backend API

```bash
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

The API will be available at http://localhost:8000
- Interactive API docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

#### 2. Start the Frontend (in a new terminal)

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at http://localhost:3003

#### 3. Configure Frontend Environment

```bash
cd frontend
cp .env.example .env.local
# Adjust if you changed the backend host/port
```

### Option 3: Backend Only (Testing & Development)

#### Run Tests
```bash
PYTHONPATH=backend pytest -q
```

#### Test API Without Server
```bash
PYTHONPATH=backend python - <<'PY'
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

print("Health:", client.get("/admin/health").json())
print("Register:", client.post("/auth/register", json={
    "email": "alice@example.com",
    "password": "secret",
    "name": "Alice",
    "role": "user"
}).json())
PY
```

### Option 4: Frontend Only

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on http://localhost:3003

## Project Structure

```
latinos/
├── app/                    # Next.js + Payload CMS application
├── backend/               # FastAPI backend service
├── frontend/              # React dashboard components
├── infrastructure/        # Docker Compose configuration
├── shared/               # Shared utilities and API client
├── packages/             # Shared packages
└── docs/                 # Documentation
```

## Key Features

### Strategy Workbench
- Edit strategy payloads and attach tickers
- Live market data plots with Yahoo! Finance integration
- Support for 1H/1D/1W/1M chart horizons
- Automatic fallback to synthetic data when offline

### User Management
- Invite users and manage permissions
- Toggle MFA (Multi-Factor Authentication)
- User deletion and role management

### Localization
- English and Spanish language support
- Real-time language switching without page refresh
- LLM-powered translation cache for dynamic content

### Market Data
- Discover tradable tickers: `GET /market-data/universe`
- Request live candles: `GET /market-data/{symbol}?interval=1d&range=1mo`
- 15-second polling for real-time updates

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login

### Bots
- `GET /bots` - List all bots
- `POST /bots` - Create new bot
- `GET /bots/{id}` - Get bot details
- `PUT /bots/{id}` - Update bot
- `DELETE /bots/{id}` - Delete bot
- `POST /bots/{id}/deploy` - Deploy bot
- `POST /bots/{id}/pause` - Pause bot

### Formulas
- `POST /bots/{id}/formulas` - Create formula
- `PUT /formulas/{id}` - Update formula
- `POST /formulas/{id}/publish` - Publish formula

### Market Data
- `GET /market-data/universe` - Get available tickers
- `GET /market-data/{symbol}` - Get candle data

### Users
- `GET /users` - List users
- `GET /users/{id}` - Get user details
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Dashboard
- `GET /dashboard/summary` - Get dashboard metrics

## Development

### Build Frontend
```bash
cd frontend
npm run build
```

### Run Frontend in Production Mode
```bash
cd frontend
npm run dev:prod
```

### Lint Code
```bash
cd frontend
npm run lint
npm run lint:fix
```

### Run Tests
```bash
cd frontend
npm run test
npm run test:int      # Integration tests
npm run test:e2e      # End-to-end tests
```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEMO_TOKEN=demo-admin-token
```

### Backend
```
LATINOS_USE_REAL_FASTAPI=1  # Enable interactive API docs
```

## Troubleshooting

### Port Already in Use
If ports 3003 or 8000 are already in use:
- Change the port in the startup command: `--port 8001`
- Or kill the process using the port

### Database Connection Issues
- Ensure Postgres is running (if using Docker Compose)
- Check credentials in environment variables
- Verify database migrations have run

### Frontend Can't Connect to Backend
- Verify backend is running on the correct port
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors

## Documentation

- **Architecture & Backlog**: See `docs/plan.md`
- **API Documentation**: http://localhost:8000/docs (when running with real FastAPI)
- **Frontend Components**: See `frontend/components/`

## License

MIT

## Support

For issues and questions, please visit: https://github.com/paulovilae/latinos/issues

---

## Quickstart
These steps assume Python 3.11+ is available. No third-party packages are required for the included tests because lightweight FastAPI/Pydantic shims live in `backend/fastapi` and `backend/pydantic`.

1. (Optional) create and activate a virtual environment.
2. From the repository root run the tests:

   ```bash
   PYTHONPATH=backend pytest -q
   ```

   The `PYTHONPATH` hint points Python at the bundled shims so pytest can import `fastapi` and `pydantic` without installing anything.

## Trying the API without a server
You can exercise the API routes directly using the bundled `TestClient` without starting a web server:

```bash
PYTHONPATH=backend python - <<'PY'
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

print("Health:", client.get("/admin/health").json())
print("Register:", client.post("/auth/register", json={
    "email": "alice@example.com",
    "password": "secret",
    "name": "Alice",
    "role": "user"
}).json())
PY
```

## Running with real FastAPI/uvicorn (optional)
If you prefer to spin up an HTTP server, install the optional dependencies and launch uvicorn from the `backend` directory:

```bash
pip install -e "backend[dev]"
cd backend
uvicorn app.main:app --reload --port 8000
```

Note: because the repository ships with local `fastapi` and `pydantic` shims, avoid setting `PYTHONPATH=backend` when running uvicorn so the real packages from your environment are used.

## Docker Compose stack (frontend + backend + db + cache)

A full-stack sandbox with Postgres, Redis, the FastAPI service, a worker, and the Next.js dashboard lives in `infrastructure/docker-compose.yml`.

```
cd infrastructure
docker compose up --build
```

Services:
- Frontend: http://localhost:3003
- API: http://localhost:8000
- Postgres: localhost:5432 (user/password `app`/`secret`)
- Redis: localhost:6379

## Frontend

The Next.js dashboard prototype is in `frontend/`. To run it standalone:

```
cd frontend
npm install
npm run dev
```

The dev server listens on http://localhost:3003.

### Strategy workbench + market data

- Edit strategy payloads, attach the tickers you want to trade, and see live plots in the dashboard's new **Strategy workbench** section.
- Back-end APIs now accept stock selections and notes via `POST /bots/:id/formulas` and `PUT /formulas/:id`.
- Discover tradable tickers with `GET /market-data/universe` and request live (Yahoo! Finance backed) candles with `GET /market-data/{symbol}?interval=1d&range=1mo`; the endpoint automatically falls back to synthetic data when offline, so tests keep passing.
- The workbench now polls `/market-data/{symbol}` every 15 seconds, stamps the last refresh time, and lets you flip between 1H/1D/1W/1M chart horizons with axes so you can see the most recent moves at a glance.
- The dashboard includes a **User management** card that calls the FastAPI endpoints directly, so you can invite, toggle MFA, or delete users without touching curl.
- A global theme toggle switches between light/dark palettes, and a Spanish language toggle hydrates translated labels via a small translation dictionary (see `LocalizationProvider` and `LocalizedText` on the frontend).

### Running the live dashboard without Docker

1. Start the FastAPI app (built-in demo admin + sample bots will be seeded automatically):
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```
2. Configure the frontend to talk to the API and demo admin token:
   ```bash
   cd frontend
   cp .env.example .env.local
   # adjust if you changed the backend host/port
   npm install
   npm run dev
   ```
3. Open http://localhost:3003. The dashboard now calls the API for every widget:
   - **Bots** table + form uses `/bots`, `/bots/{id}/deploy|pause|delete`.
   - **Strategy workbench** saves formulas through `/bots/{id}/formulas` + `/formulas/{id}/publish` and manages the ticker universe via `/market-data/universe`.
   - **Metrics/formulas/signals/backtests** cards pull the snapshot returned by `/dashboard/summary`.
   - **User management** uses `/users`, `/users/{id}`, and `/users/{id}` (DELETE) for CRUD + MFA toggling.

The default demo token is `demo-admin-token`; override it with `NEXT_PUBLIC_DEMO_TOKEN` if you authenticate with a different admin user.

### API docs

- The project ships with 1st-party FastAPI shims for tests, but when you run the real server set `LATINOS_USE_REAL_FASTAPI=1` before launching uvicorn to enable the interactive docs at `http://localhost:8000/docs` and `http://localhost:8000/redoc`.
- Regardless of runtime, `GET /openapi.json` returns a machine-readable schema (the shim responds with a hint to switch to the real server).

### Localization & Spanish translations

- The UI already supports English and Spanish toggles through the `LocalizationProvider` context—strings rendered via `LocalizedText` swap instantly on the client without refreshing the page.
- For dynamic copy we plan to back the dictionary with an LLM-powered translation cache:
  1. When a translation key is missing, the frontend will call a lightweight `/translations` endpoint.
  2. The backend checks a Redis cache (keyed by language + message hash). If absent, it enqueues a worker job that hits the LLM provider, stores the response in Redis/Postgres, and returns the English fallback immediately.
  3. The next call for that key/language combination will hit the cache and stream the saved translation back to the client.
- Manual overrides can live in Postgres (allowing product teams to tweak critical words), while a TTL on Redis keeps the hot set fast. The same infrastructure can emit bilingual audit logs or localized email templates by reusing the cache + worker pipeline.
