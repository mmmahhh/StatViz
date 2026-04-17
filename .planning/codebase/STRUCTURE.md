# Codebase Structure

**Analysis Date:** 2026-04-17

## Directory Layout

```
systems/StatViz/
├── src/                          # Application source code
│   ├── main.tsx                  # React app mount point
│   ├── App.tsx                   # Root component (file upload, layout, export)
│   ├── index.css                 # Tailwind CSS directives
│   ├── components/               # UI components (organized by feature)
│   │   ├── analysis/             # Statistical analysis report panels
│   │   ├── charts/               # D3.js visualizations (BoxPlot, Histogram, ScatterPlot)
│   │   ├── layout/               # Layout components (Sidebar, Header, DataFilterPanel)
│   │   ├── settings/             # (Deprecated: LLM settings, now in browser localStorage)
│   │   └── ui/                   # Base UI components (Button, Card)
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAnalysis.ts        # Core analysis computation engine
│   │   ├── useTranslation.ts     # i18n hook with typed keys
│   │   └── useStyleStore.ts      # Style/theme state
│   ├── store/                    # Zustand state management
│   │   ├── useDataStore.ts       # Main app state (datasets, dimensions, modules, filters)
│   │   └── useDataStore.test.ts  # Zustand store tests
│   ├── types/                    # TypeScript interfaces and types
│   │   └── index.ts              # Domain models (Dataset, Analysis results, etc.)
│   ├── utils/                    # Utility functions (stateless, pure)
│   │   ├── stats.ts              # Box plot calculation (D3.js grouping, quartiles, outliers)
│   │   ├── descriptiveStats.ts   # Mean, stdev, CI, skewness, kurtosis
│   │   ├── capabilityStats.ts    # Cp, Cpk, Pp, Ppk indices
│   │   ├── regressionStats.ts    # Linear regression (slope, intercept, R²)
│   │   ├── hypothesisStats.ts    # t-Test and ANOVA
│   │   ├── msaStats.ts           # MSA, Gage R&R, Kappa, Linearity & Bias
│   │   ├── filterData.ts         # Data filtering (in, not_in, range, regex operators)
│   │   ├── groupBuilder.ts       # Derived column grouping by date/custom (with sorting)
│   │   ├── dateGrouping.ts       # Date parsing (YYYYMMDD, YYYYMM, Excel serial, ISO)
│   │   ├── fileParser.ts         # CSV/Excel file parsing (PapaParse, XLSX)
│   │   └── ***.test.ts           # Unit tests for each utility
│   ├── locales/                  # Internationalization
│   │   ├── en.ts                 # English translations (nested object)
│   │   └── zh.ts                 # Chinese translations (nested object)
│   ├── test/                     # Test configuration and fixtures
│   │   ├── setup.ts              # Vitest setup (jest-dom)
│   │   └── *.test.ts             # Integration tests (filterData, capability, MSA, etc.)
│   └── jstat.d.ts                # Type definitions for jstat library
├── public/                       # Static assets (index.html served by Vite)
├── dist/                         # Built output (vite build)
├── .planning/
│   └── codebase/                 # Generated codebase analysis docs (this file, ARCHITECTURE.md)
├── docs/                         # Documentation (project-specific guides)
├── .claude/                      # Claude agent skills and hooks
├── package.json                  # Dependencies (React 18, D3.js, Zustand, Tailwind, Vite)
├── tsconfig.json                 # TypeScript compiler config
├── vite.config.ts                # Vite build config (React, Vitest)
├── tailwind.config.js            # Tailwind theme customization (linear color palette)
├── postcss.config.js             # PostCSS (autoprefixer for Tailwind)
└── README.md                     # Project documentation
```

## Directory Purposes

**`src/`:**
- Purpose: All application source code
- Contains: Components, hooks, utilities, store, types, translations, tests
- Key files: `App.tsx` (root), `main.tsx` (entry), `types/index.ts` (domain models)

**`src/components/`:**
- Purpose: React UI components organized by feature/layer
- Contains: Presentational and container components
- Key files: `App.tsx` (orchestration), `ChartView.tsx` (analysis view controller)

**`src/components/analysis/`:**
- Purpose: Statistical analysis report panels
- Contains: `ChartView.tsx` (module selector), `StatsSummaryPanel.tsx` (basic stats), `CapabilityPanel.tsx`, `RegressionPanel.tsx`, `HypothesisPanel.tsx`, `MSAPanel.tsx`, `KappaPanel.tsx`, `LinearityBiasPanel.tsx`, `ReportSummaryPanel.tsx` (consolidated report)
- Pattern: Each panel accepts pre-computed result data via props; no internal calculation

