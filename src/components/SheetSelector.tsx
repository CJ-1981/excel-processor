import React, { useState } from 'react';
import {
  Box, Typography, Checkbox, FormControlLabel, Button, Paper, List, ListItem, ListSubheader,
  Divider,
} from '@mui/material';
import type { ParsedFile } from '../types.ts';

interface SheetSelectorProps {
  files: ParsedFile[];
  onMerge: (selectedSheetIdentifiers: string[]) => void;
  onCancel: () => void;
}

const ITEM_WIDTH = 250; // Fixed width for each file's column

const SheetSelector: React.FC<SheetSelectorProps> = ({ files, onMerge, onCancel }) => {
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);

  const handleToggle = (sheetIdentifier: string) => {
    const currentIndex = selectedSheets.indexOf(sheetIdentifier);
    const newSelected = [...selectedSheets];

    if (currentIndex === -1) {
      newSelected.push(sheetIdentifier);
    } else {
      newSelected.splice(currentIndex, 1);
    }
    setSelectedSheets(newSelected);
  };

  const handleToggleAllInFile = (fileName: string, sheetsInFile: { sheetName: string; data: any[]; }[], checked: boolean) => {
    let newSelected = [...selectedSheets];
    const fileSheetIdentifiers = sheetsInFile.map(sheet => `${fileName}::${sheet.sheetName}`);

    if (checked) {
      // Add all sheets from this file that aren't already selected
      fileSheetIdentifiers.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
    } else {
      // Remove all sheets from this file
      newSelected = newSelected.filter(id => !fileSheetIdentifiers.includes(id));
    }
    setSelectedSheets(newSelected);
  };

  const handleToggleSameNamedSheetAcrossFiles = (sheetName: string) => {
    let newSelected = [...selectedSheets];
    const allIdentifiersForThisSheetName = files.flatMap(file =>
      file.sheets
        .filter(sheet => sheet.sheetName === sheetName)
        .map(sheet => `${file.fileName}::${sheet.sheetName}`)
    );

    // If all are currently selected, deselect them. Otherwise, select them.
    const allCurrentlySelected = allIdentifiersForThisSheetName.every(id => selectedSheets.includes(id));

    if (allCurrentlySelected) {
      newSelected = newSelected.filter(id => !allIdentifiersForThisSheetName.includes(id));
    } else {
      allIdentifiersForThisSheetName.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
    }
    setSelectedSheets(newSelected);
  };

  const handleMergeClick = () => {
    if (selectedSheets.length > 0) {
      onMerge(selectedSheets);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4, width: '100%', overflow: 'hidden' }}>
      <Typography variant="h6" gutterBottom>Select Sheets to Merge</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select one or more sheets from the uploaded files to combine into a single dataset.
        Clicking a sheet name will select all sheets with that name across all files.
      </Typography>

      {/* Horizontal Scroll for files */}
      <Box sx={{ display: 'flex', overflowX: 'auto', py: 1, '& > div': { flexShrink: 0, mr: 2 } }}>
        {files.map((file) => {
          const fileSheetIdentifiers = file.sheets.map(sheet => `${file.fileName}::${sheet.sheetName}`);
          const isAllSelectedInFile = fileSheetIdentifiers.every(id => selectedSheets.includes(id)) && fileSheetIdentifiers.length > 0;
          const isIndeterminateInFile = fileSheetIdentifiers.some(id => selectedSheets.includes(id)) && !isAllSelectedInFile;

          return (
            <Paper key={file.fileName} variant="outlined" sx={{ width: ITEM_WIDTH, p: 1, maxHeight: 400, overflowY: 'auto' }}>
              <ListSubheader component="div" sx={{ p: 0, lineHeight: 'normal', bgcolor: 'background.paper', position: 'sticky', top: 0, zIndex: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={isAllSelectedInFile}
                      indeterminate={isIndeterminateInFile}
                      onChange={(e) => handleToggleAllInFile(file.fileName, file.sheets, e.target.checked)}
                    />
                  }
                  label={<Typography variant="subtitle2" noWrap>{file.fileName}</Typography>}
                  sx={{ m: 0, width: '100%', '.MuiFormControlLabel-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                />
              </ListSubheader>
              <Divider sx={{ my: 0.5 }} />
              <List dense disablePadding>
                {file.sheets.map((sheet) => {
                  const sheetIdentifier = `${file.fileName}::${sheet.sheetName}`;
                  const isSheetSelected = selectedSheets.includes(sheetIdentifier);
                  return (
                    <ListItem
                      key={sheetIdentifier}
                      disablePadding
                      onClick={() => handleToggle(sheetIdentifier)} // Individual toggle on item click
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: isSheetSelected ? 'action.selected' : 'transparent',
                        '&:hover': {
                          backgroundColor: isSheetSelected ? 'action.selected' : 'action.hover',
                        },
                      }}
                    >
                      <Checkbox
                        edge="start" // Position checkbox at the start
                        checked={isSheetSelected}
                        tabIndex={-1}
                        disableRipple
                        // No onChange here, as ListItem's onClick handles it
                      />
                      <Typography
                        variant="body2"
                        onClick={(e) => { // This onClick is for cross-file selection
                          e.stopPropagation(); // Prevent ListItem's onClick from firing
                          handleToggleSameNamedSheetAcrossFiles(sheet.sheetName);
                        }}
                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' }, flexGrow: 1, ml: 1 }} // Added flexGrow to push checkbox away
                      >
                        {sheet.sheetName}
                      </Typography>
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button variant="text" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleMergeClick}
          disabled={selectedSheets.length === 0}
        >
          Merge {selectedSheets.length > 0 ? `(${selectedSheets.length})` : ''} Sheets
        </Button>
      </Box>
    </Paper>
  );
};

export default SheetSelector;
