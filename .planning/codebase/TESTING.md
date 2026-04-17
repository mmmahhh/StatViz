# Testing Patterns

**Analysis Date:** 2026-04-17

## Test Framework

**Runner:**
- Vitest 1.4.0 (configured in `vite.config.ts`)
- Config: `vite.config.ts` (vitest section)
- Environment: jsdom (browser-like DOM testing)

**Assertion Library:**
- Vitest built-in expect API (no separate assertion library needed)
- Integration: @testing-library/react for component testing
- Test utilities: @testing-library/jest-dom for DOM matchers

**Run Commands:**
```bash
npm test                    # Run all tests (vitest)
npm test -- --watch       # Watch mode (re-run on changes)
npm test -- --coverage    # Run tests with coverage report
```

**Vitest Configuration (from `vite.config.ts`):**
```typescript
test: {
  globals: true,            // Use global describe/it/expect
  environment: 'jsdom',     // DOM environment for React testing
  setupFiles: './src/test/setup.ts',
  css: true,                // Process CSS imports in tests
}
```

## Test File Organization

**Location:**
- Tests co-located with source files OR in `src/test/` directory
- Utilities tests in `src/test/` (e.g., `src/test/filterData.test.ts` for `src/utils/filterData.ts`)
- Component test in same directory: `src/App.test.tsx` alongside `src/App.tsx`

**Naming:**
- Pattern: `[filename].test.ts` or `[filename].test.tsx`
- Examples: `filterData.test.ts`, `capabilityStats.test.ts`, `App.test.tsx`

**Structure:**
```
src/
├── test/
│   ├── setup.ts                    # Vitest setup (imports testing-library/jest-dom)
│   ├── filterData.test.ts
│   ├── capabilityStats.test.ts
│   ├── hypothesisStats.test.ts
│   ├── regression.test.ts
│   ├── msaStats.test.ts
│   └── descriptiveStats.test.ts
└── App.test.tsx
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from 'vitest';
import { applyFilters } from '../utils/filterData';
import { RawDataRow, FilterRule } from '../types';

describe('applyFilters', () => {
  // Test cases
  it('returns all data when no filters', () => {
    expect(applyFilters(data, [])).toEqual(data);
  });
  
  it('filters by "in" operator', () => {
    // Arrange
    const filters: FilterRule[] = [
      { id: '1', column: 'name', operator: 'in', value: ['A', 'C'], enabled: true },
    ];
    
    // Act
    const result = applyFilters(data, filters);
    
    // Assert
    expect(result).toHaveLength(2);
  });
});
```

**Patterns:**
- Setup: Arrange/Act/Assert pattern (visible in tests)
- Each `it()` block tests one specific behavior
- Descriptive test names explain what is being tested: `'returns all data when no filters'`
- Test data created inline or reused across tests
- Tests are independent and can run in any order

**Setup/Teardown:**
- No explicit beforeEach/afterEach visible in current tests
- Test data (e.g., `data`, `config`) created at top of describe block for reuse
- Setup file (`src/test/setup.ts`) imports jest-dom matchers

## Mocking

**Framework:**
- Vitest has built-in mocking via `vi` API
- Not heavily used in current test suite (mostly testing pure functions)

**Patterns from codebase:**
Tests avoid mocking where possible and test with real data:
```typescript
// Example: Testing with real data structures
const data: RawDataRow[] = [
  { name: 'A', value: 1 },
  { name: 'B', value: 2 },
  { name: 'C', value: 3 },
];

const filters: FilterRule[] = [
  { id: '1', column: 'name', operator: 'in', value: ['A', 'C'], enabled: true },
];

const result = applyFilters(data, filters);
expect(result).toHaveLength(2);
```

