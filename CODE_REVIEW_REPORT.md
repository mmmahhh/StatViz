# StatViz Code Review Report

**Review Date**: 2026-04-20  
**Reviewer**: Claude (OpenCode)  
**Project**: StatViz - Statistical Visualization Tool  
**Version**: 0.1.0  
**Codebase Size**: ~6,469 lines across 57 TypeScript files

---

## Executive Summary

StatViz is a well-architected React + TypeScript statistical analysis tool with solid foundations. The codebase demonstrates good TypeScript practices, clean separation of concerns, and comprehensive statistical functionality. However, there are notable areas for improvement in performance optimization, error handling, and security hardening.

**Overall Score: 7.2/10**

### Score Breakdown

| Dimension | Score | Weight | Weighted Score |
|-----------|-------|--------|----------------|
| Code Quality | 8.0 | 30% | 2.40 |
| Architecture | 7.5 | 25% | 1.88 |
| Reliability | 7.0 | 25% | 1.75 |
| Performance | 6.0 | 10% | 0.60 |
| Security | 5.5 | 10% | 0.55 |
| **Total** | | | **7.18** |

---

## Detailed Analysis

### 1. Code Quality: 8.0/10 ⭐⭐⭐⭐

**Strengths:**
- ✅ **Excellent TypeScript usage**: Comprehensive type definitions in `types/index.ts` (198 lines)
- ✅ **ESLint compliance**: 0 warnings, clean linting
- ✅ **Consistent naming conventions**: Clear, descriptive names throughout
- ✅ **Good modularity**: Well-organized utility functions (12 specialized stat modules)
- ✅ **React best practices**: Functional components, hooks, proper memoization

**Weaknesses:**
- ⚠️ **Large component files**: 
  - `Sidebar.tsx` (406 lines) - should be split into smaller components
  - `App.tsx` (351 lines) - extract chart management and export logic
  - `msaStats.ts` (307 lines) - break down complex ANOVA calculations
- ⚠️ **Console statements in production**: 3 instances found
  - `App.tsx:100` - `console.error("Error parsing file:", error)`
  - `pdfGenerator.ts:53` - `console.error('PDF generation failed:', error)`
  - `useBasicAnalysis.ts` - Worker error logging
- ⚠️ **Limited code comments**: Complex statistical formulas lack explanatory comments

**Recommendations:**
1. Extract `Sidebar.tsx` into sub-components: `DimensionSelector`, `GroupBuilder`, `FilterPanel`
2. Move export handlers from `App.tsx` to custom hook `useExport()`
3. Replace console.error with structured error logging service
4. Add JSDoc comments to statistical calculation functions

---

### 2. Architecture: 7.5/10 ⭐⭐⭐⭐

**Strengths:**
- ✅ **Clean layered architecture**: Presentation → Hooks → State → Utilities
- ✅ **Zustand state management**: Well-structured with immer middleware
- ✅ **Domain-driven design**: Clear separation of analysis modules
- ✅ **Type-safe data flow**: Strong typing throughout the pipeline
- ✅ **Good hook composition**: `useAnalysis` encapsulates complex logic

**Weaknesses:**
- ⚠️ **Tight coupling to D3.js**: Chart components directly depend on D3 APIs
- ⚠️ **No error boundaries**: Single error crashes entire app
- ⚠️ **Limited abstraction**: No repository pattern for data access
- ⚠️ **Monolithic App.tsx**: Handles too many responsibilities

**Recommendations:**
1. Add React Error Boundary component to catch and display errors gracefully
2. Create chart abstraction layer to decouple from D3 (easier to swap libraries)
3. Extract data management into repository pattern
4. Split App.tsx into: `AppLayout`, `ChartContainer`, `DataTableContainer`

---

### 3. Reliability: 7.0/10 ⭐⭐⭐

**Strengths:**
- ✅ **Defensive data validation**: Numeric conversion with NaN/Infinity checks
- ✅ **Null safety**: Proper optional chaining throughout
- ✅ **Test coverage exists**: 12 test files present
- ✅ **Graceful degradation**: Returns null for invalid calculations

**Weaknesses:**
- ⚠️ **Inadequate error handling in file parser**:
  ```typescript
  // fileParser.ts - Generic error handling
  } catch (error) {
    reject(error); // No error type discrimination
  }
  ```
