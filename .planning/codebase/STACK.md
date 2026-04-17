# Technology Stack

**Analysis Date:** 2026-04-17

## Languages

**Primary:**
- TypeScript 5.2.2 - All application code, type-safe development

**Secondary:**
- JavaScript - Build configuration (Vite, Tailwind, PostCSS configs)
- JSX/TSX - React component templates

## Runtime

**Environment:**
- Node.js (LTS) - Development and build environment
- Browser (ES2020 target) - Client-side execution

**Package Manager:**
- npm - Dependency management
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 18.2.0 - UI framework and component library
- Vite 5.2.2 - Development server and production bundler
- @vitejs/plugin-react 4.2.1 - React Fast Refresh for HMR

**Styling:**
- Tailwind CSS 3.4.1 - Utility-first CSS framework with custom color scheme (`linear-*` palette)
- PostCSS 8.4.35 - CSS processing with autoprefixer 10.4.18

**Testing:**
- Vitest 1.4.0 - Unit and integration test runner
- @testing-library/react 14.2.1 - React component testing utilities
- @testing-library/jest-dom 6.4.2 - DOM matchers for assertions
- jsdom 24.0.0 - JavaScript DOM implementation for test environment

**Linting & Type Checking:**
- ESLint 8.57.0 - Code linting
- @typescript-eslint/parser 8.58.0 - TypeScript support for ESLint
- @typescript-eslint/eslint-plugin 8.58.0 - TypeScript-specific rules
- eslint-plugin-react-hooks 4.6.0 - React hooks best practices
- eslint-plugin-react-refresh 0.4.6 - React Fast Refresh validation
- TypeScript 5.2.2 - Static type checking (via `tsc` in build pipeline)

## Key Dependencies

**Critical:**
- zustand 4.5.2 - Lightweight state management with immutable updates
- d3 7.8.5 - Data visualization for statistical charts (box plots, histograms)
- jstat 1.9.6 - Statistical calculations and distributions
- simple-statistics 7.8.9 - Core statistical functions (fallback/complementary to jstat)

**Infrastructure:**
- papaparse 5.4.1 - CSV file parsing
- xlsx 0.18.5 - Excel file reading (both .xls and .xlsx formats)
- exceljs 4.4.0 - Excel workbook generation (structured export capability)
- html2canvas 1.4.1 - DOM-to-canvas conversion for PNG export
- jspdf 4.2.1 - PDF generation with multi-page support (A4 auto-pagination)

**UI Components:**
- antd 5.15.0 - Ant Design component library
- lucide-react 0.358.0 - Icon library (SVG-based)

**React DOM:**
- react-dom 18.2.0 - React DOM rendering

## Configuration

**Environment:**
- No `.env` file required for core functionality
- Optional: API keys for external LLM services stored in browser `localStorage` (not committed)
- Language preference (`en` or `zh`) persisted in `localStorage`

**Build:**
- `tsconfig.json` - TypeScript compiler options (target ES2020, strict mode, JSX as react-jsx)
- `vite.config.ts` - Vite configuration with React plugin and Vitest setup
- `tsconfig.node.json` - TypeScript config for Node.js tooling
- `.eslintrc.cjs` - ESLint configuration with TypeScript support
- `postcss.config.js` - PostCSS plugins (tailwindcss, autoprefixer)
- `tailwind.config.js` - Tailwind configuration with custom color palette and typography

**Entry Point:**
- `index.html` - HTML entry with root div (#root) and module script
- `src/main.tsx` - React app initialization via ReactDOM.createRoot()
- `src/App.tsx` - Root component with all layout and state logic

## Platform Requirements

**Development:**
- Node.js LTS (for npm, Vite dev server, testing)
- Modern browser with ES2020 support
- 4GB RAM minimum for build processes

**Production:**
- Static hosting (no server required)
- HTTP/HTTPS capability for LLM API calls to external services
- Browser with ES2020 JavaScript support (Chrome, Firefox, Safari, Edge - recent versions)
- Optional: reverse proxy for CORS when calling external LLM APIs

---

*Stack analysis: 2026-04-17*
