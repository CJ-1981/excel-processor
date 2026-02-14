import type { NameMergeGroup, NameMergeState } from '../types';

const STORAGE_KEY = 'excel-processor-name-merges';

/**
 * Generate a unique ID for merge groups
 */
function generateId(): string {
  return `merge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Load name merge state from localStorage
 */
export function loadNameMergeState(): NameMergeState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        mergeGroups: parsed.mergeGroups || [],
        nameToGroupId: parsed.nameToGroupId || {},
      };
    }
  } catch (error) {
    console.warn('Could not load name merge state from localStorage:', error);
  }
  return {
    mergeGroups: [],
    nameToGroupId: {},
  };
}

/**
 * Save name merge state to localStorage
 */
export function saveNameMergeState(state: NameMergeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Could not save name merge state to localStorage:', error);
  }
}

/**
 * Apply name merging to data - replace original names with merged display names
 */
export function applyNameMerging(
  data: any[],
  nameColumn: string | null,
  mergeState: NameMergeState
): any[] {
  if (!nameColumn || mergeState.mergeGroups.length === 0) {
    return data;
  }

  return data.map(row => {
    const originalName = row[nameColumn];
    if (originalName === undefined || originalName === null) {
      return row;
    }

    const nameStr = String(originalName);
    const groupId = mergeState.nameToGroupId[nameStr];

    if (groupId) {
      const group = mergeState.mergeGroups.find(g => g.id === groupId);
      // Only merge if the group exists and is active
      if (group && group.active) {
        // Replace original name with merged display name
        return {
          ...row,
          [nameColumn]: group.displayName,
          _originalName: nameStr, // Keep track of original name
          _mergedDisplayName: group.displayName, // For filtering purposes
        };
      }
    }

    return row;
  });
}

/**
 * Get unique names with merge information
 * Returns array of { name, isMerged, mergeGroupId, mergeDisplayName }
 */
export function getUniqueNamesWithMergeInfo(
  data: any[],
  nameColumn: string | null,
  mergeState: NameMergeState
): Array<{
  name: string;
  isMerged: boolean;
  mergeGroupId?: string;
  mergeDisplayName?: string;
}> {
  if (!nameColumn) {
    return [];
  }

  const uniqueNames = new Set<string>();

  // Collect all unique names (including original names for merged ones)
  data.forEach(row => {
    const value = row[nameColumn];
    if (value !== undefined && value !== null && value !== '') {
      const nameStr = String(value);

      // If this name has been merged, also add the original name
      if (row._originalName) {
        uniqueNames.add(row._originalName);
      } else {
        uniqueNames.add(nameStr);
      }
    }
  });

  // Build result with merge info
  return Array.from(uniqueNames).sort().map(name => {
    const groupId = mergeState.nameToGroupId[name];
    if (groupId) {
      const group = mergeState.mergeGroups.find(g => g.id === groupId);
      return {
        name,
        isMerged: true,
        mergeGroupId: groupId,
        mergeDisplayName: group?.displayName,
      };
    }
    return {
      name,
      isMerged: false,
    };
  });
}
/**
 * Toggle the active state of a merge group
 */
export function toggleMergeGroupActive(
    state: NameMergeState,
    groupId: string
): NameMergeState {
  const groupIndex = state.mergeGroups.findIndex(g => g.id === groupId);
  if (groupIndex === -1) {
    console.warn(`Merge group ${groupId} not found`);
    return state;
  }

  const newGroups = [...state.mergeGroups];
  const currentGroup = newGroups[groupIndex];
  newGroups[groupIndex] = {
    ...currentGroup,
    active: !currentGroup.active,
  };

  const newState: NameMergeState = {
    ...state,
    mergeGroups: newGroups,
  };

  saveNameMergeState(newState);
  return newState;
}

/**
 * Create a new merge group
 */
export function createMergeGroup(
  state: NameMergeState,
  names: string[],
  displayName: string
): NameMergeState {
  if (names.length < 2) {
    console.warn('Need at least 2 names to create a merge group');
    return state;
  }

  // Check if any name is already in a merge group
  const alreadyMerged = names.find(name => state.nameToGroupId[name]);
  if (alreadyMerged) {
    console.warn(`Name "${alreadyMerged}" is already in a merge group`);
    return state;
  }

  const newGroup: NameMergeGroup = {
    id: generateId(),
    displayName,
    originalNames: names,
    createdAt: Date.now(),
    active: true,
  };

  const newNameToGroupId = { ...state.nameToGroupId };
  names.forEach(name => {
    newNameToGroupId[name] = newGroup.id;
  });

  const newState: NameMergeState = {
    mergeGroups: [...state.mergeGroups, newGroup],
    nameToGroupId: newNameToGroupId,
  };

  saveNameMergeState(newState);
  return newState;
}

/**
 * Split (undo) a merge group
 */
export function splitMergeGroup(
  state: NameMergeState,
  groupId: string
): NameMergeState {
  const group = state.mergeGroups.find(g => g.id === groupId);
  if (!group) {
    console.warn(`Merge group ${groupId} not found`);
    return state;
  }

  const newNameToGroupId = { ...state.nameToGroupId };
  group.originalNames.forEach(name => {
    delete newNameToGroupId[name];
  });

  const newState: NameMergeState = {
    mergeGroups: state.mergeGroups.filter(g => g.id !== groupId),
    nameToGroupId: newNameToGroupId,
  };

  saveNameMergeState(newState);
  return newState;
}

/**
 * Update the display name of a merge group
 */
export function updateMergeGroupDisplayName(
  state: NameMergeState,
  groupId: string,
  newName: string
): NameMergeState {
  const groupIndex = state.mergeGroups.findIndex(g => g.id === groupId);
  if (groupIndex === -1) {
    console.warn(`Merge group ${groupId} not found`);
    return state;
  }

  const newGroups = [...state.mergeGroups];
  newGroups[groupIndex] = {
    ...newGroups[groupIndex],
    displayName: newName,
  };

  const newState: NameMergeState = {
    ...state,
    mergeGroups: newGroups,
  };

  saveNameMergeState(newState);
  return newState;
}

/**
 * Add a name to an existing merge group
 */
export function addNameToMergeGroup(
  state: NameMergeState,
  groupId: string,
  name: string
): NameMergeState {
  // Check if name is already in a group
  if (state.nameToGroupId[name]) {
    console.warn(`Name "${name}" is already in a merge group`);
    return state;
  }

  const groupIndex = state.mergeGroups.findIndex(g => g.id === groupId);
  if (groupIndex === -1) {
    console.warn(`Merge group ${groupId} not found`);
    return state;
  }

  const newGroups = [...state.mergeGroups];
  newGroups[groupIndex] = {
    ...newGroups[groupIndex],
    originalNames: [...newGroups[groupIndex].originalNames, name],
  };

  const newNameToGroupId = {
    ...state.nameToGroupId,
    [name]: groupId,
  };

  const newState: NameMergeState = {
    mergeGroups: newGroups,
    nameToGroupId: newNameToGroupId,
  };

  saveNameMergeState(newState);
  return newState;
}

/**
 * Remove a name from a merge group
 * If the group would have only 1 name left, the group is dissolved
 */
export function removeNameFromMergeGroup(
  state: NameMergeState,
  groupId: string,
  name: string
): NameMergeState {
  const group = state.mergeGroups.find(g => g.id === groupId);
  if (!group) {
    console.warn(`Merge group ${groupId} not found`);
    return state;
  }

  const newOriginalNames = group.originalNames.filter(n => n !== name);

  // If only 1 name left, dissolve the group
  if (newOriginalNames.length <= 1) {
    return splitMergeGroup(state, groupId);
  }

  const groupIndex = state.mergeGroups.findIndex(g => g.id === groupId);
  const newGroups = [...state.mergeGroups];
  newGroups[groupIndex] = {
    ...group,
    originalNames: newOriginalNames,
  };

  const newNameToGroupId = { ...state.nameToGroupId };
  delete newNameToGroupId[name];

  const newState: NameMergeState = {
    mergeGroups: newGroups,
    nameToGroupId: newNameToGroupId,
  };

  saveNameMergeState(newState);
  return newState;
}

/**
 * Set the active state for all merge groups
 */
export function setAllMergeGroupsActive(
  state: NameMergeState,
  active: boolean
): NameMergeState {
  const newGroups = state.mergeGroups.map(group => ({
    ...group,
    active: active,
  }));

  const newState: NameMergeState = {
    ...state,
    mergeGroups: newGroups,
  };

  saveNameMergeState(newState);
  return newState;
}

/**
 * Clear all merge groups
 */
export function clearAllMergeGroups(): NameMergeState {
  const newState: NameMergeState = {
    mergeGroups: [],
    nameToGroupId: {},
  };
  saveNameMergeState(newState);
  return newState;
}

/**
 * Get the merged name for a given name (if it exists)
 */
export function getMergedName(
  originalName: string,
  mergeState: NameMergeState
): string | null {
  const groupId = mergeState.nameToGroupId[originalName];
  if (groupId) {
    const group = mergeState.mergeGroups.find(g => g.id === groupId);
    return group?.displayName || null;
  }
  return null;
}