- ⚠️ **No input validation on file import**: Accepts any CSV/Excel without schema validation
- ⚠️ **Data mutation risk**: `contentEditable` cells update store directly without validation
  ```typescript
  // VirtualTable.tsx:80-84
  onBlur={(e) => {
    const newValue = e.currentTarget.textContent || '';
    const numValue = parseFloat(newValue);
    onUpdateCell(datasetId, index, col, isNaN(numValue) ? newValue : numValue);
  }}
  ```
- ⚠️ **No undo/redo**: Edits are permanent, no recovery mechanism
- ⚠️ **Test coverage gaps**: Chart components (BoxPlot, Histogram) have zero tests

**Recommendations:**
1. Create specific error types: `FileTypeError`, `ParsingError`, `CorruptedDataError`
2. Add Zod schema validation on file import
3. Implement validation before storing cell edits (min/max bounds, type checking)
4. Add undo/redo stack for data edits using Zustand middleware
5. Implement comprehensive chart component tests with React Testing Library

---

### 4. Performance: 6.0/10 ⭐⭐⭐

**Strengths:**
- ✅ **useMemo optimization**: Analysis hook properly memoizes calculations
- ✅ **Virtualized table**: Uses `react-window` for large datasets
- ✅ **Zustand selectors**: Granular store subscriptions prevent unnecessary re-renders

**Weaknesses:**
- ⚠️ **D3 charts re-render on every change**: No React.memo() wrapper
  ```typescript
  // BoxPlot.tsx - Missing memoization
  export const BoxPlot: React.FC<BoxPlotProps> = ({ data, ... }) => {
    // Full re-render on any prop change
  }
  ```
- ⚠️ **No debouncing**: Statistics recalculate immediately on dimension changes
- ⚠️ **File parser loads entire file**: No streaming for large files (>100MB)
- ⚠️ **Export truncation**: VirtualTable limits PDF export to 500 rows
- ⚠️ **No Web Workers**: Heavy calculations block main thread

**Recommendations:**
1. Wrap chart components with `React.memo()` and memoize props
2. Add debouncing (300ms) to analysis calculations
3. Implement streaming CSV parser for files >10MB
4. Move MSA/hypothesis calculations to Web Worker
5. Add progress indicator for long-running operations

---

### 5. Security: 5.5/10 ⚠️⚠️

**Strengths:**
- ✅ **No backend**: Client-only app reduces attack surface
- ✅ **No authentication**: Appropriate for local analysis tool
- ✅ **Type safety**: TypeScript prevents many injection risks

**Weaknesses:**
- 🔴 **ReDoS vulnerability**: Filter regex accepts unvalidated user input
  ```typescript
  // filterData.ts - No regex validation
  case 'regex':
    return new RegExp(filter.value as string).test(String(cellValue));
  ```
- 🔴 **No bounds checking**: Capability analysis accepts extreme USL/LSL values
- 🔴 **No data export encryption**: PDF/CSV exports are unencrypted
- ⚠️ **Dependency vulnerabilities**: Multiple outdated packages
  - React 18.3.1 → 19.2.5 (major version behind)
  - Vite 5.4.21 → 8.0.9 (major version behind)
  - ESLint 8.57.1 → 10.2.1 (major version behind)

**Recommendations:**
1. **CRITICAL**: Validate regex patterns before execution
   ```typescript
   const MAX_REGEX_LENGTH = 200;
   const TIMEOUT_MS = 100;
   
   function safeRegex(pattern: string): RegExp | null {
     if (pattern.length > MAX_REGEX_LENGTH) return null;
     try {
       return new RegExp(pattern);
     } catch {
       return null;
     }
   }
   ```
2. Add min/max bounds validation for capability config (USL/LSL)
3. Add optional password protection for PDF exports
4. Update dependencies (especially React 19, Vite 8, ESLint 10)
5. Run `npm audit` and fix vulnerabilities

---

## Critical Issues (Must Fix)

### 🔴 High Severity

1. **ReDoS Vulnerability in Filter Regex** (Security)
   - **File**: `src/utils/filterData.ts`
   - **Issue**: Unvalidated regex patterns can cause browser freeze
   - **Fix**: Add regex validation and timeout mechanism
   - **Priority**: CRITICAL

2. **Memory Leak in PDF Export** (Reliability)
   - **File**: `src/App.tsx:183-206`
   - **Issue**: Blob URLs not properly revoked; 500ms timeout may be insufficient
   - **Fix**: Ensure URL.revokeObjectURL() is called in all code paths
   - **Priority**: HIGH

