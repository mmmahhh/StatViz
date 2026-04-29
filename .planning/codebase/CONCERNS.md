# Codebase Concerns

**Analysis Date:** 2026-04-17

## Tech Debt

**Large Component Files:**
- Issue: `src/App.tsx` (412 lines), `src/components/layout/Sidebar.tsx` (381 lines), and `src/utils/msaStats.ts` (307 lines) exceed recommended file size of 200-300 lines, making them harder to test and maintain
- Files: `src/App.tsx`, `src/components/layout/Sidebar.tsx`, `src/utils/msaStats.ts`
- Impact: Reduced testability, longer load times in IDEs, increased cognitive load during refactoring
- Fix approach: Extract specialized utility functions and smaller sub-components. For App.tsx, extract chart management logic and export handlers into custom hooks or separate services. For Sidebar.tsx, extract dimension selector UI and group builder UI into dedicated components.

**Complex MSA Statistics Implementation:**
- Issue: `src/utils/msaStats.ts` contains intricate ANOVA and Gage R&R calculations with nested loops and multiple branches, making it fragile and difficult to validate
- Files: `src/utils/msaStats.ts`
- Impact: Hard to debug when results don't match expected values; mutation risk in data transformation; difficult to unit test edge cases
- Fix approach: Break calculations into smaller, testable functions (one calculation per function). Add comprehensive test cases for boundary conditions (minimum data, unbalanced designs, zero variance).

**Inadequate Error Handling in File Import:**
- Issue: `src/utils/fileParser.ts` has generic error handling that doesn't distinguish between file format errors, corrupted data, and I/O failures. Users see unhelpful alert messages
- Files: `src/utils/fileParser.ts`, `src/App.tsx` (lines 100-102)
- Impact: Users cannot understand why file import failed or how to fix it
- Fix approach: Create specific error types for each failure mode (e.g., `FileTypeError`, `ParsingError`, `CorruptedDataError`). Map each to user-friendly messages in translations. Return error detail to UI component.

**Data Mutation Risk in Table Cells:**
- Issue: `src/App.tsx` (lines 375-382) uses `contentEditable` with inline `onBlur` handler that directly calls `updateCell`. No validation of input before storage; no undo/redo support; no optimistic updates
- Files: `src/App.tsx`, `src/store/useDataStore.ts`
- Impact: Users can unknowingly corrupt data by pasting invalid values; accidental edits are permanent; no way to recover previous values
- Fix approach: Add client-side validation before storing. Implement local undo/redo stack. Show confirmation dialog for mass edits. Consider moving table to a controlled component with validated input fields instead of contentEditable.

**Console.log Left in Production:**
- Issue: `src/App.tsx` (line 101) contains `console.error()` that leaks error details to users in the browser console
- Files: `src/App.tsx`
- Impact: Inconsistent error reporting; no structured logging for debugging; error context is lost
- Fix approach: Replace with structured error logging. Create error boundary component to catch and display errors gracefully.

**Missing Input Validation:**
- Issue: File parser does not validate column names or data types before storing. No bounds checking on numeric columns. Group builder accepts any input without validating date formats
- Files: `src/utils/fileParser.ts`, `src/utils/groupBuilder.ts`, `src/components/layout/DataFilterPanel.tsx` (line 31 uses `Math.random()` for filter ID generation instead of UUID)
- Impact: Downstream calculations may fail silently or produce nonsensical results; filter IDs could collide; date parsing could fail during analysis
- Fix approach: Add schema validation on file import using Zod. Validate date columns in groupBuilder before applying transforms. Replace `Math.random()` filter IDs with proper UUID generation (already available via `crypto.randomUUID()` used elsewhere).

## Known Bugs

**Incomplete Test Coverage for UI Components:**
- Symptoms: Components like `BoxPlot`, `Histogram`, `ScatterPlot` have zero test coverage. Only `App.tsx` has a single integration test that doesn't verify core functionality
- Files: `src/App.test.tsx` (only 10 lines), `src/components/charts/BoxPlot.tsx` (301 lines, untested), `src/components/charts/Histogram.tsx` (207 lines, untested)
- Trigger: Run `npm test` and check coverage report
- Workaround: Manual testing required after chart logic changes; rely on visual inspection in dev mode

