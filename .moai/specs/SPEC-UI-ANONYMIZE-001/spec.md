# SPEC-UI-ANONYMIZE-001: Name Anonymization Enhancement

## Metadata

| Field | Value |
|-------|-------|
| **SPEC ID** | SPEC-UI-ANONYMIZE-001 |
| **Title** | Name Anonymization Enhancement - X-axis and Tooltip Privacy |
| **Created** | 2026-02-16 |
| **Status** | Planned |
| **Priority** | High |
| **Assigned** | - |
| **Domain** | UI/Privacy |
| **Related SPECs** | - |

## Environment

### Project Context

**Project:** Excel Data Processor - Client-side web application for Excel/CSV data analysis

**Current Implementation:**
- The `anonymizeNames` toggle exists in `DashboardView/index.tsx`
- State is persisted via localStorage (`excel-processor-anonymize-names`)
- Currently passed to `TopDonorsChart` component only
- When enabled, hides names on X-axis labels (shows numeric indices instead)

**Technology Stack:**
- React 19 with TypeScript
- Recharts 2.x for chart visualization
- Material-UI (MUI) for UI components
- LocalStorage for state persistence

### Current Limitations

1. **Partial Anonymization:** Only X-axis labels are anonymized, tooltips still show actual names
2. **Inconsistent Coverage:** Not all chart types respect the anonymize flag
3. **No Visual Feedback:** Users cannot easily identify when anonymization is active
4. **Limited Scope:** Only TopDonorsChart implements anonymization

## Assumptions

### Technical Assumptions

1. **Recharts Flexibility:** Recharts supports custom tooltip content and formatter functions
2. **Performance:** Anonymization logic adds negligible overhead (<5ms per render)
3. **State Management:** Existing localStorage persistence is sufficient
4. **Chart Types:** All 6 chart types display user-identifiable information

### User Behavior Assumptions

1. **Privacy Concern:** Users presenting data in public settings need name hiding
2. **Data Exploration:** Users want to see actual names on hover for private analysis
3. **Toggle Persistence:** User preference should persist across sessions
4. **Visual Clarity:** Anonymization mode should be visually apparent

### Constraint Analysis

**Hard Constraints:**
- Must maintain backward compatibility with existing anonymizeNames state
- Cannot break existing chart functionality
- Must support all 6 chart types consistently

**Soft Constraints:**
- Implementation should be modular and reusable
- Code changes should follow existing patterns
- Performance impact should be minimal

## Requirements

### Functional Requirements (EARS Format)

#### Ubiquitous Requirements

**REQ-001:** The system **shall** persist the anonymize names toggle state across browser sessions using localStorage.

**REQ-002:** The system **shall** apply anonymization consistently across all chart types when the toggle is enabled.

#### Event-Driven Requirements

**REQ-003:** **WHEN** the anonymize toggle is enabled, the system **shall** hide all person-identifiable names on X-axis labels across all charts.

**REQ-004:** **WHEN** the anonymize toggle is enabled and the user hovers over a chart data point, the system **shall** display the actual name in the tooltip (hover reveals).

**REQ-005:** **WHEN** the anonymize toggle is disabled, the system **shall** display actual names on both X-axis labels and tooltips.

#### State-Driven Requirements

**REQ-006:** **IF** the chart data contains no name information, the system **shall** not apply anonymization logic.

**REQ-007:** **IF** the dataset has fewer than 3 items, the system **shall** still apply anonymization when toggle is enabled.

**REQ-007a:** **IF** the X-axis displays non-name values (e.g., calendar weeks, time periods, numerical ranges), the system **shall** skip anonymization for those labels while still applying anonymization to name-based tooltips when applicable.

#### Optional Requirements

**REQ-008:** **WHERE POSSIBLE**, the system **shall** provide visual feedback (e.g., icon or badge) indicating anonymization is active.

**REQ-009:** **WHERE POSSIBLE**, the system **shall** support custom anonymization formats (e.g., "Person #1", "Contributor A", "Entity 001").

### Non-Functional Requirements

**NFR-001:** Anonymization logic **shall** not increase render time by more than 10ms per chart.

**NFR-002:** Implementation **shall** follow existing code patterns and maintain 85%+ test coverage.

**NFR-003:** Changes **shall** be backward compatible with existing localStorage state.

**NFR-004:** Code **shall** follow TRUST 5 quality principles (Tested, Readable, Unified, Secured, Trackable).

## Specifications

### Affected Components

#### 1. TopDonorsChart (`src/features/dashboard/charts/TopDonorsChart/`)

**Current Behavior:**
- X-axis anonymization implemented (lines 239-247)
- Tooltip shows actual names (lines 50-80)

**Required Changes:**
- Modify `CustomTooltip` component to accept `anonymize` prop
- When `anonymize=true`, display "Person #{index}" in tooltip label
- Keep numeric indices on X-axis (existing behavior)

#### 2. ParetoChart (`src/features/dashboard/charts/ParetoChart/`)

**Current Behavior:**
- X-axis anonymization implemented (lines 99-107)
- Tooltip shows actual category names (lines 141-153)

