# Plan: Multi-line X-Axis Tick Labels with Padding for Trend Chart

## Context

The trend chart in the dashboard displays weekly period labels like `2025-W06 (Feb 09)` on the x-axis. There are two issues:

1. **Single-line display**: Labels are currently on one line, causing crowding
2. **Tight spacing**: Tick labels are too close together horizontally

The user wants:
- Two-line display: `2025-W06` on line 1, `(Feb 09)` on line 2
- Increased horizontal padding between tick labels

## Root Cause Analysis

### Current Implementation

1. **Data Source** (`src/features/dashboard/utils/chartCalculations.ts:199-201`):
   ```typescript
   weekly: convertToArray(weeklyAggregated, (key, entry) =>
     `${key} (${fmtMonthDay((entry as AggregatedEntry & { latest: Date }).latest || entry.date)})`
   ),
   ```
   This creates a single-line string: `"2025-W06 (Feb 09)"`

2. **Chart Component** (`src/features/dashboard/charts/TrendChart/TrendChart.tsx:45-70`):
   The `CustomAxisTick` component already has logic to split on `\n`:
   ```typescript
   const newlineIndex = label.indexOf('\n');
   if (newlineIndex !== -1) {
     const week = label.substring(0, newlineIndex);
     const date = label.substring(newlineIndex + 1);
     // Renders two lines with different styling
   }
   ```

### Problem

The data formatting logic creates a single-line string without a newline character, so the `CustomAxisTick` component's multi-line logic never executes.

## Solution

Modify the weekly period label formatting in `chartCalculations.ts` to insert a newline character (`\n`) between the week identifier and the date.

## Files to Modify

1. **`src/features/dashboard/utils/chartCalculations.ts`** (Line 199-201)
   - Change the label formatter for weekly data to use `\n` instead of ` `

2. **`src/features/dashboard/charts/TrendChart/TrendChart.tsx`** (Line 285-292)
   - Adjust XAxis `interval` prop to increase spacing between ticks

## Implementation

### Change 1: Add Newline in `chartCalculations.ts`

**Current code (lines 199-201):**
```typescript
weekly: convertToArray(weeklyAggregated, (key, entry) =>
  `${key} (${fmtMonthDay((entry as AggregatedEntry & { latest: Date }).latest || entry.date)})`
),
```

**Updated code:**
```typescript
weekly: convertToArray(weeklyAggregated, (key, entry) =>
  `${key}\n(${fmtMonthDay((entry as AggregatedEntry & { latest: Date }).latest || entry.date)})`
),
```

The only change is replacing the space before `(` with a newline character `\n`.

### Change 2: Increase Tick Padding in `TrendChart.tsx`

**Current code (lines 285-292):**
```typescript
<XAxis
  dataKey="period"
  stroke={theme.palette.text.primary}
  tick={<CustomAxisTick />}
  tickLine={{ stroke: theme.palette.text.secondary }}
  height={50}
  interval="preserveStartEnd"
/>
```

**Updated code:**
```typescript
<XAxis
  dataKey="period"
  stroke={theme.palette.text.primary}
  tick={<CustomAxisTick />}
  tickLine={{ stroke: theme.palette.text.secondary }}
  height={50}
  interval={0}  // Show every nth tick (0 = auto, 1 = skip every other, 2 = show every 3rd, etc.)
/>
```

**Alternative approach (more control):**
```typescript
<XAxis
  dataKey="period"
  stroke={theme.palette.text.primary}
  tick={<CustomAxisTick />}
  tickLine={{ stroke: theme.palette.text.secondary }}
  height={50}
  interval="preserveStartEnd"
  minTickGap={30}  // Add minimum gap between ticks in pixels
/>
```

### Result

This will produce period labels like:
```
2025-W06
(Feb 09)
```

The existing `CustomAxisTick` component will automatically:
- Split on the `\n` character
- Render `2025-W06` on line 1 with 11px font
- Render `(Feb 09)` on line 2 with 9px font and 70% opacity
- Apply proper vertical spacing with `dy="14"`

For padding, either:
- Use `interval={n}` to skip ticks (shows every nth tick)
- Use `minTickGap={30}` to enforce minimum pixel spacing between ticks
- Recharts will automatically skip overlapping ticks based on the gap

## Verification

1. **Visual Testing:**
   - Run the application and navigate to the dashboard
   - Switch period type to "Weekly"
   - Verify x-axis labels display on two lines
   - Check that labels have proper horizontal spacing and don't overlap
   - Test with different data ranges (few weeks vs many weeks)

2. **Padding Tuning:**
   - If labels still overlap, try `interval={1}` (skip every other tick)
   - If too sparse, try `interval={0}` (auto) or `interval="preserveStartEnd"`
   - Adjust `minTickGap` value as needed (default is 5, try 20-40)

3. **Edge Cases:**
   - Ensure monthly, quarterly, and yearly period types are unaffected
   - Verify the chart height (50px) is sufficient for two-line labels
   - Check that padding adjustment doesn't break other period types

4. **No Breaking Changes:**
   - Changes only affect weekly period labels formatting
   - Other period types (monthly, quarterly, yearly) use the default formatter
   - The `CustomAxisTick` component logic remains unchanged

## Testing Notes

- The `CustomAxisTick` component already supports multi-line via `\n` splitting
- Only the data source formatting and XAxis config need modification
- No TypeScript changes needed (string template literals work with `\n`)
- Recharts `interval` prop accepts:
  - `0` or `'auto'`: Automatically skip overlapping ticks
  - `'preserveStartEnd'`: Always show first and last ticks
  - `'preserveStart'`: Always show first tick
  - Number `n`: Show every nth tick (1 = skip every other)
