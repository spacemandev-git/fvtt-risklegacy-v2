# Testing Guide - Quick Reference

## 🎯 Overview

Every module in this project now requires comprehensive tests before completion. Tests serve three purposes:
1. **Verification** - Ensure code works correctly
2. **Documentation** - Show how to use the API/feature
3. **Demonstration** - Prove functionality with visible console output

## 🚀 Quick Start

```bash
# Run all tests
bun test

# Run specific test suite
bun test:integration    # API tests
bun test:unit          # Unit tests
bun test:game          # Game logic tests
bun test:e2e           # End-to-end tests

# Run a specific test file
bun test tests/integration/server-health.test.ts

# Watch mode (auto-rerun on changes)
bun test:watch
```

## 📁 Directory Structure

```
tests/
├── unit/              # Unit tests for utilities and helpers
├── integration/       # API endpoint and integration tests
├── game/              # Game logic tests (boardgame.io)
├── e2e/               # End-to-end full workflow tests
├── helpers/           # Test utilities and fixtures
│   └── test-utils.ts  # Helper functions for pretty console output
└── README.md          # Detailed testing documentation
```

## ✅ Example Test Output

When you run `bun test tests/integration/server-health.test.ts`, you'll see:

```
============================================================
  Testing: Module 1.1
  Server Health Check & Basic Setup
============================================================

📝 Testing: GET /health
🌐 Request URL: "http://localhost:8000/health"

📨 Response:
{
  "status": 200,
  "statusText": "OK",
  "body": {
    "status": "ok",
    "timestamp": "2025-11-04T07:45:28.656Z",
    "version": "0.1.0"
  }
}
✅ Health endpoint is operational

============================================================
  ✅ Module 1.1: Server Health: 3 tests completed
============================================================
```

## 📝 Test Template

```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { testHeader, testFooter, testInfo, testSuccess } from '../helpers/test-utils'

describe('Module X.Y: Feature Name', () => {
  beforeAll(() => {
    testHeader('Module X.Y', 'Feature description')
  })

  test('should demonstrate core functionality', async () => {
    testInfo('📝', 'Testing: Core feature')
    testInfo('📨', 'Input:', inputData)

    const result = await yourFunction(inputData)

    testInfo('✅', 'Output:', result)
    expect(result).toBeDefined()

    testSuccess('Feature works correctly')
  })

  afterAll(() => {
    testFooter('Module X.Y: Feature Name', 1)
  })
})
```

## 🔧 Helper Functions

Located in `tests/helpers/test-utils.ts`:

```typescript
// Print formatted headers/footers
testHeader(moduleName, description)
testFooter(moduleName, testCount)

// Print test information
testInfo(emoji, message, data?)
testSuccess(message)
testExpectedError(message, error)

// Utilities
delay(ms)                    // Wait for async operations
measureTime(name, fn)        // Time execution
testData.randomString()      // Generate test data
testData.randomEmail()
testData.randomUsername()
```

## 📊 What Changed in Plan.md

### Added:
1. **Testing Strategy Section** - Complete testing philosophy and requirements
2. **Test Tasks** - Every module now has a test creation task
3. **Test Deliverables** - All modules specify their test files
4. **Test Scripts** - Added to package.json

### Updated Modules:
- Module 1.1: ✅ Has example test
- Module 1.2: Requires `tests/integration/rulebook.test.ts`
- Module 1.3: Requires `tests/integration/database.test.ts`
- Module 1.4: Requires `tests/unit/assets.test.ts`
- Module 2.1: Requires `tests/integration/auth.test.ts`
- Module 2.2: Requires `tests/integration/campaigns.test.ts`
- Module 3.1: Requires `tests/game/state.test.ts`
- Module 3.2: Requires `tests/game/setup.test.ts`
- Module 3.3: Requires `tests/game/recruit.test.ts`
- Module 3.4: Requires `tests/game/combat.test.ts`
- Module 3.5: Requires `tests/game/maneuver.test.ts`
- Module 3.6: Requires `tests/game/endgame.test.ts`
- Module 3.8: Requires `tests/game/powers.test.ts`
- Module 4.1: Requires `tests/game/full-game.test.ts`
- Module 4.2: Requires `tests/integration/boardgame-server.test.ts`
- Module 4.3: Requires `tests/integration/lobbies.test.ts`
- Module 4.4: Requires `tests/integration/assets.test.ts`
- Module 4.5: Requires `tests/integration/server.test.ts` + `tests/e2e/complete-flow.test.ts`

## 🎨 Console Output Standards

Use emojis for visual clarity:
- 📝 Test description
- 🌐 URL/endpoint being tested
- 📨 Request/response data
- ✅ Success/verification
- ❌ Error/failure
- 🔍 Investigating/checking
- 🎯 Target/goal
- ⏱️  Timing information

## ✨ Best Practices

### DO:
- ✅ Print what you're testing
- ✅ Show input data in JSON format
- ✅ Show output/results in JSON format
- ✅ Test both success and error cases
- ✅ Use descriptive test names
- ✅ Use emojis for visual clarity

### DON'T:
- ❌ Write silent tests (no console output)
- ❌ Skip edge cases
- ❌ Only test happy paths
- ❌ Use generic test names like "it works"

## 📚 Module Completion Checklist

Before marking a module complete:

- [ ] Implementation code written
- [ ] Tests created in appropriate directory
- [ ] All tests pass (`bun test`)
- [ ] Tests display clear console output
- [ ] Both success and error cases covered
- [ ] Edge cases tested
- [ ] Module status updated in Plan.md
- [ ] Code committed to git

## 🔗 References

- **Detailed Testing Docs**: `tests/README.md`
- **Complete Plan**: `Plan.md` (each module has specific test requirements)
- **Example Test**: `tests/integration/server-health.test.ts`
- **Test Helpers**: `tests/helpers/test-utils.ts`
- **Bun Test Docs**: https://bun.sh/docs/cli/test

## 💡 Tips

1. **Write tests as you build** - Don't save them for the end
2. **Use tests as documentation** - Show how the API should be used
3. **Make output readable** - Future you will thank present you
4. **Test error cases** - They're just as important as success cases
5. **Run tests before committing** - Catch issues early

## 🎯 Next Steps

When you start implementing Module 1.2 (Rules Parser), create:
- `tests/integration/rulebook.test.ts`

Follow the pattern from `server-health.test.ts` and use the helper functions from `test-utils.ts` for clean, readable output.

Happy testing! 🚀
