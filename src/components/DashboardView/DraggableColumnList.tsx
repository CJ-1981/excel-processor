// src/components/DashboardView/DraggableColumnList.tsx
import React, { useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import DragHandleIcon from '@mui/icons-material/DragHandle';

interface DraggableColumnListProps {
  options: string[]; // All available columns
  selected: string[]; // Currently selected columns
  columnMapping: Record<string, string>;
  onToggle: (column: string) => void;
  onReorder: (result: any) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

// Component definition (will be memoized on export)
const DraggableColumnListInner = ({
  options,
  selected,
  columnMapping,
  onToggle,
  onReorder,
  onSelectAll,
  onDeselectAll,
}: DraggableColumnListProps) => {
  // Track component mount
  useEffect(() => {
    console.time('[DraggableColumnList] Component mount');
    return () => {
      console.timeEnd('[DraggableColumnList] Component mount');
    };
  }, []);

  const isAllSelected = selected.length === options.length && options.length > 0;
  const isIndeterminate = selected.length > 0 && selected.length < options.length;

  // No render tracking - remove to prevent infinite loops

  // Items that are selected and should be draggable
  const draggableItems = selected.map((column) => ({ column })); // No need for originalIndex here

  // Items that are not selected but are available
  const unselectedOptions = options.filter(col => !selected.includes(col));

  return (
    <DragDropContext onDragEnd={onReorder}>

      <List dense sx={{ width: '100%' }}>
        {/* Select All / Deselect All */}
        <ListItem
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            px: 2
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Checkbox
              edge="start"
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={isAllSelected ? onDeselectAll : onSelectAll}
              size="small"
              sx={{ p: 0.5 }}
            />
          </ListItemIcon>
          <ListItemText
            primary={isAllSelected ? 'Deselect All' : 'Select All'}
            primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            sx={{ cursor: 'pointer' }}
          />
        </ListItem>

        <Droppable droppableId="selected-columns">
          {(provided) => (
            <Box {...provided.droppableProps} ref={provided.innerRef} sx={{ px: 2, pt: 1, pb: 0.5 }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Selected & Reorderable
              </Typography>
              {draggableItems.map((item, index) => (
                <Draggable key={item.column} draggableId={item.column} index={index}>
                  {(provided) => (
                    <ListItem
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="drag handle"
                          {...provided.dragHandleProps}
                          size="small"
                        >
                          <DragHandleIcon fontSize="small" />
                        </IconButton>
                      }
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox
                          edge="start"
                          checked={true}
                          onChange={() => onToggle(item.column)}
                          size="small"
                          sx={{ p: 0.5 }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={columnMapping[item.column] || item.column}
                        primaryTypographyProps={{ variant: 'body2' }}
                        onClick={() => onToggle(item.column)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </ListItem>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>

        {unselectedOptions.length > 0 && (
          <Box sx={{ px: 2, pt: 2 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
              Available (Click to Select)
            </Typography>
            <List dense sx={{ width: '100%', p: 0 }}>
              {unselectedOptions.map((column) => (
                <ListItem key={column} sx={{ borderRadius: 1, mb: 0.5, '&:hover': { bgcolor: 'action.hover' } }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox
                      edge="start"
                      checked={false}
                      onChange={() => onToggle(column)}
                      size="small"
                      sx={{ p: 0.5 }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={columnMapping[column] || column}
                    primaryTypographyProps={{ variant: 'body2' }}
                    onClick={() => onToggle(column)}
                    sx={{ cursor: 'pointer' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </List>
    </DragDropContext>
  );
};

// Export memoized component (uses default reference equality)
const DraggableColumnList = React.memo(DraggableColumnListInner);

export default DraggableColumnList;