**`src/components/charts/`:**
- Purpose: D3.js statistical visualizations
- Contains: `BoxPlot.tsx` (box-and-whisker), `Histogram.tsx` (frequency distribution), `ScatterPlot.tsx` (X-Y regression points)
- Pattern: Functional components with SVG; D3 scales and axes; memoized to prevent unnecessary re-renders

**`src/components/layout/`:**
- Purpose: Layout structure and controls
- Contains: `Sidebar.tsx` (dataset list, module selector, dimension drag-drop, filter builder), `Header.tsx` (analysis controls, export menu), `DataFilterPanel.tsx` (filter rule manager)
- Key responsibility: Sidebar manages dimension selection and filter editing

**`src/components/ui/`:**
- Purpose: Reusable base UI components
- Contains: `Button.tsx` (primary/secondary variants), `Card.tsx` (panel wrapper)
- Pattern: Simple Tailwind-wrapped HTML elements

**`src/hooks/`:**
- Purpose: Custom React hooks encapsulating logic and side effects
- Contains: `useAnalysis.ts` (computation orchestrator), `useTranslation.ts` (i18n), `useStyleStore.ts` (theme state)
- Key pattern: `useAnalysis` returns all computed analysis results as a single object for prop drilling efficiency

**`src/store/`:**
- Purpose: Centralized Zustand state management
- Contains: `useDataStore.ts` (main app state), `useStyleStore.ts` (UI preferences)
- Key responsibility: Manages datasets, dimensions, modules, filters, and grouping; immutable updates

**`src/types/`:**
- Purpose: TypeScript type definitions for the entire app
- Contains: Single file `index.ts` with all interfaces and union types
- Pattern: No runtime code; pure type declarations for compile-time checking

**`src/utils/`:**
- Purpose: Stateless utility functions (pure functions)
- Contains: Statistical calculators, data transformers, file parsers, filters
- Key pattern: No side effects; accept input data, return results; extensively tested

**`src/locales/`:**
- Purpose: Multilingual UI strings
- Contains: `en.ts` and `zh.ts` with nested translation objects
- Pattern: Dot-notation paths (e.g., `app.title`, `charts.compareWith`); type-safe via `useTranslation()`

**`src/test/`:**
- Purpose: Test configuration and test data
- Contains: `setup.ts` (Vitest config), `*.test.ts` files (unit tests for utilities)
- Pattern: Co-located tests in `src/` alongside source files (e.g., `filterData.ts` has `filterData.test.ts`)

**`public/`:**
- Purpose: Static assets
- Contains: `index.html` (entry HTML), favicon, logo (if any)
- Note: Vite serves these directly

**`dist/`:**
- Purpose: Built output (production)
- Contents: Generated by `npm run build` (TypeScript compiled, Vite bundled)
- Status: Not committed to git (in .gitignore)

## Key File Locations

**Entry Points:**

- `src/main.tsx` - React app mount; imports `App.tsx` and `index.css`
- `src/App.tsx` - Root component; layout orchestration, file input handling, export logic
- `public/index.html` - HTML entry point for Vite

**Configuration:**

- `package.json` - Dependencies, scripts (dev, build, lint, test)
- `tsconfig.json` - TypeScript compiler settings (strict mode, JSX, module resolution)
- `vite.config.ts` - Vite build config (React plugin, Vitest setup)
- `tailwind.config.js` - Tailwind theme extensions (linear color palette)
- `postcss.config.js` - PostCSS plugins (autoprefixer)

**Core Logic:**

- `src/store/useDataStore.ts` - Main state container; dataset management
- `src/hooks/useAnalysis.ts` - Computation orchestrator; memoized stat calculations
- `src/components/analysis/ChartView.tsx` - Analysis view; module dispatch to panels
- `src/types/index.ts` - Domain model definitions

**Testing:**

- `src/test/setup.ts` - Vitest configuration
- `src/store/useDataStore.test.ts` - Store mutation tests
- `src/test/capabilityStats.test.ts`, `msaStats.test.ts`, `regression.test.ts`, etc. - Statistical calculator tests

**Styling:**

- `src/index.css` - Tailwind directives (base, components, utilities)
- `tailwind.config.js` - Color palette, fonts, shadows
- Components use inline Tailwind classes (no CSS modules)

## Naming Conventions

**Files:**