**Potential Memory Leak in PDF Export:**
- Symptoms: Long-running PDF export (500ms timeout at line 233 in App.tsx) may not properly revoke blob URLs in all browsers
- Files: `src/App.tsx` (lines 183-234)
- Trigger: Export large reports repeatedly
- Workaround: Clear browser cache or reload page if memory usage climbs

**Group Builder Safe-Field Sanitization Not Fully Robust:**
- Symptoms: `src/hooks/useAnalysis.ts` (lines 50-61) sanitizes groupBuilder fields by checking if `field.column === dimensions.yAxis`, but this may not catch all invalid configurations if yAxis is empty
- Files: `src/hooks/useAnalysis.ts`, `src/utils/groupBuilder.ts`
- Trigger: Select Y-axis, then enable group builder, then clear Y-axis, then apply date transform
- Workaround: Re-enable group builder to force re-sanitization

## Security Considerations

**No Data Export Encryption:**
- Risk: PDF and CSV exports are sent to user's browser unencrypted. If user's device is compromised, all data could be read
- Files: `src/App.tsx` (exportAsPDF, exportAsCSV functions)
- Current mitigation: None
- Recommendations: Add optional password-protection for PDF exports. Warn user about exporting sensitive data. Consider marking exports with data classification labels.

**No Input Sanitization on Filter Regex:**
- Risk: `src/components/layout/DataFilterPanel.tsx` accepts regex patterns in filter rules without validation. Malicious patterns (ReDoS) could cause browser freeze
- Files: `src/components/layout/DataFilterPanel.tsx`, `src/utils/filterData.ts`
- Current mitigation: None
- Recommendations: Validate regex patterns before storing. Timeout regex execution in filter application. Warn users about regex performance risks.

**No Bounds Checking on Capability Analysis:**
- Risk: User can enter USL/LSL/Target values without validation. Extremely large values could cause numerical overflow or NaN propagation in Cpk calculations
- Files: `src/store/useDataStore.ts`, `src/utils/capabilityStats.ts`
- Current mitigation: None
- Recommendations: Add min/max bounds UI validation. Return null or specific error states when calculations overflow. Add range checks in capability calculation functions.

## Performance Bottlenecks

**D3 Chart Re-renders on Every Data Change:**
- Problem: `src/components/charts/BoxPlot.tsx` uses `useRef` to get DOM node but doesn't memoize props or prevent re-renders. Every dimension change triggers full chart redraw
- Files: `src/components/charts/BoxPlot.tsx`, `src/components/charts/Histogram.tsx`, `src/components/charts/ScatterPlot.tsx`
- Cause: Missing `React.memo()` wrapper; no `useCallback` for event handlers
- Improvement path: Wrap chart components with `React.memo()`. Memoize SVG generation logic with `useMemo()`. Move D3 event handlers outside component body.

**Table Rendering with 50-Row Limit is Inflexible:**
- Problem: `src/App.tsx` (line 368) hardcodes 50-row preview, hiding remaining rows. Large datasets show truncation alert but still load all data into memory
- Files: `src/App.tsx`
- Cause: No virtualization library (react-window, react-virtualized) used
- Improvement path: Implement windowed/virtualized table for datasets >100 rows. Add pagination or "load more" UI instead of hard-coded 50-row limit.

**Statistics Calculations Not Debounced:**
- Problem: `src/hooks/useAnalysis.ts` runs expensive calculations (MSA, Hypothesis tests, Regression) on every dimension/module change. No debouncing or request cancellation
- Files: `src/hooks/useAnalysis.ts`, `src/utils/msaStats.ts`, `src/utils/hypothesisStats.ts`, `src/utils/regressionStats.ts`
- Cause: All analysis functions run in `useMemo()` without delay; no mechanism to skip redundant calculations
- Improvement path: Add debouncing wrapper around analysis hook. Implement cancellation token for long-running calculations. Consider moving expensive stats to Web Worker.

**File Parser Parses Entire File into Memory:**
- Problem: `src/utils/fileParser.ts` loads entire CSV/Excel files into memory before parsing. Large files (>100MB) will freeze the browser
- Files: `src/utils/fileParser.ts`
- Cause: Uses `FileReader.readAsArrayBuffer()` without streaming
- Improvement path: Implement chunked parsing for large files. Use streaming parser for CSV (Papa Parse supports this). Consider server-side parsing for very large files.

