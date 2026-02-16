# Implementation Plan: SPEC-UI-ANONYMIZE-001

## Overview

This document outlines the implementation strategy for enhancing name anonymization across all dashboard chart components, ensuring consistent privacy protection while maintaining data exploration capabilities through hover-to-reveal functionality.

## Implementation Strategy

### Development Methodology

**Mode:** Hybrid (TDD for new features + DDD for existing code modifications)

**Rationale:**
- New tooltip components require TDD approach (RED-GREEN-REFACTOR)
- Existing chart modifications use DDD approach (ANALYZE-PRESERVE-IMPROVE)
- Test coverage target: 85% for new code, characterization tests for modified code

### Architecture Approach

**Pattern:** Reusable Anonymization Utility

Instead of duplicating anonymization logic across components, create a shared utility module:

```
src/features/dashboard/utils/
  ├── anonymizationUtils.ts       # Core anonymization functions
  └── useChartAnonymization.ts    # React hook for chart components
```

**Benefits:**
- Single source of truth for anonymization logic
- Easier testing and maintenance
- Consistent behavior across all charts
- Simplified future enhancements (custom formats, etc.)

## Milestones

### Milestone 1: Foundation (Priority: High)

**Objective:** Create reusable anonymization utilities and testing infrastructure

**Tasks:**
1. Create `anonymizationUtils.ts` module
2. Implement `formatAnonymizedLabel()` function
3. Implement `useChartAnonymization()` hook
4. Write unit tests for utility functions (TDD)
5. Set up test fixtures for chart components

**Success Criteria:**
- Utility functions have 90%+ test coverage
- Hook properly manages anonymize state
- All tests passing (GREEN phase)

**Dependencies:** None

**Estimated Effort:** 2-3 hours

### Milestone 2: Component Updates (Priority: High)

**Objective:** Update all 6 chart components to support anonymization

**Tasks:**

#### 2.1 TopDonorsChart Enhancement
- Add `anonymize` prop to interface (already exists)
- Update `CustomTooltip` to use anonymization utility
- Write characterization tests for existing behavior
- Add tests for anonymized tooltip behavior
- Verify X-axis anonymization still works

#### 2.2 ParetoChart Enhancement
- Add `anonymize` prop to `ParetoChartProps` interface
- Update Tooltip formatter to respect anonymize flag
- Write characterization tests for existing behavior
- Add tests for anonymized tooltip behavior
- Verify X-axis anonymization still works

#### 2.3 TrendChart Assessment
- Determine if series names contain PII
- Add `anonymize` prop if needed
- Update tooltip if PII detected
- Write characterization tests

#### 2.4 DistributionHistogram Assessment
- Document why no changes needed (X-axis shows ranges)
- Add clarifying comments to component

#### 2.5 RangeDistributionCharts Enhancement
- Investigate current implementation
- Add `anonymize` prop if displaying names
- Apply consistent anonymization pattern

#### 2.6 StatisticsTable Enhancement
- Add `anonymize` prop
- Implement row name anonymization
- Consider hover-to-reveal for table rows
- Write tests for table anonymization

**Success Criteria:**
- All components accept `anonymize` prop
- X-axis labels anonymized when enabled
- Tooltips show actual names on hover
- All characterization tests passing
- New feature tests passing

**Dependencies:** Milestone 1

**Estimated Effort:** 6-8 hours

### Milestone 3: Integration (Priority: High)

**Objective:** Update DashboardView to pass anonymize prop to all charts

**Tasks:**
1. Identify all chart component usages in DashboardView
2. Update each component invocation to pass `anonymizeNames` prop
3. Verify prop passing with TypeScript compiler
4. Test integration with localStorage state
5. Verify state persistence across page reloads

**Success Criteria:**
- All chart components receive `anonymize` prop
- Toggle state changes update all charts
- localStorage persistence works correctly
- Zero TypeScript errors
- Zero console warnings

**Dependencies:** Milestone 2

**Estimated Effort:** 2-3 hours

### Milestone 4: Visual Feedback (Priority: Medium - Optional)

**Objective:** Add visual indicators for anonymization mode

**Tasks:**
1. Design anonymization badge/icon (e.g., eye-slash icon)
2. Add indicator to chart headers or toolbar
3. Implement tooltip explaining anonymization mode
4. Add accessibility labels for screen readers
5. Write tests for visual feedback components

