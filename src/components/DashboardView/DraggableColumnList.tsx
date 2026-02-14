// src/components/DashboardView/DraggableColumnList.tsx
import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Typography,
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

const DraggableColumnList: React.FC<DraggableColumnListProps> = ({
  options,
  selected,
  columnMapping,
  onToggle,
  onReorder,
  onSelectAll,
  onDeselectAll,
}) => {

  const isAllSelected = selected.length === options.length && options.length > 0;
  const isIndeterminate = selected.length > 0 && selected.length < options.length;

  // Items that are selected and should be draggable
  const draggableItems = selected.map((column) => ({ column })); // No need for originalIndex here

  // Items that are not selected but are available
  const unselectedOptions = options.filter(col => !selected.includes(col));

  return (
    <DragDropContext onDragEnd={onReorder}>
      <List dense sx={{ width: '100%' }}>
        {/* Select All / Deselect All */}
        <ListItem disablePadding>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Checkbox
              edge="start"
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={isAllSelected ? onDeselectAll : onSelectAll}
              tabIndex={-1}
              disableRipple
              size="small"
            />
          </ListItemIcon>
          <ListItemText
            primary={isAllSelected ? 'Deselect All' : 'Select All'}
            primaryTypographyProps={{ variant: 'body2' }}
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            sx={{ cursor: 'pointer' }}
          />
        </ListItem>

        <Droppable droppableId="selected-columns">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              <Typography variant="caption" sx={{ ml: 2, mt: 1, display: 'block' }}>Selected & Reorderable</Typography>
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
                      disablePadding
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Checkbox
                          edge="start"
                          checked={true} // Always checked as these are "selected" items
                          onChange={() => onToggle(item.column)}
                          tabIndex={-1}
                          disableRipple
                          size="small"
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
            </div>
          )}
        </Droppable>

        {unselectedOptions.length > 0 && (
          <List dense sx={{ width: '100%', mt: 2 }}>
            <Typography variant="caption" sx={{ ml: 2, mt: 1, display: 'block' }}>Available (Click to Select)</Typography>
            {unselectedOptions.map((column) => (
              <ListItem disablePadding key={column}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Checkbox
                    edge="start"
                    checked={false} // Always unchecked as these are "unselected" items
                    onChange={() => onToggle(column)}
                    tabIndex={-1}
                    disableRipple
                    size="small"
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
        )}
      </List>
    </DragDropContext>
  );
};

export default DraggableColumnList;