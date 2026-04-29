# Architecture

**Analysis Date:** 2026-04-17

## Pattern Overview

**Overall:** Monolithic Single-Page Application (SPA) with domain-driven analysis modules

**Key Characteristics:**
- React 18 functional components with hooks
- Zustand for centralized state management (per-dataset)
- D3.js for custom statistical visualizations
- Multi-module architecture: basic stats → advanced statistical analyses (capability, regression, hypothesis, MSA, etc.)
- Drag-and-drop column mapping for dimension selection
- File parsing and in-memory data processing (no backend)

## Layers

**Presentation (UI Components):**
- Purpose: Render interactive UI, handle user input, display charts and reports
- Location: `src/components/`
- Contains: React functional components using Tailwind CSS + Lucide icons
- Depends on: Custom hooks, store selectors, utility functions
- Used by: App.tsx (main entry point)

**Custom Hooks Layer:**
- Purpose: Encapsulate analysis logic and side effects
- Location: `src/hooks/`
- Contains: `useAnalysis` (compute stats), `useTranslation` (i18n), `useStyleStore` (visual state)
- Depends on: Store, utilities, types
- Used by: UI components

**State Management (Zustand):**
- Purpose: Centralized dataset and application state
- Location: `src/store/`
- Contains: `useDataStore` (datasets, dimensions, modules, filters, grouping), `useStyleStore` (theme/UI state)
- Depends on: Types
- Used by: Hooks, components, utilities

**Statistical Computation Utilities:**
- Purpose: Calculate analysis results (box plots, capability indices, hypothesis tests, MSA, etc.)
- Location: `src/utils/`
- Contains: Specialized stat modules (`capabilityStats.ts`, `msaStats.ts`, `hypothesisStats.ts`, etc.)
- Depends on: D3.js, jstat, simple-statistics libraries, types
- Used by: `useAnalysis` hook

**Data Pipeline Utilities:**
- Purpose: Parse files, filter, group, and transform raw data
- Location: `src/utils/`
- Contains: `fileParser.ts`, `filterData.ts`, `groupBuilder.ts`, `dateGrouping.ts`
- Depends on: PapaParse (CSV), XLSX (Excel), types
- Used by: App.tsx (file import), useAnalysis hook

**Type System:**
- Purpose: Define domain models and interfaces
- Location: `src/types/index.ts`
- Contains: Dataset, RawDataRow, DimensionConfig, statistical result interfaces (BoxPlotStats, CapabilityResult, etc.)
- Depends on: Nothing
- Used by: All layers

**Localization:**
- Purpose: Multilingual UI support (ZH/EN)
- Location: `src/locales/`
- Contains: Translation objects keyed by nested paths (e.g., `app.title`, `charts.compareWith`)
- Depends on: Nothing
- Used by: `useTranslation` hook

## Data Flow

**File Import → Analysis → Report:**

1. User uploads CSV/Excel file via `App.tsx`
2. `fileParser.ts` parses file → `RawDataRow[]`
3. `useDataStore.addDataset()` creates dataset with ID, stores raw data
4. User drags columns to X/Y axes (drag-and-drop) → updates `dimensions` in store
5. User selects analysis module → updates `module` in store (basic, capability, regression, etc.)
6. User clicks "Run Analysis" → triggers `showPlot = true` in App state
7. `useAnalysis` hook memoizes and computes:
   - Apply filters: `applyFilters(rawData, filters)`
   - Apply grouping: `applyGroupBuilder(filteredData, groupBuilderConfig)` (if enabled)
   - Call module-specific calculator: `calculateBoxPlotStats()`, `calculateCapability()`, etc.
8. Components render results:
   - `ChartView` renders chart (BoxPlot, Histogram, ScatterPlot)
   - `ReportSummaryPanel` renders detailed stats tables and interpretations
   - Data table shows raw data (editable, first 50 rows visible)
9. Export options: PNG, CSV, PDF (HTML2Canvas + jsPDF)

**State Management Flow:**

