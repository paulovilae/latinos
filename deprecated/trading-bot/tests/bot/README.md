# Bot Microservice Tests

This directory contains tests for the Python-based bot microservice in the AI Trading Bot Platform.

## Test Categories

- **API Tests**: Tests for the FastAPI endpoints
- **Formula Tests**: Tests for trading formula calculations
- **Data Retrieval Tests**: Tests for market data retrieval and caching
- **Order Manager Tests**: Tests for trade execution
- **Integration Tests**: Tests for the complete microservice workflow

## Testing Focus

1. **Formula Accuracy**: Verifying trading formulas calculate correctly
2. **API Contract**: Ensuring endpoints return expected data structures
3. **Error Handling**: Testing recovery from data feed issues, calculation errors
4. **Performance**: Testing data retrieval and calculation performance
5. **Scheduling**: Verifying formula execution scheduling works correctly

## Test Structure

- Tests are organized by microservice component
- Unit tests focus on individual formula calculations and utility functions
- Integration tests verify the complete workflow from data retrieval to order execution

## Running Tests

```
cd bot_microservice
python -m pytest           # Run all tests
python -m pytest api/      # Run API tests only
python -m pytest -xvs      # Run with verbose output
```

## Best Practices

- Mock market data sources for deterministic testing
- Use test fixtures for common test data
- Test both normal and edge case scenarios
- Verify formula calculations against known results
- Test performance with realistic data volumes