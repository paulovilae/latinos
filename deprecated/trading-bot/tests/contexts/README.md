# Context Tests

This directory contains tests for React context providers in the AI Trading Bot Platform.

## Context Providers Tested

- **ThemeContext**: Tests for theme management functionality
- **LanguageContext**: Tests for internationalization functionality
- **EditorContext**: Tests for CMS editor state management
- **AuthContext**: Tests for authentication state management (when implemented)

## Testing Focus

1. **State Management**: Verifying context state updates correctly
2. **Provider Behavior**: Testing provider components render children correctly
3. **Consumer Behavior**: Testing how components consume context values
4. **Custom Hooks**: Testing hooks that use or extend context functionality

## Test Structure

- Each context should have a corresponding test file (e.g., `EditorContext.test.tsx`)
- Tests should verify both the provider and any custom hooks that use the context

## Best Practices

- Test all context state transitions
- Verify context defaults work as expected
- Test context consumers receive updated values when state changes
- Mock any external dependencies (localStorage, API calls, etc.)
- Ensure proper cleanup between tests to prevent state leakage