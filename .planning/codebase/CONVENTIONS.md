# Coding Conventions

**Analysis Date:** 2026-04-17

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `Button.tsx`, `ChartView.tsx`)
- Utilities: camelCase (e.g., `filterData.ts`, `stats.ts`, `groupBuilder.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useAnalysis.ts`, `useTranslation.ts`)
- Types: Single index file at `src/types/index.ts`
- Tests: Same name as source with `.test.ts` or `.test.tsx` suffix (e.g., `filterData.test.ts`)
- Locales: Language code prefix (e.g., `en.ts`, `zh.ts`)
- Internal derived columns: UPPER_SNAKE_CASE with `__` prefix (e.g., `__statviz_group__`, `__statviz_group_sort__`)

**Functions:**
- camelCase for all functions: `calculateBoxPlotStats()`, `applyFilters()`, `useAnalysis()`
- Utility functions often include operation as verb: `calculate*`, `apply*`, `compute*`, `extract*`, `parse*`
- React components exported as constants: `export const ChartView: React.FC<...>`

**Variables:**
- camelCase with descriptive names: `groupedData`, `activeDataset`, `capabilityConfig`, `lineWidth`
- Boolean variables use `is`, `has`, `should`, `can` prefixes: `isAcceptable`, `isBiasAcceptable`, `isDateLikeColumn`, `keepRow`
- Loop counters use `i`, `j`, but prefer descriptive names in new code
- State/store variables: camelCase (e.g., `activeDatasetId`, `capabilityStats`)

**Types:**
- Interface names: PascalCase (e.g., `BoxPlotStats`, `DimensionConfig`, `FilterRule`, `CapabilityResult`)
- Type aliases: PascalCase (e.g., `AnalysisModule`, `DateGroupingGranularity`, `FilterOperator`, `GroupTransform`)
- Export types from single location: `src/types/index.ts`
- Union types use string literals for clarity: `'in' | 'not_in' | 'range' | 'regex'`

**Constants:**
- UPPER_SNAKE_CASE: `DERIVED_GROUP_COLUMN`, `DERIVED_GROUP_SORT_COLUMN`
- Magic thresholds use named constants: `maxPatternLength = 200`, `1.5 * iqr` for outlier detection

## Code Style

**Formatting:**
- ESLint configured in `.eslintrc.cjs`
- Recommended: Use Prettier for auto-formatting (not explicitly configured in package.json, but add it for consistency)
- Trailing commas: Omit in multi-line structures where TypeScript allows
- Line length: Default soft limit ~100 chars, but no hard limit enforced

**Linting:**
- ESLint with TypeScript support (@typescript-eslint)
- Plugin: react-hooks for custom hook rules
- Plugin: react-refresh for component export validation
- No Prettier config found — consider adding `.prettierrc` for consistent formatting

**Key Settings in `tsconfig.json`:**
- Target: ES2020
- Strict mode: true (enforces strict type checking)
- noUnusedLocals: true
- noUnusedParameters: true
- noFallthroughCasesInSwitch: true

## Import Organization

**Order:**
1. React and framework imports (e.g., `import React`)
2. Third-party libraries (e.g., `import { create } from 'zustand'`)
3. D3 and data viz libraries (e.g., `import * as d3`)
4. Utility functions from sibling modules (e.g., `import { applyFilters }`)
5. Type definitions (e.g., `import { RawDataRow }`)
6. Local component or hook imports (e.g., `import { BoxPlot }`)
7. Hooks from project (e.g., `import { useTranslation }`)

**Example from `src/components/analysis/ChartView.tsx`:**
```typescript
import React, { RefObject } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { BoxPlot, StatsOverlayOptions } from '../charts/BoxPlot';
// ... other component imports
import { useTranslation } from '../../hooks/useTranslation';
import { BoxPlotStats, DimensionConfig, ... } from '../../types';
import { Dataset } from '../../store/useDataStore';
```

**Path Aliases:**
- No path aliases configured — all imports use relative paths (`../`, `../../`)

## Error Handling

**Patterns:**
- Try-catch for regex operations (malformed patterns return no results, not throws)
- Type narrowing with `instanceof Error` (e.g., in `useTranslation.ts`)
- Null coalescing and optional chaining: `value ?? null`, `obj?.property`
- Guard clauses for invalid states: check `filters.length === 0` before processing
- Silent failures for edge cases: regex parse error → `matched = false`, invalid regex → empty result set
- Validation with explicit bounds: e.g., `if (checked >= 20) break;` to cap iteration

**Example from `src/utils/filterData.ts`:**
```typescript
try {
  const maxPatternLength = 200;
  if (String(rule.value).length > maxPatternLength) {
    matched = false;
  } else {
    const regex = new RegExp(String(rule.value));
    matched = regex.test(valStr);
  }
} catch {
  matched = false;
}
```

## Logging

**Framework:** No custom logging library — uses `console` for debugging (none visible in production code)