```
User Action (drag column, select module, upload file)
    ↓
useDataStore.setDimensions(), setModule(), addDataset()
    ↓
useAnalysis hook re-computes memoized values
    ↓
Components re-render with new props
```

**Dataset Isolation:**

- Each dataset has independent configuration (dimensions, module, filters, groupBuilder)
- Active dataset selected via `activeDatasetId` in store
- Multiple datasets can coexist; user can compare via "compareDatasetId" selector (basic module only)

## Key Abstractions

**Dataset Entity:**
- Purpose: Encapsulates raw data + configuration
- Examples: `src/store/useDataStore.ts` (Dataset interface), `src/App.tsx` (usage)
- Pattern: Immutable updates via spread operator; Zustand ensures state consistency

**Analysis Module:**
- Purpose: Represents analysis type (basic, capability, regression, etc.)
- Examples: `src/types/index.ts` (AnalysisModule union type)
- Pattern: Discriminated union; each module has specific input requirements and output types

**Filter & Group Builder:**
- Purpose: Declarative data transformation pipeline
- Examples: `src/utils/filterData.ts`, `src/utils/groupBuilder.ts`
- Pattern: Pure functions; transformations don't mutate original data

**Statistical Result Types:**
- Purpose: Strongly-typed analysis outputs
- Examples: `BoxPlotStats`, `CapabilityResult`, `HypothesisResult`, etc. in `src/types/index.ts`
- Pattern: Interfaces with nullable fields (e.g., `cp: number | null` when not computable)

## Entry Points

**App Component (`src/App.tsx`):**
- Location: `src/App.tsx`
- Triggers: Application startup via `main.tsx` → ReactDOM
- Responsibilities:
  - File import orchestration (drag-drop, file input)
  - State orchestration (showPlot, chartType, compareDatasetId, exportMenuOpen)
  - Layout composition (Sidebar, Header, main content area)
  - Export actions (PNG, CSV, PDF)
  - Data display (charts + tables)

**Main Renderer (`src/main.tsx`):**
- Location: `src/main.tsx`
- Triggers: Vite dev server or built bundle
- Responsibilities: React app mounting to DOM root

## Error Handling

**Strategy:** Defensive data validation + try-catch in async operations

**Patterns:**

- **File Parsing:** `parseFile()` catches parsing errors → user alert (line 100-103 in App.tsx)
- **Export Operations:** `exportAsPDF()` wraps HTML2Canvas in try-catch → alert on failure (line 227-232)
- **Data Validation:** Numeric conversion uses `Number()` + `isNaN()` + `isFinite()` checks (stats.ts, descriptiveStats.ts)
- **Missing Data:** Null/undefined values filtered out before computation (see stats.ts line 35-42)
- **Safe Navigation:** Store selectors use optional chaining (`activeDataset?.dimensions`)

**Error Message Localization:**

- Errors shown to users use `t('app.errorParsing')` (translated messages)
- Console logs only for development debugging (line 101: `console.error`)

## Cross-Cutting Concerns

**Logging:** Console.log for errors only (file parsing, PDF export failures); no production logging framework

**Validation:**
- Column type checking: `extractNumericColumn()` safely converts to numbers
- Date parsing: `parseCompactDate()` validates date formats (YYYYMMDD, YYYYMM, Excel serial dates)
- Filter regex: ReDoS protection with max pattern length (200 chars) in `filterData.ts` line 42

**Authentication:** None (frontend-only application)

**Internationalization (i18n):**
- Centralized in `src/locales/` (en.ts, zh.ts)
- Runtime language switching via `useTranslation()` hook
- Typed translation keys with dot-notation path validation

**Performance Optimization:**
- `useMemo` throughout `useAnalysis` hook to prevent unnecessary recalculations
- Zustand selectors for granular store subscriptions
- Data table shows first 50 rows only (pagination hint for large datasets)
- HTML2Canvas waits 500ms before rendering (allows DOM paint)

---

*Architecture analysis: 2026-04-17*
