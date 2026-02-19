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
  Switch,
  DialogContentText,
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
  toggleMergeGroupActive,
  setAllMergeGroupsActive,
} from '../utils/nameMergeUtils';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<NameMergeGroup | null>(null);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
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
      // A name is only considered merged if its group is active
      if (group && group.active) {
        return group;
      }
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
  
  // Toggle merge group active state
  const handleToggleActive = (groupId: string) => {
    const newState = toggleMergeGroupActive(mergeState, groupId);
    onMergeStateChange(newState);
  };

  // Toggle all merge groups active state
  const handleToggleAllActive = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = setAllMergeGroupsActive(mergeState, event.target.checked);
    onMergeStateChange(newState);
  };

  // Determine if all groups are active or none are active
  const allGroupsActive = useMemo(() => mergeState.mergeGroups.every(group => group.active), [mergeState.mergeGroups]);


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
    setClearConfirmOpen(false);
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
          <Typography variant="h6">{t('nameMerging.title')}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>{t('nameMerging.optional')}</Typography>
          {mergeState.mergeGroups.length > 0 && (
            <Chip
              size="small"
              label={t('nameMerging.groups', { count: mergeState.mergeGroups.length })}
              color="primary"
              variant="outlined"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
      </Box>

      {!collapsed && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('nameMerging.description')}
        </Alert>
      )}

      {!collapsed && mergeState.mergeGroups.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('nameMerging.summary', { count: mergedNamesCount, groupCount: mergeState.mergeGroups.length })}
        </Alert>
      )}

      <Collapse in={!collapsed} timeout="auto" unmountOnExit>
        {/* Search and Create Button */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            placeholder={t('nameMerging.searchPlaceholder')}
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
            {t('nameMerging.merge', { count: selectedNames.length })}
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
              {t('nameMerging.addAllUnmerged')}
            </Button>
            <Button
              size="small"
              onClick={handleClearSelection}
              disabled={selectedNames.length === 0}
            >
              {t('nameMerging.clearSelection')}
            </Button>
          </Box>
        )}

        {/* Available Names List */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {t('nameMerging.availableNames', { count: filteredNames.length })}
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
                secondary={searchTerm ? t('nameMerging.noMatch') : t('nameMerging.noNames')}
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
                    secondary={mergeInfo ? t('nameMerging.mergedAs', { displayName: mergeInfo.displayName }) : undefined}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('nameMerging.mergeGroups')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {mergeState.mergeGroups.length > 0 && (
                  <Tooltip title={allGroupsActive ? t('nameMerging.deactivateAll') : t('nameMerging.activateAll')}>
                    <Switch
                      edge="end"
                      size="small"
                      checked={allGroupsActive}
                      onChange={handleToggleAllActive}
                      inputProps={{ 'aria-label': 'toggle all merge groups' }}
                    />
                  </Tooltip>
                )}
                <Tooltip title={t('nameMerging.clearAll')}>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<ClearIcon />}
                    onClick={() => setClearConfirmOpen(true)}
                  >
                    {t('nameMerging.clearAll')}
                  </Button>
                </Tooltip>
              </Box>
            </Box>
            <List dense>
              {mergeState.mergeGroups.map((group) => (
                <Box key={group.id} sx={{ opacity: group.active ? 1 : 0.5 }}>
                  <ListItem
                    secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title={group.active ? t('nameMerging.deactivate') : t('nameMerging.activate')}>
                          <Switch
                            edge="end"
                            size="small"
                            checked={group.active}
                            onChange={() => handleToggleActive(group.id)}
                            inputProps={{ 'aria-label': 'toggle merge group' }}
                          />
                        </Tooltip>
                        <Tooltip title={t('nameMerging.edit')}>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleOpenEditDialog(group)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('nameMerging.split')}>
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
                        secondary={t('nameMerging.namesCount', { count: group.originalNames.length })}
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
          <DialogTitle>{t('nameMerging.createGroup')}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('nameMerging.mergeDescription', { count: selectedNames.length })}
            </Typography>
            <TextField
              autoFocus
              label={t('nameMerging.displayName')}
              fullWidth
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" color="text.secondary">
              {t('nameMerging.namesToMerge')}:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {selectedNames.map((name) => (
                <Chip key={name} label={name} size="small" />
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>{t('nameMerging.cancel')}</Button>
            <Button
              onClick={handleCreateMerge}
              variant="contained"
              disabled={!newDisplayName.trim()}
            >
              {t('nameMerging.createMerge')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Display Name Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>{t('nameMerging.editDisplayName')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              label={t('nameMerging.displayName')}
              fullWidth
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>{t('nameMerging.cancel')}</Button>
            <Button
              onClick={handleUpdateDisplayName}
              variant="contained"
              disabled={!newDisplayName.trim()}
            >
              {t('nameMerging.save')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Clear All Confirmation Dialog */}
        <Dialog
            open={clearConfirmOpen}
            onClose={() => setClearConfirmOpen(false)}
        >
          <DialogTitle>{t('nameMerging.confirmClearAll')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t('nameMerging.confirmClearAllMessage')}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClearConfirmOpen(false)}>{t('nameMerging.cancel')}</Button>
            <Button onClick={handleClearAll} color="error" variant="contained">
              {t('nameMerging.clearAll')}
            </Button>
          </DialogActions>
        </Dialog>
      </Collapse>
    </Paper>
  );
};

export default NameMergingPanel;
