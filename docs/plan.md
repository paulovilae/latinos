# Investment Bot Platform Implementation Plan

This document outlines the architecture, backlog, and delivery plan for an investment-bot management platform with formula editing, dashboards, user management, and subscription billing.

## Platform Choices
- **Frontend**: Next.js (React) with TypeScript for SSR/ISR marketing pages, dashboard UI, and websocket live updates.
- **Backend API**: FastAPI (Python) with Pydantic for typed contracts and async performance.
- **Workers**: Celery (with Redis broker) for backtests, signal generation, email, and webhook handling.
- **Database**: PostgreSQL for relational data (users, bots, formulas, signals, subscriptions, audit logs).
- **Cache/Real-time**: Redis for caching, rate limits, pub/sub for live feeds.
- **Payments**: Stripe subscriptions + customer portal; webhook ingestion through FastAPI + Celery.
- **Auth**: JWT access + refresh tokens; optional OAuth; FastAPI dependencies for RBAC. MFA and audit logs on sensitive actions.
- **Hosting**: Docker images; frontend on Vercel or similar, backend + worker on Render/Fly/ECS; managed Postgres + Redis.
- **Observability**: OpenTelemetry tracing/metrics/logging; Sentry for error reporting.

## Core Domain Models
- **User**: profile, roles (admin/user), MFA status, billing link to Stripe customer, audit logs.
- **Bot**: name, description, status (draft/running/paused), tags, owner, plan limits, linked formula versions.
- **Formula**: DSL payload or JSON graph, version history, validation status, created_by, last_published_at.
- **Signal**: bot_id, type (buy/sell/info), payload, emitted_at, execution mode (paper/live), delivery status.
- **Subscription**: plan, limits (bots, backtests, webhook destinations), status; derived from Stripe events.
- **Backtest**: bot/formula version reference, time range, market feed, results (PnL, drawdown, hit-rate), job status.
- **AuditLog**: actor, action, entity, timestamp, IP/device, diff snapshot for strategy edits.

## High-Level Architecture
1. **API Service (FastAPI)**
   - REST + websocket endpoints.
   - Auth middleware for JWT; refresh/reauth endpoints.
   - Stripe webhook receiver -> enqueue jobs to Celery.
   - CRUD for users, bots, formulas, signals, backtests; entitlements enforced per plan.
   - Backtest submission endpoint enqueues job and streams status.
2. **Worker Service (Celery)**
   - Jobs: backtest execution, rule evaluation, signal emission, email/notification sending, Stripe webhook processing, audit log fanout.
   - Uses Redis broker + Postgres results store where applicable.
3. **Frontend (Next.js)**
   - Marketing site and onboarding.
   - Auth pages (sign-in/up, MFA), dashboard layout, formula editor (visual + code), bot list/detail, signal feed, backtest results, billing portal link.
   - Websocket hooks for live signals and job progress.
4. **Data Layer**
   - SQLAlchemy + Alembic migrations; repository layer for queries.
   - Redis for caching user/session lookups, rate limits, live feed.

## API Surface (MVP)
- **Auth**: POST /auth/register, /auth/login, /auth/refresh, /auth/mfa/verify, /auth/password/reset
- **Users**: GET/PUT /users/me, GET/POST/PUT/DELETE /users (admin)
- **Bots**: GET/POST/PUT/DELETE /bots; POST /bots/{id}/deploy; POST /bots/{id}/pause
- **Formulas**: GET/POST /bots/{id}/formulas; POST /formulas/{id}/publish; GET /formulas/{id}/history
- **Backtests**: POST /backtests; GET /backtests/{id}; websocket for progress/results
- **Signals**: GET /signals (filters), websocket /ws/signals for live feed
- **Billing**: POST /billing/checkout, GET /billing/portal, Stripe webhook receiver
- **Admin/Observability**: GET /admin/health, GET /admin/metrics (protected), GET /admin/audit-logs

## Entitlements and Plans
- **Free**: 1 bot, 1 backtest/day, no live trading, limited signal retention.
- **Pro**: 10 bots, 50 backtests/month, live mode, webhooks, MFA required.
- **Enterprise**: Custom limits, priority compute, SSO/SAML, dedicated webhooks and SLAs.

Plan checks occur via middleware/dependencies in FastAPI and by gating UI actions in Next.js.

## Backlog by Phase
### Phase 1 (MVP)
- Auth + JWT + MFA basics
- User CRUD (admin)
- Stripe checkout + webhook handling; entitlements enforcement
- Bot CRUD + status transitions (draft/running/paused)
- Formula editor v1 (JSON schema + text view) with validation
- Backtest job submission + polling (or websocket)
- Signal logging + dashboard tables/charts
- Audit logging for bot/formula changes
- CI: linting, type checks, unit tests

### Phase 2 (Real-time + UX)
- Websocket live signals and job progress
- Visual formula builder with drag/drop blocks and version history diffing
- Notifications: email/push/webhooks with retry/backoff
- Paper vs live trading modes per bot
- Portfolio performance dashboards (PnL, drawdown, hit-rate)

### Phase 3 (Enterprise)
- Multi-tenant organizations, RBAC per org
- Marketplace for strategy templates; import/export
- SSO/SAML, SCIM; SOC2-aligned logging and retention
- Advanced observability dashboards and SLA metrics

## Delivery Plan (Epics & Milestones)
1. **Foundation**
   - Repo structure, Docker, CI pipeline, base FastAPI app, Next.js shell, shared contracts package.
2. **Authentication & Billing**
   - Auth flows, MFA, Stripe checkout + portal + webhooks, entitlement middleware.
3. **Bot & Formula Management**
   - CRUD, validation, version history, audit logs, deploy/pause toggles.
4. **Backtests & Signals**
   - Job queue, backtest engine stub, signal persistence + feeds, dashboard tables/charts.
5. **Real-time & UX**
   - Websockets, live dashboards, notifications, performance charts.
6. **Enterprise & Ops**
   - Multi-tenant, SSO, hardened security, observability, autoscaling policies.

## Suggested Repo Structure
```
backend/
  app/
    main.py
    api/
    models/
    services/
    workers/
    tests/
  pyproject.toml
frontend/
  app/
  components/
  lib/
  package.json
infrastructure/
  docker-compose.yml
  k8s/
  terraform/
shared/
  contracts/  # OpenAPI/JSON schemas for type-safe frontend/backend comms
```

## Risks & Mitigations
- **Market data source variability**: design pluggable provider interface; start with one vendor sandbox.
- **Strategy safety**: add rate limits, guardrails, and sandbox/paper trading by default.
- **Compliance/security**: MFA, audit logs, encrypted secrets, privacy export/delete tooling early.
- **Performance**: async IO in API, job queue for heavy tasks, caching for dashboards.

## Success Metrics (MVP)
- <10s backtest queue-to-start latency for typical jobs.
- 99% Stripe webhook success within 60s.
- P95 dashboard API latency <300ms under nominal load.
- <0.1% signal duplicate rate with deduplication guardrails.