**What to Mock:**
- External API calls (when encountered)
- Time-dependent operations (use Vitest's fake timers)
- Date operations (if needed)

**What NOT to Mock:**
- Pure utility functions (pass real data structures)
- Type definitions and interfaces
- Constants and configurations

## Fixtures and Factories

**Test Data:**
Test data is created inline for clarity:

```typescript
// From filterData.test.ts
const data: RawDataRow[] = [
  { name: 'A', value: 1 },
  { name: 'B', value: 2 },
  { name: 'C', value: 3 },
  { name: 'D', value: 4 },
  { name: 'E', value: 5 },
];

// From capabilityStats.test.ts
const values = [8, 8, 8, 8];
const config: CapabilityConfig = { usl: 10, lsl: 6, target: 8, subgroupSize: 1 };
const result = calculateCapability(values, config, 0.5, 8);
```

**Factory Functions:**
No explicit factory functions found. Data is typically:
- Created inline with type safety
- Reused across multiple test cases
- Documented in variable names and types

**Location:**
- Data defined at describe-block scope (available to all tests)
- Test-specific data created inside individual `it()` blocks

## Coverage

**Requirements:**
- No explicit coverage target enforced (no `coverage: { lines: 80 }` in config)
- No coverage threshold in CI/CD visible
- Recommendation: Add coverage target via Vitest config extension

**View Coverage:**
```bash
npm test -- --coverage
```

This would output coverage report (lcov, html, text formats available).

## Test Types

**Unit Tests:**
- **Scope:** Individual utility functions
- **Approach:** Pure function testing with test data
- **Examples:** 
  - `src/test/filterData.test.ts` — tests `applyFilters()` with various operators
  - `src/test/capabilityStats.test.ts` — tests capability index calculations
  - `src/test/regression.test.ts` — tests linear regression computation

**Integration Tests:**
- **Scope:** Utility functions with dependencies
- **Approach:** Tests data flow through statistics pipeline
- **Examples:**
  - Hypothesis tests combine group separation and statistical testing
  - Capability tests integrate descriptive stats with spec limits
  - MSA tests combine variance components and gage evaluation

**Component Tests:**
- **Location:** `src/App.test.tsx`
- **Scope:** App component rendering
- **Approach:** Uses React Testing Library
- **Example:**
```typescript
describe('App', () => {
  it('renders the application title', () => {
    render(<App />);
    expect(screen.getByText('QualityBox 质量分析')).toBeDefined();
  });
});
```

**E2E Tests:**
- Not currently implemented
- Would require Playwright or Cypress setup

## Common Patterns

**Async Testing:**
Not prominent in current tests (all functions are synchronous). Pattern for async:
```typescript
it('should handle async operations', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

**Error Testing:**
Tests validate null/error cases explicitly:

```typescript
// From capabilityStats.test.ts
it('should return null values for insufficient data (n < 2)', () => {
  const values = [10];
  const config: CapabilityConfig = { usl: 12, lsl: 8, target: 10, subgroupSize: 1 };
  const result = calculateCapability(values, config, 1, 10);
  
  expect(result.cp).toBeNull();
  expect(result.cpk).toBeNull();
});

// From filterData.test.ts
it('rejects overly long regex patterns (ReDoS guard)', () => {
  const filters: FilterRule[] = [
    { id: '1', column: 'name', operator: 'regex', value: '(a+)+'.repeat(40), enabled: true },
  ];
  const result = applyFilters(data, filters);
  expect(result).toHaveLength(0);
});
```

**Boundary Testing:**
Tests explicitly check boundary conditions:

```typescript
// From regression.test.ts
it('should omit intercept in equation when intercept is exactly 0', () => {
  // y = 2x (no intercept)
  const data: RawDataRow[] = [
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 },
    { x: 4, y: 8 },
    { x: 5, y: 10 },
  ];
  
  const { result } = calculateRegression(data, 'x', 'y');
  expect(result).not.toBeNull();
  if (result) {
    expect(result.intercept).toBeCloseTo(0, 5);
    expect(result.equation).toBe('Y = 2.0000X');
  }
});
```

**Numeric Precision:**
Uses `toBeCloseTo()` for floating-point comparisons:

```typescript
// From capabilityStats.test.ts
expect(result.cp).toBeCloseTo(1.333, 2);  // 2 decimal places
expect(result.cpu).toBeCloseTo(0.667, 2);

// From regression.test.ts
expect(result.slope).toBeCloseTo(2, 5);     // 5 decimal places
expect(result.intercept).toBeCloseTo(1, 5);
```

**Type Safety in Tests:**
All test code is fully typed with TypeScript:

```typescript
// From hypothesisStats.test.ts
const data: RawDataRow[] = [
  { group: 'A', value: 10 },
  { group: 'A', value: 11 },
];
const result = calculateHypothesis(data, 'group', 'value');
```

## Test Coverage Gaps

**Components:**
- Only `App.tsx` has a basic render test
- No tests for analysis panels (MSAPanel, CapabilityPanel, etc.)
- No tests for chart components (BoxPlot, Histogram, ScatterPlot)
- No tests for layout components (Header, Sidebar, DataFilterPanel)
- No tests for UI components (Button, Card)

**Hooks:**
- No tests for `useAnalysis()` hook
- No tests for `useTranslation()` hook
- No tests for custom hooks with side effects

**Store:**
- No tests for `useDataStore` (Zustand store mutations)

**Integration:**
- No tests for data flow through multiple modules
- No tests for file parsing (fileParser.ts)
- No tests for date grouping (dateGrouping.ts)

**Missing Test Files:**
- `src/utils/fileParser.ts` — no test file
- `src/utils/dateGrouping.ts` — no test file
- `src/utils/descriptiveStats.ts` — test exists but incomplete
- `src/components/` — no component tests beyond App

## Test Execution

**Run All Tests:**
```bash
npm test
```

**Watch Mode (Auto-run):**
```bash
npm test -- --watch
```

**Run Specific Test File:**
```bash
npm test filterData.test.ts
```

**Run Tests Matching Pattern:**
```bash
npm test -- --grep "regex filter"
```

## Best Practices Observed

1. **Descriptive test names** — Each test clearly states what it validates
2. **Isolated test data** — Each test has its own data setup
3. **Type safety** — Full TypeScript in test code
4. **Error boundary testing** — Tests cover null/error cases
5. **Numeric precision awareness** — Uses `toBeCloseTo()` for floating-point math
6. **Security validation** — Tests for ReDoS protection in regex filtering
7. **Empty/null handling** — Tests verify graceful behavior with missing data

## Recommendations for Improvement

1. **Add component tests** — Use React Testing Library for UI components
2. **Test the store** — Add tests for `useDataStore` state mutations
3. **Test hooks** — Add tests for `useAnalysis()` and `useTranslation()`
4. **E2E tests** — Consider Playwright for critical user flows
5. **Coverage threshold** — Set target (e.g., 80%) in vitest config
6. **Test utilities** — Create test factory functions for complex data
7. **Mock external APIs** — If adding API integrations, establish mocking patterns

---

*Testing analysis: 2026-04-17*
