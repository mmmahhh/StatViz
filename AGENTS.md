# AGENTS.md — StatViz

Statistical visualization & quality analysis SPA (React 18 + TypeScript 5.2 + Vite 5 + D3.js + Zustand).  
Combines classical statistics with LLM-powered diagnostic reports. Frontend-only, no backend.

## Quick Commands

| Task | Command | Notes |
|------|---------|-------|
| Dev server | `npm run dev` | Vite HMR |
| Build | `npm run build` | Runs `tsc` first — type error = build fail |
| Type check only | `npx tsc --noEmit` | Always run before commit |
| Lint | `npm run lint` | `--max-warnings 0` — any warning = fail |
| Test (watch) | `npm test` | Vitest |
| Test (single run) | `npx vitest run` | CI mode |

## Architecture (6-layer SPA)

```
src/components/   — UI (analysis panels, D3 charts, layout, ui primitives)
src/hooks/        — useAnalysis (orchestrator) → useBasicAnalysis, useCapabilityAnalysis, useMsaAnalysis
src/store/        — Single Zustand store with immer middleware
src/utils/        — Pure functions: stats, filters, parsers, PDF export
src/types/        — All domain types in single index.ts
src/locales/      — en.ts, zh.ts (typed DotPaths<T> keys)
```

**Data flow**: File upload → `parseFile` → `addDataset` → user sets dimensions/module → click Run → `useAnalysis` recomputes → charts + report panel render.

## State: Zustand + Immer

Single `useDataStore` — never add a second store. Inside `set()` callbacks, immer makes mutations safe. Outside `set()`, **never mutate state**.

```
useDataStore: datasets[], activeDatasetId, language
  Actions: addDataset, removeDataset, setDimensions, setModule,
           updateCell, setGroupBuilder, addFilter, etc.
```

`useActiveDataset()` selector returns the full active Dataset. Datasets are independently configured (each has its own dimensions, module, filters, groupBuilder, capabilityConfig).

## Analysis Modules & Dimension Requirements

| Module | X-axis | Y-axis | Extra config |
|--------|--------|--------|-------------|
| `basic` | xAxis[0] or derived group | required | groupBuilder, compareDatasetId |
| `capability` | none | required | USL/LSL/Target/SubgroupSize |
| `regression` | xAxis[0] | required | — |
| `hypothesis` | xAxis[0] | required | — |
| `msa` (Gage R&R) | xAxis[0] (Part) + xAxis[1] (Operator) | required | — |
| `msa-kappa` | xAxis[0] + xAxis[1] | required | — |
| `msa-linearity` | xAxis[0] (Reference) | required | — |

**CRITICAL**: `xAxis[0]` and `xAxis[1]` are accessed without bounds checks — always guard before indexing. Module detection uses `.startsWith('msa')` in Sidebar — adding any module prefixed `msa` will break logic.

## Adding a New Analysis Module

1. Add type to `AnalysisModule` union in `src/types/index.ts`
2. Add result interface in same file
3. Create calculator: `src/utils/newModuleStats.ts` (pure function, takes `RawDataRow[]`)
4. Create panel: `src/components/analysis/NewPanel.tsx`
5. Add `useMemo` block in `src/hooks/useAnalysis.ts`
6. Add conditional render in `src/components/analysis/ChartView.tsx`
7. Update Sidebar module selector

## Coding Conventions

- **Components**: PascalCase, `React.FC<Props>`, named exports. Props interface named `[Component]Props`
- **Utils/Hooks**: camelCase, hooks prefixed `use`. Files: `useAnalyis.ts`, `filterData.ts`
- **Imports**: relative paths only (no aliases). Order: React → 3rd-party → D3 → utils → types → components → hooks
- **Types**: `interface` for domain models, `type` for unions. All in `src/types/index.ts`
- **No `any`** — use `unknown` with narrowing
- **Immutability**: spread operator, `map`/`filter` over mutation
- **Semicolons**: required
- **TypeScript**: strict mode; `noUnusedLocals` + `noUnusedParameters` (build-blocking)
- **Derived columns**: `__statviz_*__` prefix for internal columns to avoid user conflicts
- **IDs**: use `crypto.randomUUID()`, NOT `Math.random()`

## Design System

Custom dark theme with `linear-*` CSS classes: `linear-bg`, `linear-surface`, `linear-panel`, `linear-brand`, `linear-brandAccent`, `linear-secondary`, `linear-tertiary`, `linear-quaternary`, `linear-border`, `linear-borderSubtle`. All components use these — never introduce raw hex colors.

Tailwind CSS with custom `linear-*` palette defined in `tailwind.config.js`.

## Testing

- **Framework**: Vitest + @testing-library/react + jsdom
- **Test locations**: `src/test/*.test.ts` (utility tests), co-located `*.test.ts` (hooks), `src/store/useDataStore.test.ts` (store)
- **Coverage gaps**: Chart components (BoxPlot, Histogram, ScatterPlot) are **untested** — visual-only verification
- **Serial execution**: Vitest uses `pool: 'forks'` with `maxForks: 1` to avoid memory spikes
- **Pattern for hooks**: `renderHook` from `@testing-library/react`, with `cleanup()` in `afterEach`
- **Pattern for store**: `getState()` / `setState()` direct access

## Critical Gotchas

1. **`useAnalysis` has side effects**: a `useEffect` clears group builder fields when `yAxis` changes — calls `getState().setGroupBuilder()` directly
2. **Module detection fragile**: `.startsWith('msa')` in Sidebar — don't add `msa`-prefixed modules without updating
3. **No `React.memo` on D3 charts** — every prop change = full SVG re-render. Wrap new chart components.
4. **Export state machine**: `isExporting` triggers VirtualTable to render `<table>` mode → `requestAnimationFrame` × 2 → html2canvas capture → jsPDF. Row limit: 500.
5. **immer inside `set()` only**: mutations inside `set((state) => { state.x = y })` are safe. Outside — never.
6. **No path aliases** — all imports use `../` relative paths
7. **No `.env` files** — API keys in browser `localStorage` via Zustand persist
8. **ReDoS protection**: regex filter patterns limited to 200 chars via `safeRegex.ts`
9. **File import limit**: 50MB via `fileParser.ts`
10. **language stored in Zustand**, not separate context. Default: `'zh'`
11. **No React Router** — single-page, no client-side routing

## i18n

Two flat files: `src/locales/en.ts`, `zh.ts`. Typed via `DotPaths<T>` recursive utility.
Usage: `const { t } = useTranslation(); t('app.title')` — compile-time key validation.
Template interpolation: `t('app.datasetDetails', { r: 100, c: 5 })`.

## Reference Files

- `README.md` — project overview, features, LLM setup guide
- `.planning/codebase/ARCHITECTURE.md` — detailed architecture (186 lines)
- `.planning/codebase/CONVENTIONS.md` — full coding conventions (254 lines)
- `.planning/codebase/CONCERNS.md` — tech debt, known bugs, security gaps (236 lines)
- `.planning/codebase/STRUCTURE.md` — where to add new code (274 lines)
- `.planning/codebase/TESTING.md` — test patterns and coverage gaps (371 lines)
- `.learnings/LEARNINGS.md` — historical lessons from past mistakes
