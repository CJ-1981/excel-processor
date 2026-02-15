# Technology Stack Documentation

## Development Environment

### Build Tools
- **Vite** (v7.2.4): Fast development server and production bundler
- **TypeScript** (v5.9.3): Static type checking and enhanced developer experience
- **ESLint** (v9.39.1): Code linting with React and TypeScript rules

### Package Management
- **npm** (via Node.js): Dependency management and script execution
- **package.json**: Project metadata and dependencies

## Core Technology Stack

### Frontend Framework
**React** (v19.2.0)
- Latest React with concurrent features
- Functional components with hooks (useState, useEffect, useMemo, useCallback)
- No class components (modern patterns only)

**TypeScript Integration:**
- Strict mode enabled (`tsconfig.json`)
- Type definitions in `src/types.ts`
- Target: ES2020 with browser libraries

### UI Component Library
**Material-UI (MUI)** (v7.3.7)
- Component library with pre-built accessible components
- Emotion-based styling (@emotion/react, @emotion/styled)
- Theme customization via MUI ThemeProvider

**Key MUI Components Used:**
- DataGrid: Table display (DetailedDataView)
- Dialog: Modal interactions (Dashboard, PDF export)
- Form components: Inputs, selects, checkboxes
- Layout: Container, Box, Paper, Grid

### Data Visualization
**Recharts** (v3.7.0)
- Declarative React charting library
- Responsive charts via ResponsiveContainer wrapper
- Chart types: Line, Area, Bar, Pie

**Custom Chart Components:**
- `TrendChart`: Time-series visualization (line/area/stacked)
- `TopDonorsChart`: Horizontal bar chart for rankings
- `DistributionHistogram`: Frequency distribution
- `ParetoChart`: 80/20 analysis with dual axes
- `RangeDistributionCharts`: Categorical bar charts

### Excel/CSV Processing
**SheetJS (xlsx)** (v0.18.5)
- Parse Excel files (.xlsx, .xls, .csv)
- Extract workbook, sheet, and cell data
- Used functions:
  - `XLSX.read(data, { type: 'array' })`
  - `XLSX.utils.sheet_to_json()`

**Batch Processing Strategy:**
- Queue-based processing (utils/batchProcessor.ts)
- Process 3 files at a time to prevent memory overload
- Progress tracking via ParseProgress state

### PDF Generation
**jsPDF** (v4.1.0) + **AutoTable** (v5.0.7)
- Client-side PDF generation
- Table rendering with autoTable plugin
- Multi-page support with headers/footers

**Template System:**
- JSON-based template definitions (templates/)
- Variable substitution: `{{variableName}}`
- Supported elements:
  - Tables (with column conversions)
  - Text blocks (positioned)
  - Labeled fields
  - Checkboxes
  - Page breaks
  - Custom data tables

### Drag & Drop
**@hello-pangea/dnd** (v18.0.1)
- Drag-and-drop functionality for dashboard column reordering
- React Beautiful DnD fork (maintained for React 18+)

**react-grid-layout** (v2.2.2)
- Draggable, resizable grid layout for dashboard widgets
- Responsive layouts with breakpoints (lg, md, sm, xs, xxs)
- Layout persistence via localStorage

### Utilities & Helpers

**number-to-words** (v1.2.4)
- Convert numeric amounts to words (for German receipts)
- Supports multiple languages

**html2canvas** (dependency via imports)
- Export charts as PNG/JPG images
- Canvas-based screenshot rendering

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Type checking
tsc --noEmit

# Linting
npm run lint

# Production build
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

### Build Configuration
**vite.config.ts:**
- React plugin (@vitejs/plugin-react)
- Development server: port 5173
- Build output: dist/
- Base URL: /excel-processor/ (for GitHub Pages)

