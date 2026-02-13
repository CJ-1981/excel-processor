import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Collapse,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MergeType as MergeTypeIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import type { NameMergeState, NameMergeGroup } from '../types';
import {
  createMergeGroup,
  splitMergeGroup,
  updateMergeGroupDisplayName,
  clearAllMergeGroups,
} from '../utils/nameMergeUtils';

interface NameMergingPanelProps {
  availableNames: string[];
  mergeState: NameMergeState;
  onMergeStateChange: (state: NameMergeState) => void;
}

const NameMergingPanel: React.FC<NameMergingPanelProps> = ({
  availableNames,
  mergeState,
  onMergeStateChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<NameMergeGroup | null>(null);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  // Collapse the whole panel by default; persist user choice in localStorage
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('excel-processor-name-merge-collapsed');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem('excel-processor-name-merge-collapsed', String(collapsed));
    } catch {}
  }, [collapsed]);

  // Filter names based on search term
  const filteredNames = useMemo(() => {
    if (!searchTerm) return availableNames;
    const term = searchTerm.toLowerCase();
    return availableNames.filter(name => name.toLowerCase().includes(term));
  }, [availableNames, searchTerm]);

  // Get merge info for a name
  const getMergeInfo = useCallback((name: string) => {
    const groupId = mergeState.nameToGroupId[name];
    if (groupId) {
      const group = mergeState.mergeGroups.find(g => g.id === groupId);
      return group;
    }
    return null;
  }, [mergeState]);

  // Handle name selection toggle
  const handleToggleName = (name: string) => {
    setSelectedNames(prev => {
      if (prev.includes(name)) {
        return prev.filter(n => n !== name);
      }
      return [...prev, name];
    });
  };

  // Handle select all visible names (add to existing selection)
  const handleSelectAll = () => {
    const unmergedNames = filteredNames.filter(name => !getMergeInfo(name));
    // Add new names to existing selection, avoiding duplicates
    const newSelection = new Set([...selectedNames, ...unmergedNames]);
    setSelectedNames(Array.from(newSelection));
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedNames([]);
  };

  // Open create dialog
  const handleOpenCreateDialog = () => {
    if (selectedNames.length < 2) return;
    // Suggest a default name based on first selected name
    setNewDisplayName(`${selectedNames[0]} Family`);
    setCreateDialogOpen(true);
  };

  // Create merge group
  const handleCreateMerge = () => {
    if (selectedNames.length < 2 || !newDisplayName.trim()) return;

    const newState = createMergeGroup(
      mergeState,
      selectedNames,
      newDisplayName.trim()
    );
    onMergeStateChange(newState);
    setSelectedNames([]);
    setNewDisplayName('');
    setCreateDialogOpen(false);
  };

  // Split merge group
  const handleSplitGroup = (groupId: string) => {
    const newState = splitMergeGroup(mergeState, groupId);
    onMergeStateChange(newState);
  };

  // Open edit dialog
  const handleOpenEditDialog = (group: NameMergeGroup) => {
    setEditingGroup(group);
    setNewDisplayName(group.displayName);
    setEditDialogOpen(true);
  };

  // Update display name
  const handleUpdateDisplayName = () => {
    if (!editingGroup || !newDisplayName.trim()) return;

    const newState = updateMergeGroupDisplayName(
      mergeState,
      editingGroup.id,
      newDisplayName.trim()
    );
    onMergeStateChange(newState);
    setEditingGroup(null);
    setNewDisplayName('');
    setEditDialogOpen(false);
  };

  // Toggle group expansion
  const handleToggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Clear all merges
  const handleClearAll = () => {
    if (mergeState.mergeGroups.length === 0) return;
    const newState = clearAllMergeGroups();
    onMergeStateChange(newState);
  };

  // Count merged names
  const mergedNamesCount = useMemo(() => {
    return Object.keys(mergeState.nameToGroupId).length;
  }, [mergeState.nameToGroupId]);

  // Get unmerged names from filtered list
  const unmergedFilteredNames = useMemo(() => {
    return filteredNames.filter(name => !getMergeInfo(name));
  }, [filteredNames, getMergeInfo]);

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={() => setCollapsed(!collapsed)} sx={{ mr: 0.5 }} aria-label={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
          <MergeTypeIcon color="primary" />
          <Typography variant="h6">Name Merging</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>(optional)</Typography>
          {mergeState.mergeGroups.length > 0 && (
            <Chip
              size="small"
              label={`${mergeState.mergeGroups.length} group${mergeState.mergeGroups.length > 1 ? 's' : ''}`}
              color="primary"
              variant="outlined"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        {!collapsed && mergeState.mergeGroups.length > 0 && (
          <Button
            size="small"
            color="error"
            startIcon={<ClearIcon />}
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        )}
      </Box>

      {!collapsed && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Group similar donor names into a single display name. This affects statistics and dashboards only.
        </Alert>
      )}

      {!collapsed && mergeState.mergeGroups.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {mergedNamesCount} name{mergedNamesCount > 1 ? 's' : ''} merged into {mergeState.mergeGroups.length} group{mergeState.mergeGroups.length > 1 ? 's' : ''}.
          Merged names will be treated as a single entity in statistics.
        </Alert>
      )}

      <Collapse in={!collapsed} timeout="auto" unmountOnExit>
        {/* Search and Create Button */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            disabled={selectedNames.length < 2}
          >
            Merge ({selectedNames.length})
          </Button>
        </Box>

        {/* Selection Actions */}
        {filteredNames.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Button
              size="small"
              onClick={handleSelectAll}
              disabled={unmergedFilteredNames.length === 0}
            >
              Add All Unmerged
            </Button>
            <Button
              size="small"
              onClick={handleClearSelection}
              disabled={selectedNames.length === 0}
            >
              Clear Selection
            </Button>
          </Box>
        )}

        {/* Available Names List */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Available Names ({filteredNames.length})
        </Typography>
        <List
          dense
          sx={{
            maxHeight: 200,
            overflow: 'auto',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          {filteredNames.length === 0 ? (
            <ListItem>
              <ListItemText
                secondary={searchTerm ? 'No names match your search' : 'No names available'}
              />
            </ListItem>
          ) : (
            filteredNames.map((name) => {
              const mergeInfo = getMergeInfo(name);
              const isSelected = selectedNames.includes(name);

              return (
                <ListItemButton
                  key={name}
                  dense
                  selected={isSelected}
                  onClick={() => !mergeInfo && handleToggleName(name)}
                  disabled={!!mergeInfo}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox
                      edge="start"
                      checked={isSelected}
                      disabled={!!mergeInfo}
                      size="small"
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={name}
                    secondary={mergeInfo ? `Merged as: ${mergeInfo.displayName}` : undefined}
                    secondaryTypographyProps={{
                      color: 'primary',
                      variant: 'caption',
                    }}
                  />
                </ListItemButton>
              );
            })
          )}
        </List>

        {/* Merge Groups Section */}
        {mergeState.mergeGroups.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Merge Groups
            </Typography>
            <List dense>
              {mergeState.mergeGroups.map((group) => (
                <Box key={group.id}>
                  <ListItem
                    secondaryAction={
                      <Box>
                        <Tooltip title="Edit display name">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleOpenEditDialog(group)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Split (undo merge)">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleSplitGroup(group.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemButton onClick={() => handleToggleGroup(group.id)}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {expandedGroups.has(group.id) ? (
                          <ExpandLessIcon fontSize="small" />
                        ) : (
                          <ExpandMoreIcon fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={group.displayName}
                        secondary={`${group.originalNames.length} name${group.originalNames.length > 1 ? 's' : ''}`}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={expandedGroups.has(group.id)}>
                    <List dense sx={{ pl: 4 }}>
                      {group.originalNames.map((name) => (
                        <ListItem key={name} dense>
                          <ListItemText
                            primary={name}
                            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              ))}
            </List>
          </>
        )}

        {/* Create Merge Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
          <DialogTitle>Create Merge Group</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Merging {selectedNames.length} names into a single entity.
            </Typography>
            <TextField
              autoFocus
              label="Display Name"
              fullWidth
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" color="text.secondary">
              Names to merge:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {selectedNames.map((name) => (
                <Chip key={name} label={name} size="small" />
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateMerge}
              variant="contained"
              disabled={!newDisplayName.trim()}
            >
              Create Merge
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Display Name Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Edit Display Name</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              label="Display Name"
              fullWidth
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateDisplayName}
              variant="contained"
              disabled={!newDisplayName.trim()}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Collapse>
    </Paper>
  );
};

export default NameMergingPanel;
