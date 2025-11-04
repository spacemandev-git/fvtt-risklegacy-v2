# Risk Legacy API Tests

This directory contains comprehensive tests for all modules in the Risk Legacy project.

## Directory Structure

```
tests/
├── unit/              # Unit tests for utilities and helpers
├── integration/       # API endpoint and integration tests
├── game/              # Game logic tests (boardgame.io)
├── e2e/               # End-to-end full workflow tests
├── helpers/           # Test utilities and fixtures
└── README.md          # This file
```

## Test Philosophy

**Every module MUST have tests before it's marked complete.**

Tests serve three purposes:
1. **Verification**: Ensure the code works correctly
2. **Documentation**: Show how to use the API/feature
3. **Demonstration**: Prove functionality with visible console output

## Running Tests

```bash
# Run all tests
bun test

# Run specific test suites
bun test:unit              # Unit tests only
bun test:integration       # API integration tests
bun test:game              # Game logic tests
bun test:e2e               # End-to-end tests

# Run specific test file
bun test tests/integration/auth.test.ts

# Watch mode (auto-rerun on changes)
bun test:watch

# With coverage report
bun test:coverage
```

## Test Requirements

Each test file must:
- Use Bun's built-in test framework
- Include descriptive console output showing what's being tested
- Display input/output data in formatted JSON
- Test both success and error cases
- Verify edge cases and validation
- Use emojis for visual clarity (✅ ❌ 📝 🔍 🎯)

## Test Template

```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'

describe('Module X.Y: Feature Name', () => {
  beforeAll(() => {
    console.log('\n=== Testing Module X.Y: Feature Name ===\n')
  })

  test('should demonstrate core functionality', async () => {
    console.log('📝 Test: Core functionality')
    console.log('Input:', JSON.stringify(input, null, 2))

    const result = await functionUnderTest(input)

    console.log('Output:', JSON.stringify(result, null, 2))
    console.log('✅ Test passed\n')

    expect(result).toBeDefined()
  })

  afterAll(() => {
    console.log('=== Module X.Y Tests Complete ===\n')
  })
})
```

## Test Categories

### Unit Tests (`tests/unit/`)
Test individual functions and utilities in isolation:
- Asset loading and validation
- Helper functions
- Utility modules
- Zod schemas

### Integration Tests (`tests/integration/`)
Test API endpoints and database operations:
- Authentication flow
- Campaign management
- Lobby operations
- Asset serving
- Rulebook API

### Game Tests (`tests/game/`)
Test boardgame.io game logic:
- Game state initialization
- Setup phase
- Recruit phase
- Combat system
- Maneuver and card draw
- Victory conditions
- Faction powers
- Complete game flow

### E2E Tests (`tests/e2e/`)
Test complete user workflows:
- Full game from registration to victory
- Campaign creation → lobby → game → completion
- Multi-player scenarios

### Test Helpers (`tests/helpers/`)
Shared utilities for tests:
- Mock data generators
- Test fixtures
- Database seeders for tests
- API client utilities

## Module Completion Checklist

Before marking a module as complete:

- [ ] Implementation code written
- [ ] Tests created in appropriate directory
- [ ] All tests pass (`bun test`)
- [ ] Tests display clear console output
- [ ] Both success and error cases covered
- [ ] Edge cases tested
- [ ] Module status updated in Plan.md
- [ ] Code committed to git

## Writing Good Tests

### DO:
✅ Print what you're testing
✅ Show input data
✅ Show output/results
✅ Use descriptive test names
✅ Test error conditions
✅ Use emojis for visual clarity

### DON'T:
❌ Write silent tests (no console output)
❌ Skip edge cases
❌ Only test happy paths
❌ Use generic test names
❌ Skip API error responses

## Example: Good Test Output

```
=== Testing Module 2.1: Authentication API ===

📝 Test: User registration with valid data
Input: {
  "username": "testuser",
  "password": "securepass123"
}
Output: {
  "id": "user_abc123",
  "username": "testuser",
  "createdAt": "2024-01-01T00:00:00Z"
}
✅ Test passed

📝 Test: User login returns JWT token
Input: {
  "username": "testuser",
  "password": "securepass123"
}
Output: {
  "token": "eyJhbGc...",
  "expiresIn": 86400
}
✅ Test passed

🔍 Test: Registration with short password fails
Input: {
  "username": "testuser",
  "password": "short"
}
Error: {
  "error": "Password must be at least 8 characters"
}
✅ Validation works correctly

=== Module 2.1 Tests Complete ===
```

## CI/CD Integration

Tests will be run automatically on:
- Every commit (pre-commit hook)
- Pull requests
- Before deployment

All tests must pass before merging.

## Questions?

Refer to:
- `Plan.md` - Module-specific testing requirements
- Bun test docs: https://bun.sh/docs/cli/test
