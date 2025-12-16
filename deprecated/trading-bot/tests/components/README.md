# Component Tests

This directory contains tests for React components in the AI Trading Bot Platform.

## Types of Tests

### Unit Tests
Individual component testing in isolation, focusing on:
- Rendering correctly with different props
- State updates
- User interactions (clicks, inputs, etc.)
- Conditional rendering

### Integration Tests
Tests that verify multiple components working together, focusing on:
- Parent-child component communication
- Context provider integration
- Component composition

## Structure

- Top-level component tests (e.g., `BotConfigurationPage.test.tsx`)
- `/editor/` - Tests for WYSIWYG editor components

## Best Practices

1. **Snapshot Testing**: Use for UI stability verification
2. **Event Testing**: Test user interactions thoroughly
3. **Props Testing**: Verify component behaves correctly with different props
4. **Error States**: Test component error handling
5. **Accessibility**: Include tests for a11y compliance

## Common Testing Utilities

- React Testing Library for component testing
- Jest for assertions and mocking
- User-event for simulating user interactions