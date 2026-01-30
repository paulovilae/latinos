# Backend Dependencies Reference

## Core Framework

- `fastapi` - Modern web framework for building APIs
- `uvicorn` - ASGI server for FastAPI
- `pydantic[email]` - Data validation with email support

## Database

- `sqlalchemy` - SQL toolkit and ORM
- `psycopg2-binary` - PostgreSQL database adapter

## Authentication & Security

- `python-jose[cryptography]` - JWT token handling
- `passlib[bcrypt]` - Password hashing
- `python-dotenv` - Environment variable management

## External Services

- `stripe` - Payment processing
- `httpx` - HTTP client for API calls
- `redis` - Caching and session storage

## Data & Market

- `yfinance` - Yahoo Finance market data
- `cachetools` - In-memory caching utilities

## Utilities

- `python-multipart` - Multipart form data parsing

## Development

- All production dependencies are available in dev mode

## Installation

```bash
pip install -e .[dev]
```

## Docker

Dependencies are installed automatically in the Docker build process via `pyproject.toml`.