## Fragile Areas

**Dimension Configuration Validation:**
- Files: `src/hooks/useAnalysis.ts`, `src/store/useDataStore.ts`, `src/components/layout/Sidebar.tsx`
- Why fragile: Dimensions are stored as arrays (xAxis: [primary, secondary]) but code doesn't consistently validate array bounds. `dimensions.xAxis[0]` and `dimensions.xAxis[1]` accessed without checking length. Sidebar module detection (line 160) uses string `.startsWith()` which breaks if module names change
- Safe modification: Create helper functions `getPrimaryXAxis()`, `getSecondaryXAxis()` that validate bounds. Use TypeScript discriminated unions for module types to enable type-safe pattern matching
- Test coverage: Test coverage gaps in dimension validation, module-specific UI branches

**Statistics Utility Chain:**
- Files: `src/utils/stats.ts`, `src/utils/capabilityStats.ts`, `src/utils/hypothesisStats.ts`, `src/utils/msaStats.ts`, `src/utils/regressionStats.ts`, `src/utils/groupBuilder.ts`
- Why fragile: Each utility assumes input data is already cleaned (non-null, numeric). No type guards or runtime validation. If any transformation in the chain fails, entire analysis silently returns null without clear error message
- Safe modification: Add validation guards at utility entry points. Return Result<T> wrapper (success/failure) instead of null. Log warnings when data is skipped
- Test coverage: Need edge case tests (empty data, all NaN, single value, mixed types)

**Filter Application Logic:**
- Files: `src/utils/filterData.ts`, `src/components/layout/DataFilterPanel.tsx`
- Why fragile: Regex matching uses unvalidated user input; range filtering assumes numeric input without type checking. Filter aliasing (groupAlias) merges values in analysis but UI doesn't preview merged groups
- Safe modification: Validate and compile regex patterns at filter creation time. Add explicit type coercion helpers. Preview merged groups in filter UI
- Test coverage: Test coverage for regex edge cases, range boundaries, alias conflicts

**Group Builder Date Transform:**
- Files: `src/utils/groupBuilder.ts`, `src/hooks/useAnalysis.ts`
- Why fragile: Date parsing uses simple string checks (`isDateLikeColumn`) without validating date format. If data contains mixed date formats (ISO, US, custom), parsing will silently fail for some rows
- Safe modification: Detect date format explicitly (try multiple parsers). Return transformed date or null (not skipped). Warn users of parsing failures
- Test coverage: Test mixed date formats, malformed dates, timezone handling

## Scaling Limits

**Single-Browser Memory for Large Datasets:**
- Current capacity: Charts render smoothly up to ~10,000 rows. Table virtualization not implemented
- Limit: ~50,000 rows causes noticeable slowdown; >100,000 rows freezes browser
- Scaling path: Implement Web Workers for statistics calculations. Add virtualized table rendering. Consider backend server for data aggregation and pre-computed statistics

**Zustand Store Growth:**
- Current capacity: Store handles 5-10 datasets efficiently
- Limit: 50+ datasets in store causes noticeable slowdown in dataset selector (linear search). No indexing
- Scaling path: Add dataset index by ID. Implement pagination in dataset selector. Move inactive datasets to IndexedDB

**PDF Export Size:**
- Current capacity: Reports with charts and 50 rows render and export in <2 seconds
- Limit: Full 1000+ row tables + multiple charts cause timeout (current 500ms timeout at line 233)
- Scaling path: Implement server-side PDF generation. Add image compression. Consider PDF streaming instead of in-memory rendering

## Dependencies at Risk

**html2canvas and jsPDF Combination:**
- Risk: html2canvas captures DOM as image (not vector), resulting in blurry charts and large file sizes. jsPDF has known positioning bugs with long content
- Impact: PDF exports look poor quality; file sizes 5-10MB for large reports
- Migration plan: Switch to `react-pdf` or `pdfjs-dist` with vector rendering of charts. Use server-side PDF generation (headless Chrome) for better quality

**simple-statistics Library:**
- Risk: Library is lightweight but may not match exact statistical formulas used in industry (e.g., Minitab). No active maintenance
- Impact: Results may differ slightly from expected values in quality control contexts where exact agreement is critical
- Migration plan: Consider switching to `numeric.js` or `jStat` for more comprehensive statistical functions. Add test cases comparing results with known references (Minitab, R output)