- Components: `PascalCase.tsx` (e.g., `BoxPlot.tsx`, `DataFilterPanel.tsx`)
- Utilities: `camelCase.ts` (e.g., `capabilityStats.ts`, `groupBuilder.ts`)
- Hooks: `use[Name].ts` (e.g., `useAnalysis.ts`, `useTranslation.ts`)
- Tests: `*.test.ts` or `*.test.tsx` (co-located with source)
- Types: `index.ts` in `src/types/` (single-file approach)

**Directories:**

- Feature/Layer directories: `lowercase` (e.g., `components`, `hooks`, `utils`, `locales`)
- Sub-categories: `lowercase` (e.g., `components/analysis`, `components/charts`)

**Variables & Functions:**

- Functions: `camelCase` (e.g., `calculateBoxPlotStats`, `applyFilters`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `DERIVED_GROUP_COLUMN`, `DERIVED_GROUP_SORT_COLUMN`)
- React Hooks: `use[PascalName]` (e.g., `useAnalysis`, `useDataStore`)
- Component Props interfaces: `[ComponentName]Props` (e.g., `ChartViewProps`, `SidebarProps`)
- Zustand action methods: `camelCase` (e.g., `addDataset`, `setDimensions`, `updateFilter`)

**Exports:**

- Named exports for utilities and hooks (e.g., `export function calculateBoxPlotStats()`)
- Named exports for components (e.g., `export const BoxPlot: React.FC<BoxPlotProps>`)
- Default export for App component (e.g., `export default App`)

## Where to Add New Code

**New Statistical Analysis Module:**

- Add new analysis module type to `AnalysisModule` union in `src/types/index.ts`
- Create result interface in `src/types/index.ts` (e.g., `NewAnalysisResult`)
- Implement calculator in `src/utils/newAnalysisStats.ts` (pure function, accepts RawDataRow[] and dimensions)
- Add test file `src/test/newAnalysisStats.test.ts`
- Add panel component `src/components/analysis/NewPanel.tsx` (displays results)
- Update `useAnalysis.ts` hook: add useMemo block to compute new module results
- Update `ChartView.tsx`: add conditional render for new panel
- Update Sidebar module selector option in `src/components/layout/Sidebar.tsx`

**New UI Component (non-analysis):**

- If base component: `src/components/ui/[ComponentName].tsx`
- If feature-specific: `src/components/[feature]/[ComponentName].tsx`
- Create props interface inline or in `src/types/index.ts`
- Use Tailwind for styling (no CSS files)
- Export as named export for easy testing

**New Filter or Data Transformation:**

- Implement in `src/utils/` as a pure function (e.g., `src/utils/newTransform.ts`)
- Add comprehensive tests in `src/test/` or co-located `*.test.ts`
- Export from utility file; import in `useAnalysis.ts` or call directly
- If user-facing, add filter rule builder UI in `src/components/layout/DataFilterPanel.tsx`

**New Translation Strings:**

- Add keys to both `src/locales/en.ts` and `src/locales/zh.ts`
- Maintain nested object structure (e.g., `app: { title: "..." }`)
- Use in components via `useTranslation()` hook: `const { t } = useTranslation(); t('app.title')`
- TypeScript will validate key existence at compile time

**New Test:**

- Utility tests: `src/test/[name].test.ts` or `src/utils/[name].test.ts`
- Store tests: `src/store/useDataStore.test.ts`
- Component tests: `src/components/[path]/[ComponentName].test.tsx`
- Use Vitest syntax (describe, it, expect, beforeEach)
- Mock external dependencies as needed

## Special Directories

**`.planning/codebase/`:**
- Purpose: Generated codebase analysis documents (ARCHITECTURE.md, STRUCTURE.md)
- Generated: Yes (by `/gsd-map-codebase` command)
- Committed: Yes (tracked in git for reference)

**`.claude/`:**
- Purpose: Claude agent skills, hooks, and command definitions
- Generated: No (manually configured)
- Committed: Yes (project-specific agent config)

**`docs/`:**
- Purpose: Project-level documentation (user manuals, design rationale)
- Generated: No (user-written)
- Committed: Yes

**`dist/`:**
- Purpose: Build output
- Generated: Yes (by `npm run build`)
- Committed: No (.gitignore)

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (by `npm install`)
- Committed: No (.gitignore)

**`test_data/`:**
- Purpose: Sample CSV/Excel files for manual testing and demos
- Generated: No (user-provided fixtures)
- Committed: Yes

---

*Structure analysis: 2026-04-17*
