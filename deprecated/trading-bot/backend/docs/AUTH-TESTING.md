# Authentication API Testing Guide

This guide provides instructions for testing the authentication endpoints in the AI Trading Bot Platform backend. The tests cover all authentication features including registration, login, token refresh, protected routes, and logout.

## Authentication Endpoints

The backend implements the following authentication endpoints:

1. **POST /api/auth/register** - User registration
   - Creates a new user account
   - Returns access and refresh tokens on success

2. **POST /api/auth/login** - User login
   - Supports login via email or username
   - Returns access and refresh tokens on success

3. **POST /api/auth/refresh-token** - Token refresh
   - Uses refresh token to issue a new access token
   - Maintains session without requiring re-login

4. **POST /api/auth/logout** - User logout
   - Invalidates refresh token
   - Removes session cookies

5. **GET /api/auth/me** - Get current user (protected route)
   - Requires valid access token
   - Returns current user profile information

## Prerequisites

Before running the tests, ensure the following prerequisites are met:

1. **PostgreSQL Database**:
   - PostgreSQL server running on localhost:5432 (or as configured in .env)
   - Database created with name specified in .env (`trading_bot_db`)
   - Database user with proper permissions

2. **Backend Setup**:
   - Navigate to the backend directory: `cd backend`
   - Install dependencies: `npm install`
   - Run migrations: `npm run db:migrate`
   - Start the server: `npm run dev`

## Test Scripts

Two testing scripts are provided:

### 1. Node.js Test Script (test-auth.js)

A JavaScript-based test using Axios for HTTP requests:

- Supports all platforms (Windows, macOS, Linux)
- Provides detailed output and error handling
- Saves test results to JSON file for further analysis

**Setup:**
```bash
npm install --prefix . -f ./test-package.json
```

**Run:**
```bash
node test-auth.js
```

### 2. Bash Shell Script (test-auth.sh)

A bash script using cURL for HTTP requests:

- Better suited for Unix-like systems (Linux, macOS)
- Provides colorized terminal output
- Simple and easy to modify

**Run:**
```bash
bash test-auth.sh
```

## Test Scenarios

The test scripts include the following test scenarios:

### Registration Tests
- Successful registration with valid data
- Registration with existing email (should fail)
- Registration with existing username (should fail)
- Registration with password mismatch (should fail)

### Login Tests
- Login with valid email and password
- Login with valid username and password
- Login with invalid credentials (should fail)

### Protected Route Tests
- Access protected route with valid token
- Access protected route with invalid token (should fail)
- Access protected route without token (should fail)

### Refresh Token Tests
- Refresh access token with valid refresh token
- Refresh token with invalid token (should fail)

### Logout Tests
- Logout with valid refresh token
- Try to use refresh token after logout (should fail)

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify PostgreSQL is running:
   ```bash
   # Linux/macOS
   pg_isready -h localhost -p 5432
   
   # Windows (if psql is in PATH)
   pg_isready -h localhost -p 5432
   ```

2. Check database credentials in `.env` file
3. Ensure the database exists:
   ```bash
   psql -U postgres -c "CREATE DATABASE trading_bot_db;"
   ```

4. Run migrations manually:
   ```bash
   npx sequelize-cli db:migrate
   ```

### API Connection Issues

If the tests cannot connect to the API:

1. Verify the server is running: `npm run dev`
2. Check if the server is running on the expected port (3001)
3. Ensure there are no firewall or network issues
4. Check for any error messages in the server logs

## Additional Information

- Access tokens expire after 15 minutes (configurable in .env)
- Refresh tokens expire after 7 days (configurable in .env)
- The server uses HTTP-only cookies for tokens by default
- Tokens are also returned in the response body for testing purposes