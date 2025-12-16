# Environment Variables Guide

This document provides guidelines for using environment variables in the AI Trading Bot Platform codebase. Following these guidelines ensures consistent configuration across all components of the platform.

## Core Principles

1. **No Hard-Coded Values**: All configuration values must use environment variables with sensible defaults
2. **Central Configuration**: Each service has a central configuration module
3. **Validation**: All environment variables should be validated before use
4. **Documentation**: All environment variables must be documented in `.env.example`
5. **Consistent Patterns**: Use consistent patterns for accessing environment variables

## Configuration Files

The platform uses the following central configuration files:

- **Frontend**: `vite.config.ts` - Loads and exposes environment variables to the frontend
- **Backend**: `backend/src/config/config.js` - Central configuration module with validation
- **Bot Microservice**: `bot_microservice/environment_config.py` - Python configuration class
- **Startup System**: `startup/platform-config.js` - Configuration for platform startup

## Environment Files

- `.env.example` - Documentation of all environment variables (committed to repository)
- `.env` - Actual environment variables (not committed, added to .gitignore)

## Accessing Environment Variables

### Frontend (TypeScript)

Environment variables in the frontend must be prefixed with `VITE_` to be exposed to the client-side code:

```typescript
// Access environment variables from import.meta.env
const apiUrl = import.meta.env.VITE_API_URL;

// Or through process.env for compatibility
const apiKey = process.env.GEMINI_API_KEY;
```

### Backend (Node.js)

Always use the central configuration module:

```javascript
// Import the config module
const config = require('./config/config');

// Access configuration values
const port = config.port;
const jwtSecret = config.jwt.secret;

// Don't use process.env directly
// BAD: const port = process.env.PORT || 3000;
// GOOD: const port = config.port;
```

### Bot Microservice (Python)

Use the EnvironmentConfig class:

```python
from environment_config import EnvironmentConfig

# Create config instance
config = EnvironmentConfig()

# Access configuration values
debug_mode = config.debug
api_port = config.api_port
```

### Startup System (Node.js)

The startup system uses the platform-config.js file with environment variable overrides:

```javascript
// Access platform config
const platformConfig = require('./platform-config');

// Configuration already includes environment variable processing
const frontendPort = platformConfig.services.frontend.port;
```

## Adding New Environment Variables

When adding a new environment variable:

1. Add it to `.env.example` with documentation
2. Add it to the relevant configuration module with validation and default
3. Update any code to use the variable from the configuration module, not directly

## Environment Variable Naming Conventions

- Use UPPERCASE_WITH_UNDERSCORES for all environment variables
- Group related variables with common prefixes (e.g., `DB_*`, `JWT_*`)
- Frontend variables exposed to client-side code must be prefixed with `VITE_`

## Security Considerations

- Never commit `.env` files with actual values to the repository
- Use different environment variables for different environments (dev/test/prod)
- Provide secure defaults where possible to prevent errors on missing variables
- Validate critical environment variables (e.g., API keys, secrets) at startup

## Testing with Environment Variables

- Use `.env.test` for test-specific environment variables
- Consider using environment variable mocking for unit tests
- Ensure CI/CD pipelines set appropriate environment variables

## Environment-Specific Configuration

The platform supports different configurations based on the `NODE_ENV` environment variable:

- `development` - Default development configuration
- `test` - Configuration for running tests
- `production` - Production configuration with stricter validation

## Troubleshooting

If you encounter issues with environment variables:

1. Verify that the `.env` file exists and has the correct values
2. Check if the configuration module is loading and validating the variables correctly
3. Ensure you're accessing variables through the configuration module, not directly
4. Verify that variable types match expected values (strings, numbers, booleans)