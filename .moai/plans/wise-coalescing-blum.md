# Bug Fix: Second Selected Name Not Displayed with "Hide Deselected" Enabled

## Context

When selecting two unique names with time intervals, the second selected names are not displayed in the detailed data view when both "Auto-deselect empty/zero-value rows" and "Hide deselected" are enabled. When "Hide deselected" is disabled, the second name appears correctly.

## Root Cause

There is a **mismatch between index types** in the auto-deselect logic and the display filtering logic:

1. **Auto-deselect effect** (`DetailedDataView.tsx:519`):
   ```typescript
   filteredData.forEach((row, index) => {
     if (autoDeselectZeros && hasNoValidNumericValues(row, visibleDataColumnIds)) {
       return;
     }
     newSet.add(index);  // ❌ BUG: Uses array index (0, 1, 2, ...)
   });
   ```

2. **Display filtering** (`DetailedDataView.tsx:875`):
   ```typescript
   const displayData = hideDeselectedRows
     ? filteredAndSortedData.filter(row => includedRowIndices.has(row._stableIndex))  // ✅ Uses stable index
     : filteredAndSortedData;
   ```

**Why the bug occurs:**
- `index` from `forEach` is the position in the current `filteredData` array (resets to 0 when filteredData changes)
- `row._stableIndex` is the original index from the source data (preserved across filtering)
- When selecting a second name, `filteredData` is rebuilt with new rows, array indices reset, but stable indices are preserved
- The mismatch causes the check `includedRowIndices.has(row._stableIndex)` to fail for the second name's rows

## Recommended Fix

**File:** `/Users/chimin/Documents/script/excel-processor/src/components/DetailedDataView.tsx`

**Line 519:** Change from using array index to stable index:
```typescript
// Before (BUG):
newSet.add(index);

// After (FIX):
newSet.add(row._stableIndex);
```

## Verification

1. **Manual Test:**
   - Select two unique names with time intervals
   - Enable "Auto-deselect empty/zero-value rows"
   - Enable "Hide deselected"
   - Verify both names' rows are displayed in the detailed data view

2. **Edge Cases to Test:**
   - Selecting names in different orders
   - Selecting more than two names
   - Toggling "Hide deselected" on/off
   - Toggling "Auto-deselect" on/off
   - Exporting data (CSV/PDF) to ensure selection still applies correctly

## Impact

- **Files Modified:** 1 file (`DetailedDataView.tsx`)
- **Lines Changed:** 1 line (line 519)
- **Risk:** Low - simple variable change, consistent with existing pattern used elsewhere in the code