**Success Criteria:**
- Clear visual indicator when anonymization is active
- Accessible to screen readers
- Does not clutter UI
- Responsive on mobile devices

**Dependencies:** Milestone 3

**Estimated Effort:** 3-4 hours

### Milestone 5: Documentation & Cleanup (Priority: Medium)

**Objective:** Complete documentation and code cleanup

**Tasks:**
1. Update component documentation (JSDoc comments)
2. Add inline comments for anonymization logic
3. Update README with anonymization feature description
4. Clean up any temporary code or console.log statements
5. Run linter and fix all warnings
6. Final test run: 100% pass rate

**Success Criteria:**
- All new code documented
- Zero linter warnings
- Zero TypeScript errors
- All tests passing
- Code review approved

**Dependencies:** Milestone 3

**Estimated Effort:** 2-3 hours

## Technical Approach

### Code Structure

```typescript
// src/features/dashboard/utils/anonymizationUtils.ts

/**
 * Formats a label for anonymized display
 * @param originalLabel - The original name/entity label
 * @param index - The numeric index for anonymization
 * @param format - The anonymization format pattern
 * @returns Anonymized label string
 */
export function formatAnonymizedLabel(
  originalLabel: string,
  index: number,
  format: 'number' | 'person' | 'contributor' = 'person'
): string {
  switch (format) {
    case 'number':
      return `#${index + 1}`;
    case 'person':
      return `Person #${index + 1}`;
    case 'contributor':
      return `Contributor ${index + 1}`;
    default:
      return `#${index + 1}`;
  }
}

/**
 * Determines if a chart data key contains personally identifiable information
 * @param dataKey - The data key to check
 * @returns True if the key likely contains PII
 */
export function isPiiDataKey(dataKey: string): boolean {
  const piiPatterns = ['name', 'person', 'donor', 'contributor', 'entity'];
  return piiPatterns.some(pattern => dataKey.toLowerCase().includes(pattern));
}
```

```typescript
// src/features/dashboard/utils/useChartAnonymization.ts

import { useMemo } from 'react';

export interface UseChartAnonymizationOptions {
  anonymize: boolean;
  data: unknown[];
  dataKey?: string;
}

export function useChartAnonymization(options: UseChartAnonymizationOptions) {
  const { anonymize, data, dataKey } = options;

  const shouldAnonymize = useMemo(() => {
    if (!anonymize) return false;
    if (!dataKey) return true; // Default to anonymize if no key provided
    return isPiiDataKey(dataKey);
  }, [anonymize, dataKey]);

  const formatLabel = useMemo(() => {
    return (originalLabel: string, index: number) => {
      return shouldAnonymize
        ? formatAnonymizedLabel(originalLabel, index)
        : originalLabel;
    };
  }, [shouldAnonymize]);

  return {
    shouldAnonymize,
    formatLabel,
  };
}
```

### Component Integration Pattern

```typescript
// Example: TopDonorsChart integration

import { useChartAnonymization } from '../../utils/useChartAnonymization';

interface TopDonorsChartProps {
  data: CategoryDistribution[];
  valueLabel: string;
  limit?: number;
  anonymize?: boolean;  // Existing prop
  // ... other props
}

