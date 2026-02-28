# Plan: Fix iOS Mobile Web - Trend Chart Controls

## Context

The trend chart in the dashboard has two interactive controls that are not working on iOS mobile web:
1. **Period dropdown** - Select period (weekly/monthly/quarterly/yearly)
2. **Plot line type buttons** - Toggle between line, filled area (area), and stacked area (stacked)

A previous commit (532612c) fixed the download buttons for PNG/JPG export on iOS, but the period dropdown and chart type toggle buttons still don't work.

## Root Cause Analysis

### Primary Issue (Line 1225)
The outer `Box` wrapper contains `onMouseDown={(e) => e.stopPropagation()}` which prevents touch events from properly reaching child elements on iOS Safari.

**Code location**: `src/components/DashboardView/index.tsx:1225`
```tsx
<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }} onMouseDown={(e) => e.stopPropagation()}>
```

**Why it fails on iOS**:
- iOS Safari translates touch events to synthetic mouse events
- `stopPropagation()` on the parent container prevents these events from reaching child elements
- Touch interactions on child `<select>` and `<ToggleButton>` elements are intercepted

### Secondary Issue (Line 1235)
The `<select>` element has `height: 32px` which is below the iOS Human Interface Guidelines minimum of 44px for touch targets.

**Code location**: `src/components/DashboardView/index.tsx:1235`
```tsx
style={{ height: 32, ... }}
```

### Missing Enhancements
1. No `onTouchEnd` handlers on `<ToggleButton>` elements for explicit iOS touch support
2. Native `<select>` works with just `onChange` but could benefit from explicit touch handling

## Recommended Approach

### Changes to `src/components/DashboardView/index.tsx`

#### 1. Remove `onMouseDown` stopPropagation (Line 1225)

**Before:**
```tsx
<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }} onMouseDown={(e) => e.stopPropagation()}>
```

**After:**
```tsx
<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
```

**Rationale**: The `stopPropagation` was intended to prevent event bubbling but breaks iOS touch interactions. The outer Paper element already handles event containment.

#### 2. Increase `<select>` touch target height to 44px (Line 1235)

**Before:**
```tsx
style={{ ..., height: 32, ... }}
```

**After:**
```tsx
style={{ ..., height: 44, ... }}
```

**Rationale**: iOS Human Interface Guidelines specify minimum 44x44pt touch targets for reliable touch interaction.

#### 3. Add explicit touch handlers to ToggleButton elements (Lines 1263-1271)

**Before:**
```tsx
<ToggleButton value="line" title="Line Chart">
  <ShowChart />
</ToggleButton>
```

**After:**
```tsx
<ToggleButton
  value="line"
  title="Line Chart"
  onClick={(e) => handleChartTypeChange(e, 'line')}
  onTouchEnd={(e) => handleChartTypeChange(e, 'line')}
>
  <ShowChart />
</ToggleButton>
```

**Rationale**: Explicit `onTouchEnd` handler ensures touch events work reliably on iOS Safari alongside the existing `onChange` from ToggleButtonGroup.

## Implementation Details

### Critical Files

1. **`src/components/DashboardView/index.tsx`** (lines 1225-1273)
   - Remove `onMouseDown` stopPropagation from outer Box
   - Increase `<select>` height to 44px
   - Add `onClick` and `onTouchEnd` to each ToggleButton

### Handler Function

The existing `handleChartTypeChange` function at line 956-958 will be used directly:
```tsx
const handleChartTypeChange = (_: unknown, value: ChartType) => {
  if (value) setChartType(value);
};
```

## Verification

### Testing Steps

1. **Manual Testing on iOS Safari**
   - Open the dashboard on an iOS device (iPhone/iPad)
   - Tap the period dropdown - should open and allow selection
   - Tap each chart type button - should toggle the visualization
   - Verify selections persist and chart updates correctly

2. **Cross-Platform Testing**
   - Test on desktop browsers (Chrome, Firefox, Safari, Edge)
   - Test on Android mobile browsers (Chrome, Firefox)
   - Ensure fixes don't break existing functionality

3. **Touch Target Validation**
   - Verify select element has minimum 44x44px touch target
   - Verify toggle buttons have minimum 44x44px touch target (already in place)

4. **Regression Testing**
   - Test all other dashboard controls remain functional
   - Test download buttons still work (previously fixed in commit 532612c)

## Related Files (Read-Only Reference)

- `src/index.css` - Contains existing iOS touch optimization CSS
- `src/features/dashboard/charts/TrendChart/TrendChart.tsx` - Chart rendering component
- `src/features/dashboard/types/chart.ts` - Type definitions for ChartType and PeriodType

## Summary

This fix addresses the iOS mobile web issue by:
1. Removing the problematic `onMouseDown` stopPropagation that blocks touch events
2. Ensuring the select element meets iOS 44px minimum touch target size
3. Adding explicit touch handlers to toggle buttons for reliable iOS interaction

All changes are minimal and follow the same patterns used successfully in commit 532612c for the download buttons.
