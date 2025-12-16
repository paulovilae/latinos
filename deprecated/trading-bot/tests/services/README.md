# Service Tests

This directory contains tests for service modules in the AI Trading Bot Platform.

## Types of Services Tested

- **API Services**: Tests for services that interact with backend APIs
- **Bot Services**: Tests for services that communicate with the bot microservice
- **CMS Services**: Tests for content management system services
- **Utility Services**: Tests for utility and helper services

## Testing Focus

1. **API Contract Validation**: Ensuring services correctly format requests and parse responses
2. **Error Handling**: Testing how services handle various error conditions
3. **Caching**: Verifying any caching mechanisms work as expected
4. **Retry Logic**: Testing retry mechanisms for failed API calls
5. **Data Transformation**: Ensuring services correctly transform data between frontend and backend formats

## Test Structure

- Each service should have a corresponding test file (e.g., `botService.test.ts`)
- API mock data should be stored in fixture files when possible
- Tests should be independent of actual API endpoints

## Best Practices

- Mock external dependencies (API calls, localStorage, etc.)
- Test both success and failure paths
- Verify that services correctly transform data between backend and frontend formats
- Test any caching or optimization functionality