3. **No Error Boundary** (Reliability)
   - **File**: `src/App.tsx`
   - **Issue**: Single error crashes entire application
   - **Fix**: Wrap app in React Error Boundary component
   - **Priority**: HIGH

### ⚠️ Medium Severity

4. **Data Mutation Without Validation** (Reliability)
   - **File**: `src/components/ui/VirtualTable.tsx:78-84`
   - **Issue**: contentEditable cells update store without validation
   - **Fix**: Add validation layer before updateCell()
   - **Priority**: MEDIUM

5. **Chart Re-render Performance** (Performance)
   - **File**: `src/components/charts/BoxPlot.tsx`, `Histogram.tsx`
   - **Issue**: Full D3 re-render on every prop change
   - **Fix**: Wrap with React.memo() and memoize SVG generation
   - **Priority**: MEDIUM

6. **Outdated Dependencies** (Security)
   - **File**: `package.json`
   - **Issue**: React 18 (current: 19), Vite 5 (current: 8), ESLint 8 (current: 10)
   - **Fix**: Plan gradual migration to latest versions
   - **Priority**: MEDIUM

---

## Recommendations by Priority

### High Priority (Next Sprint)

1. **Add Error Boundary Component**
   ```typescript
   // src/components/ErrorBoundary.tsx
   class ErrorBoundary extends React.Component {
     // Catch errors and show fallback UI
   }
   ```

2. **Implement Regex Validation**
   - Add pattern length limit (200 chars)
   - Add timeout mechanism (100ms)
   - Show warning for complex patterns

3. **Fix PDF Export Memory Leak**
   - Ensure URL.revokeObjectURL() in finally block
   - Increase timeout to 1000ms for large reports
   - Add progress indicator

4. **Add Input Validation Layer**
   - Validate cell edits before storing
   - Add Zod schema for file import
   - Bounds checking for capability config

### Medium Priority (Next Month)

5. **Optimize Chart Performance**
   - Wrap charts with React.memo()
   - Debounce analysis calculations (300ms)
   - Memoize D3 scale functions

6. **Refactor Large Components**
   - Split Sidebar.tsx (406 lines) into sub-components
   - Extract export logic from App.tsx to useExport() hook
   - Break down msaStats.ts (307 lines)

7. **Improve Test Coverage**
   - Add tests for BoxPlot, Histogram, ScatterPlot
   - Test edge cases (empty data, all NaN, single value)
   - Integration tests for drag-drop workflow

8. **Update Dependencies**
   - Plan React 19 migration (breaking changes)
   - Update Vite to v8
   - Update ESLint to v10

### Low Priority (Backlog)

9. **Add Accessibility Support**
   - ARIA labels for charts
   - Keyboard navigation for drag-drop
   - Screen reader support

10. **Implement Undo/Redo**
    - Add history stack for data edits
    - Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
    - Visual undo/redo buttons

11. **Add Data Persistence**
    - IndexedDB for auto-save
    - Manual save points
    - Session recovery

---

## Strengths to Maintain

1. **Excellent TypeScript Usage**: Comprehensive type definitions, strong typing throughout
2. **Clean Architecture**: Well-organized layers, clear separation of concerns
3. **Good State Management**: Zustand with immer middleware works well
4. **Modular Utilities**: 12 specialized statistical modules, easy to test and maintain
5. **Professional UI**: Tailwind CSS + Lucide icons, consistent design system
6. **Comprehensive Statistics**: Covers basic, capability, regression, hypothesis, MSA modules

---

## Conclusion

StatViz is a **solid, production-ready statistical analysis tool** with a strong foundation. The codebase demonstrates good engineering practices, clean architecture, and comprehensive functionality. 

**Key Takeaways:**
- ✅ Code quality and architecture are strong (7.5-8.0/10)
- ⚠️ Performance and security need attention (5.5-6.0/10)
- 🔴 Critical security issue (ReDoS) must be fixed before production use
- 📈 With recommended improvements, this could easily reach 8.5-9.0/10

**Recommended Next Steps:**
1. Fix critical ReDoS vulnerability (1-2 days)
2. Add error boundary (1 day)
3. Optimize chart performance (2-3 days)
4. Plan dependency updates (1 week)

---

**Report Generated**: 2026-04-20  
**Review Methodology**: Manual code inspection + automated analysis + CONCERNS.md validation  
**Tools Used**: ESLint, npm outdated, grep, manual file review