**Patterns:**
- No console.log/warn/error statements present in reviewed source code
- Silent error handling preferred: return null or empty result on failure
- Data validation inline with results (e.g., metadata tracking valid/invalid counts)

## Comments

**When to Comment:**
- Explain WHY, not WHAT (code should be self-documenting)
- Used sparingly in this codebase; most logic is clear from naming
- JSDoc for public utility functions and complex functions

**JSDoc/TSDoc:**
- Used on some functions (e.g., `calculateBoxPlotStats()` has block comment explaining purpose)
- Format: `/**  * description ... */`
- Include parameter descriptions for complex functions
- Document return type and constraints

**Example from `src/utils/stats.ts`:**
```typescript
/**
 * Enhanced statistics calculation for quality engineering.
 * Handles data cleaning, outlier detection (IQR), and robust descriptive stats.
 */
export const calculateBoxPlotStats = (...)
```

**Example from `src/types/index.ts`:**
```typescript
/**
 * Configuration for data mapping to the box plot.
 * Supports multi-dimensional nested grouping on the X-axis.
 */
export interface DimensionConfig { ... }
```

## Function Design

**Size:**
- Preference for smaller functions (<80 lines typical)
- Complex functions broken into steps with clear intent
- Utilities organized by responsibility: `stats.ts` for box plot stats, `filterData.ts` for filtering

**Parameters:**
- Function params grouped by related concern
- Props objects destructured in component signatures
- Use type definitions for complex parameter shapes (e.g., `ChartViewProps interface`)

**Return Values:**
- Explicit return types on exported functions
- For utilities returning results + metadata: return objects with shape `{ stats: T[], metadata: {...} }`
- Hooks return objects/tuples: `useTranslation()` returns `{ t, language, setLanguage }`

**Example:**
```typescript
export const calculateBoxPlotStats = (
  data: RawDataRow[],
  xDimension: string,
  yDimension: string
): { stats: BoxPlotStats[]; metadata: { totalCount: number; validCount: number; invalidCount: number } }
```

## Module Design

**Exports:**
- Each file exports one main function or one default export (components)
- Type definitions centralized in `src/types/index.ts`
- No barrel files; imports are explicit with full paths

**Zustand Store Pattern:**
- Single `useDataStore` hook manages all application state
- Actions defined inline in store: `addDataset()`, `removeDataset()`, `setRawData()`, etc.
- Persistence handled with Zustand middleware (noted in CLAUDE.md but not visible in store file excerpt)

**Example store structure from `src/store/useDataStore.ts`:**
```typescript
interface DataState {
  datasets: Dataset[];
  activeDatasetId: string | null;
  language: 'en' | 'zh';
  
  // Actions
  addDataset: (name: string, data: RawDataRow[]) => void;
  removeDataset: (id: string) => void;
  // ... more actions
}

export const useDataStore = create<DataState>((set) => ({
  // initial state
  // action implementations
}));
```

## Immutability & Data Transformation

**Immutable Patterns:**
- Use spread operator for object updates: `{ ...row }`, `{ ...state.datasets, ... }`
- Avoid array mutation: use `filter()`, `map()` rather than `push()` or `splice()`
- Zustand store updates use immutable pattern: `set((state) => ({ ...state, ... }))`

**Example from `src/utils/filterData.ts`:**
```typescript
return data.map(row => {
  // Create a new row to avoid mutating the original data
  const newRow = { ...row };
  // ... modifications to newRow
  return keepRow ? newRow : null;
}).filter(Boolean) as RawDataRow[];
```

## TypeScript-Specific

**Types vs Interfaces:**
- `interface` for object shapes that represent domain models: `DimensionConfig`, `Dataset`, `CapabilityResult`
- `type` for unions and utility types: `AnalysisModule = 'basic' | 'capability' | ...`
- Generic types for reusable patterns: `useState<T>`, `useMemo<T>`

**React Component Typing:**
- Define props interface explicitly: `interface ChartViewProps { ... }`
- Use `React.FC<Props>` for function components
- Props destructured in parameter list with explicit types
- Children typed as `React.ReactNode`

**Avoid any:**
- No `any` observed in codebase
- Use `unknown` with type narrowing for external/untrusted input
- Type safe even for locale lookups: `DotPaths<T>` utility type

## Code Quality Checklist

Before marking work complete:
- [ ] Function names are verb-action descriptive (e.g., `calculateCapability`, `applyFilters`)
- [ ] TypeScript strict mode compliant (no implicit any)
- [ ] Immutable updates used throughout
- [ ] Error cases handled (null checks, bounds validation)
- [ ] No console.log in production code
- [ ] Complex logic documented with JSDoc comments
- [ ] Files stay under 500 lines (most utilities are 200-400)
- [ ] Related functionality grouped in same module (e.g., all MSA stats in `msaStats.ts`)

---

*Convention analysis: 2026-04-17*