**Required Changes:**
- Add `anonymize` prop to `ParetoChartProps` interface
- Modify Tooltip formatter to respect anonymize flag
- When `anonymize=true`, display "Contributor #{index}" in tooltip

#### 3. TrendChart (`src/features/dashboard/charts/TrendChart/`)

**Current Behavior:**
- No anonymization support
- X-axis shows period labels (dates/time periods)
- Tooltip shows series names and values

**Required Changes:**
- No changes required
- Rationale: X-axis shows calendar weeks/time periods, not person names
- Tooltip shows aggregated values by time period, no individual names
- Document rationale in component comments

#### 4. DistributionHistogram (`src/features/dashboard/charts/DistributionHistogram/`)

**Current Behavior:**
- No anonymization support
- X-axis shows value ranges (not person names)
- Tooltip shows range labels and counts

**Required Changes:**
- No changes needed (X-axis shows ranges, not names)
- Document rationale in component comments

#### 5. RangeDistributionCharts (`src/features/dashboard/charts/RangeDistributionCharts/`)

**Current Behavior:**
- Needs investigation for current anonymization support

**Required Changes:**
- Add `anonymize` prop if displaying category names
- Apply consistent anonymization pattern

#### 6. StatisticsTable (`src/features/dashboard/charts/StatisticsTable/`)

**Current Behavior:**
- Displays data in tabular format
- May show entity names in rows

**Required Changes:**
- Add `anonymize` prop to replace entity names with indices
- Consider hover-to-reveal pattern for table rows

### Data Flow

```
User toggles anonymizeNames
  ↓
DashboardView state updates
  ↓
State persisted to localStorage
  ↓
anonymize prop passed to all chart components
  ↓
Each chart component:
  - X-axis: Display "Person #N" instead of names
  - Tooltip: Display actual name (hover reveals)
```

### Technical Implementation Details

#### Anonymization Pattern

```typescript
// X-axis formatter (existing pattern in TopDonorsChart)
tickFormatter={
  anonymize
    ? ((_value: unknown, index: number) => {
        const n = chartData.length;
        const step = n > 40 ? 10 : n > 20 ? 5 : n > 10 ? 2 : 1;
        return index % step === 0 ? `#${index + 1}` : '';
      })
    : undefined
}

// Tooltip formatter (new pattern)
const CustomTooltip = ({ active, payload, label, anonymize }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const displayLabel = anonymize ? `Person #${payload[0].payload.index + 1}` : label;
    return (
      <Box>
        <Typography>{displayLabel}</Typography>
        {/* Rest of tooltip content */}
      </Box>
    );
  }
  return null;
};
```

#### Prop Interface Updates

```typescript
export interface ChartProps {
  // Existing props...
  anonymize?: boolean; // Add to all relevant charts
}
```

### Backward Compatibility

- Default `anonymize` prop to `false` for all charts
- Existing localStorage state `excel-processor-anonymize-names` remains unchanged
- Charts without `anonymize` prop continue to work (default: false)

## Success Criteria

### Completion Definition

**SPEC-UI-ANONYMIZE-001 is complete when:**

1. All 6 chart types respect the `anonymize` prop
2. X-axis labels hide names when anonymize is enabled
3. Tooltips show actual names on hover (hover-to-reveal)
4. localStorage persistence works across sessions
5. Visual feedback indicates anonymization mode (optional)
6. Unit tests achieve 85%+ coverage for new code
7. Zero regressions in existing functionality
8. Performance impact <10ms per chart render

### Verification Metrics

- **Code Coverage:** ≥85% for new anonymization logic
- **Performance:** <10ms overhead for anonymization formatting
- **Compatibility:** 100% backward compatible with existing state
- **Test Pass Rate:** 100% of acceptance criteria passing

## Traceability

| Requirement ID | Component | Test Scenario |
|---------------|-----------|---------------|
| REQ-001 | DashboardView | TC-001: Toggle persistence across sessions |
| REQ-002 | All Charts | TC-002: Consistent anonymization across charts |
| REQ-003 | TopDonorsChart, ParetoChart | TC-003: X-axis shows ID numbers when anonymized |
| REQ-004 | All Charts with tooltips | TC-004: Tooltip hover reveals name |
| REQ-005 | All Charts | TC-005: Disable shows actual names |
| REQ-006 | All Charts | TC-006: No-op for non-name data |
| REQ-007 | All Charts | TC-007: Small dataset handling |
| REQ-007a | TrendChart, Histogram | TC-008: Non-name X-axis values (calendar weeks, ranges) ignored |

## References

### Related Documentation

- `src/features/dashboard/charts/TopDonorsChart/TopDonorsChart.tsx` - Current implementation reference
- `src/components/DashboardView/index.tsx` - State management and localStorage logic
- Product Documentation: `.moai/project/product.md` - Privacy requirements

### Technical Standards

- TRUST 5 Framework: `.moai/config/sections/quality.yaml`
- EARS Specification: moai-workflow-spec skill
- React Testing Library patterns
- Recharts documentation: https://recharts.org/

---

**SPEC Version:** 1.0
**Last Updated:** 2026-02-16
**Next Review:** After implementation completion
