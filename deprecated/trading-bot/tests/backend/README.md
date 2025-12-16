# Backend Tests

This directory contains tests for the Node.js/Express.js backend API in the AI Trading Bot Platform.

## Test Categories

- **Authentication Tests**: Tests for user registration, login, token management
- **CMS Tests**: Tests for content management system functionality
- **Bot Integration Tests**: Tests for communication with the bot microservice
- **Media Tests**: Tests for media asset management

## Testing Focus

1. **API Contract**: Verifying endpoints return expected data structures
2. **Authentication**: Testing JWT token generation, validation, and refresh
3. **Error Handling**: Ensuring appropriate error responses and status codes
4. **Data Validation**: Testing input validation and sanitization
5. **Middleware**: Testing middleware functionality (rate limiting, auth checking, etc.)

## Test Structure

- Tests are organized by feature area (auth, cms, bot, media)
- Each major feature has a dedicated test file
- Test files use descriptive names indicating the feature being tested

## Running Tests

```
cd backend
npm run test:auth    # Run authentication tests
npm run test:cms     # Run CMS tests
npm run test:bot     # Run bot integration tests
npm run test:media   # Run media tests
npm run test:all     # Run all backend tests
```

## Best Practices

- Use a test database to avoid affecting production data
- Reset database state between test runs
- Test both success and error paths
- Mock external dependencies (especially bot microservice)
- Use descriptive test names that explain the expected behavior