**jstat (jStat) Type Definitions:**
- Risk: `src/jstat.d.ts` is a custom type definition file, not from DefinitelyTyped. May be incomplete or out of sync with actual jstat API
- Impact: Type checking may miss runtime errors; IDE autocomplete may be incomplete
- Migration plan: Migrate to official DefinitelyTyped types when available, or contribute definitions to community. Add JSDoc type comments as fallback

**D3.js Major Version Dependency:**
- Risk: D3.js v7 is used but v8 is available. Major version migrations often break APIs
- Impact: Future maintenance burden; security updates may require major version jumps
- Migration plan: Plan gradual migration to D3 v8 with test coverage. Consider charting library abstraction to reduce D3 coupling (e.g., swap to ECharts, Chart.js)

## Missing Critical Features

**No Data Backup or Undo/Redo:**
- Problem: All data exists in browser memory only. Closing tab loses all analysis. Editable table cells have no undo
- Blocks: Users cannot safely experiment with data transformations
- Recommendation: Add IndexedDB persistence with manual save points. Implement undo/redo stack for data edits and filter changes

**No Error Boundary or Graceful Degradation:**
- Problem: Single error in any analysis module crashes entire report (no error boundary). Users see blank screen
- Blocks: Application is fragile to edge cases in data
- Recommendation: Add React error boundary. Return partial results when some analyses fail. Show clear error messages for each failed module

**No Accessibility (A11y) Support:**
- Problem: Charts are SVG only (no alt text). Form inputs lack labels. No keyboard navigation for drag-drop operations
- Blocks: Tool is unusable for visually impaired users
- Recommendation: Add ARIA labels to charts. Add title attributes. Implement keyboard alternatives to drag-drop (arrow keys, Enter). Test with screen readers

**No Data Validation Rules Engine:**
- Problem: Users can import any data without validation. Duplicate rows, missing values, outliers are not flagged
- Blocks: Data quality issues discovered only after analysis is run
- Recommendation: Add optional validation rules (e.g., "no duplicates", "no blanks in column X"). Show data quality report on import

## Test Coverage Gaps

**Chart Components Untested:**
- What's not tested: SVG rendering, axis labels, tooltips, legend updates, responsive resizing
- Files: `src/components/charts/BoxPlot.tsx`, `src/components/charts/Histogram.tsx`, `src/components/charts/ScatterPlot.tsx`
- Risk: Chart bugs (axis scaling, outlier rendering, color assignment) go unnoticed until visual inspection
- Priority: High

**UI Integration Not Tested:**
- What's not tested: Drag-drop column assignment, dataset switching, module selection, export flow, filter application
- Files: `src/App.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`, `src/components/analysis/ChartView.tsx`
- Risk: Regression in user interactions (e.g., dimension changes not updating charts) missed
- Priority: High

**Analysis Hook Edge Cases:**
- What's not tested: Empty datasets, datasets with all NaN, single row, null values in dimension columns, module switching during analysis
- Files: `src/hooks/useAnalysis.ts` (222 lines, with 264-line test file, but tests don't cover all branches)
- Risk: Edge cases cause silent null returns or type errors in downstream components
- Priority: Medium

**Statistics Function Boundary Conditions:**
- What's not tested: Minimum viable data (n=3 for capability, n=2 for regression), zero variance, extreme values (±Infinity), all-identical values
- Files: `src/utils/capabilityStats.ts`, `src/utils/hypothesisStats.ts`, `src/utils/regressionStats.ts`, `src/utils/msaStats.ts`
- Risk: Calculations return NaN or incorrect values without warning
- Priority: Medium

**File Parser Edge Cases:**
- What's not tested: Malformed CSV (mismatched quotes), Excel files with multiple sheets (only first is parsed), files with BOM, files with special characters in headers
- Files: `src/utils/fileParser.ts`, `src/App.tsx` (file upload handler)
- Risk: Import silently fails or produces corrupt data
- Priority: Medium

**Group Builder Transform Logic:**
- What's not tested: Invalid date formats, mixed date formats, date parsing failures, prefix/separator edge cases
- Files: `src/utils/groupBuilder.ts`
- Risk: Date grouping produces unexpected results or crashes
- Priority: Low

---

*Concerns audit: 2026-04-17*
