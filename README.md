# latinos
Investment bot management platform plan. See `docs/plan.md` for architecture, backlog, and delivery details covering formula editing, dashboards, user management, and subscription billing.

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
- Frontend: http://localhost:3000
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