**TypeScript Configuration:**
- `tsconfig.json`: Base TypeScript config
- `tsconfig.app.json`: Application-specific settings
- `tsconfig.node.json`: Build tool configuration
- Strict mode enabled
- Path aliases: @/* imports (if configured)

## Testing Strategy

### Current State (as of 2026-02-15)
- **Dashboard Module Coverage:** 85%+ (214 tests passing)
- **Overall Project Coverage:** ~30% (dashboard module complete, other modules pending)
- **Goal:** 85% overall coverage per MoAI TRUST 5 framework

### Test Stack (Implemented)
**Framework:** Vitest (v2.0.0) - Vite-native test runner
**Testing Library:** @testing-library/react (v14.2.1)
**Utilities:** @testing-library/user-event (v14.5.2)
**Configuration:** vitest.config.ts

### Test Categories
1. **Unit Tests:** Utility functions (statisticsAnalyzer, chartDataTransformers) - IMPLEMENTED
2. **Component Tests:** React components (DashboardView subcomponents) - IMPLEMENTED
3. **Integration Tests:** User workflows (file upload → dashboard → export) - PLANNED
4. **E2E Tests:** Playwright for critical paths - PLANNED

### Test Scripts (Added to package.json)
```bash
npm test              # Run tests once
npm run test:ui       # Run tests with Vitest UI
npm run test:coverage # Generate coverage report
```

### Test Coverage Dashboard Module
- **Chart Modules:** 6 modules, all tested
- **Component Modules:** 3 modules, all tested
- **Hook Modules:** 7 hooks, all tested
- **Utility Modules:** 4 utilities, all tested
- **Total Tests:** 214 tests, 100% passing

### Quality Gates (MoAI TRUST 5)
- **Tested:** 85%+ coverage, characterization tests for refactoring
- **Readable:** Clear naming, English comments
- **Unified:** Consistent formatting (ESLint + Prettier)
- **Secured:** OWASP compliance, input validation
- **Trackable:** Conventional commits, SPEC references

## Performance Optimization

### Code Splitting
- **Route-based:** Lazy loading for large components (planned)
- **Component-based:** Dynamic imports for charts (current)
- **Build output:** Chunk analysis via vite-plugin-visualizer

### Bundle Size Management
**Current:** ~2MB initial load (uncompressed)
**Target:** <1MB initial load
**Strategies:**
- Tree shaking (Vite automatic)
- MUI tree shaking (selective imports)
- Lazy loading for PDF generation
- Compression (gzip via hosting)

### Runtime Performance
**Memoization:**
- `useMemo` for expensive computations (statistics, aggregations)
- `React.memo` for chart component re-render prevention
- `useCallback` for event handler stability

**Virtualization:** (Planned)
- react-window for large data tables
- Virtualized list for unique names

## Browser Compatibility

### Target Browsers
- **Chrome/Edge:** 90+ (Chromium)
- **Firefox:** 88+
- **Safari:** 14+

### Required Features
- ES2020 support
- Array methods (flatMap, flat)
- BigInt (for large number handling)
- Canvas API (for chart export)
- FileReader API (for file upload)

### Progressive Enhancement
- Core functionality works without JavaScript disabled
- Graceful degradation for older browsers
- Feature detection for advanced APIs

## Security Measures

### Dependency Management
**npm audit:**
- Run `npm audit` regularly
- Fix vulnerabilities via `npm audit fix`
- Review security advisories

**Known Vulnerabilities:**
- None currently (last checked: 2026-02-15)

### Code Security
**XSS Prevention:**
- React's JSX escaping (automatic)
- No `dangerouslySetInnerHTML` without sanitization
- Input validation for file uploads

**CSRF Protection:**
- N/A (client-side only, no server requests)

**Content Security Policy:**
- Recommended CSP headers for deployment:
  ```
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  ```

## Deployment & Hosting

### Build Process
```bash
npm run build
```
**Output:** dist/ directory
**Contents:**
- index.html (entry point)
- assets/ (JavaScript bundles, CSS, images)
- .vite/ (manifest files)

### Hosting Configuration
**GitHub Pages:**
- Source: dist/ directory
- Base URL: /excel-processor/
- HTTPS: Automatic
- Caching: Aggressive (immutable assets)

### Environment Variables
**Runtime:** None required (client-side only)
**Build-time:** (if needed)
```
VITE_APP_VERSION=1.5.1
VITE_GA_TRACKING_ID=XXX  # (future)
```

## Development Tools

### IDE Recommendations
- **VS Code:** Official TypeScript support
- **Extensions:**
  - ES Lint (code quality)
  - Prettier (code formatting)
  - Import Cost (bundle size awareness)

### Debugging
**Browser DevTools:**
- React DevTools (component inspection)
- Redux DevTools (if state management added)
- Performance Profiler (render optimization)

**Debug Logging:**
- `utils/logger.ts`: Conditional debug logging
- Enable: `localStorage.setItem('excel-processor-debug', 'true')`
- Disable: `localStorage.removeItem('excel-processor-debug')`

## Version Management

### Semantic Versioning
**Format:** MAJOR.MINOR.PATCH
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes

**Current Version:** 1.5.1
- **Release Notes:** Maintained in README.md
- **Build Timestamp:** Auto-generated

### Release Process
```bash
# Update version in package.json
npm version [major|minor|patch]

# Build and test
npm run build
npm run preview

# Deploy
npm run deploy

# Commit and tag
git add .
git commit -m "chore(release): Bump version to vX.X.X"
git tag vX.X.X
git push && git push --tags
```

## Future Technology Considerations

### Potential Upgrades
1. **State Management:** Zustand or Jotai (if complexity increases)
2. **Data Fetching:** React Query (if API integration needed)
3. **Form Handling:** React Hook Form (for complex PDF templates)
4. **Virtualization:** react-window (for large datasets)
5. **Testing:** Vitest + Testing Library (planned)

### Technology Sunset Plan
- **React 19 → React 20:** Upgrade when stable
- **Vite 7 → Vite 8:** Follow major version updates
- **MUI v7 → v8:** Upgrade when available
- **SheetJS:** Monitor for alternative libraries (faster parsing)

---

**Last Updated:** 2026-02-15
**Document Version:** 1.0