const TopDonorsChart: React.FC<TopDonorsChartProps> = ({
  data,
  valueLabel,
  limit = 10,
  anonymize = false,
  // ... other props
}) => {
  const { shouldAnonymize, formatLabel } = useChartAnonymization({
    anonymize,
    data: chartData,
    dataKey: 'name',
  });

  // X-axis with anonymization
  <XAxis
    dataKey="name"
    tickFormatter={
      shouldAnonymize
        ? (_value: unknown, index: number) => formatLabel(String(_value), index)
        : undefined
    }
  />

  // Tooltip with anonymization
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const displayLabel = shouldAnonymize
        ? formatLabel(label, payload[0].payload.index)
        : label;

      return (
        <Box>
          <Typography>{displayLabel}</Typography>
          {/* ... rest of tooltip */}
        </Box>
      );
    }
    return null;
  };

  // ... rest of component
};
```

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Recharts tooltip customization complexity | Medium | Medium | Use custom tooltip component pattern from TopDonorsChart |
| Performance degradation with large datasets | Low | Medium | Benchmark with 10K+ rows, optimize if needed |
| State synchronization issues | Low | High | Use React state management best practices |
| Backward compatibility break | Low | High | Default `anonymize` to false, test existing functionality |

### Implementation Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Inconsistent implementation across charts | Medium | Medium | Use shared utility and hook |
| Test coverage gaps | Medium | Medium | TDD approach, coverage reporting |
| Missing edge cases | Low | Medium | Comprehensive acceptance criteria testing |

## Testing Strategy

### Unit Tests (TDD Approach)

**Utility Functions:**
- `formatAnonymizedLabel()` with various formats
- `isPiiDataKey()` with pattern variations
- `useChartAnonymization()` hook behavior

**Coverage Target:** 90%+ for utilities

### Integration Tests

**Chart Component Tests:**
- Each chart component with `anonymize=true`
- Each chart component with `anonymize=false`
- X-axis label formatting
- Tooltip content display
- State changes from localStorage

**Coverage Target:** 85%+ for components

### Characterization Tests (DDD Approach)

**Existing Behavior Preservation:**
- TopDonorsChart current behavior
- ParetoChart current behavior
- All other charts current behavior

**Purpose:** Ensure no regressions when adding anonymization

### End-to-End Tests

**User Workflows:**
1. Toggle anonymize on → verify all charts update
2. Reload page → verify state persists
3. Hover over anonymized chart → verify tooltip shows name
4. Toggle anonymize off → verify actual names return

**Tools:** React Testing Library + Jest

## Dependencies

### Internal Dependencies

- `src/features/dashboard/charts/` - All chart components
- `src/components/DashboardView/index.tsx` - Main dashboard component
- `src/features/dashboard/utils/` - Utility functions (new)

### External Dependencies

- `recharts` (2.x) - Chart library
- `@mui/material` (5.x) - UI components
- `react` (19.x) - UI framework
- `typescript` (5.x) - Type system

## Rollback Plan

**If critical issues arise:**

1. Feature flag the anonymization enhancement
2. Revert individual component changes
3. Keep utility functions (no harm in existing code)
4. Restore previous chart implementations from git history

**Rollback Triggers:**
- Performance degradation >20%
- Breaking changes to existing functionality
- Accessibility violations
- Security vulnerabilities

## Success Metrics

### Code Quality Metrics

- **Test Coverage:** ≥85% across all modified files
- **TypeScript Errors:** 0
- **ESLint Warnings:** 0
- **Performance Overhead:** <10ms per chart render

### Feature Quality Metrics

- **Chart Coverage:** 6/6 charts support anonymization
- **Consistency:** 100% consistent behavior across all charts
- **Backward Compatibility:** 100% (no breaking changes)
- **User Experience:** Smooth toggle interaction, no lag

### Documentation Metrics

- **Code Comments:** 100% of new functions documented
- **JSDoc Coverage:** 100% of exported functions
- **README Updated:** Yes

## Timeline

**Total Estimated Effort:** 15-21 hours

**Breakdown:**
- Milestone 1: 2-3 hours
- Milestone 2: 6-8 hours
- Milestone 3: 2-3 hours
- Milestone 4: 3-4 hours (optional)
- Milestone 5: 2-3 hours

**Recommended Sequence:**
1. Complete Milestones 1-3 (core functionality)
2. Test thoroughly in development environment
3. Decide on Milestone 4 based on user feedback
4. Complete Milestone 5 (documentation)

## Open Questions

1. **Custom Anonymization Formats:** Should users be able to customize the anonymization format (e.g., "Donor #1" vs "Person #1")?
   - **Decision:** Defer to future enhancement (REQ-009)

2. **StatisticsTable Hover-to-Reveal:** Should the table implement hover-to-reveal like charts?
   - **Decision:** Include in Milestone 2.6, assess during implementation

3. **Visual Feedback Priority:** Is visual feedback (badge/icon) required for MVP?
   - **Decision:** Marked as optional (Milestone 4), gather user feedback

4. **Performance Baseline:** What is the current render time for charts with 10K+ rows?
   - **Action:** Benchmark before implementation, compare after

---

**Plan Version:** 1.0
**Last Updated:** 2026-02-16
**Next Review:** After Milestone 2 completion
