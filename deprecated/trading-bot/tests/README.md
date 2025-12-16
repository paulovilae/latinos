# Project Test Organization

This directory contains the primary tests that are regularly used during development. These tests are essential for validating core functionality and ensuring code quality.

## Directory Structure

- `/tests/components/` - Tests for React components
- `/tests/services/` - Tests for service modules
- `/tests/contexts/` - Tests for context providers
- `/tests/backend/` - Tests for backend API functionality
- `/tests/bot/` - Tests for bot microservice functionality
- `/tests/startup/` - Tests for the unified startup system

## Test Naming Conventions

- Unit tests: `[filename].test.[ext]` 
- Integration tests: `[feature].integration.test.[ext]`
- E2E tests: `[workflow].e2e.test.[ext]`

## Running Tests

For frontend component tests:
```
npm test
```

For backend tests:
```
cd backend
npm run test
```

For bot microservice tests:
```
cd bot_microservice
python -m pytest
```

## Test Standards

All tests should follow the Arrange-Act-Assert pattern and include appropriate mocking of dependencies. Tests should be focused, deterministic, and independent of external services unless specifically testing integration points.