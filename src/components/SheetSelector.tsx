import React, { useState } from 'react';
import {
  Box, Typography, Checkbox, FormControlLabel, Button, Paper, List, ListItem,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ParsedFile } from '../types.ts';
import { useTranslation } from 'react-i18next';

interface SheetSelectorProps {
  files: ParsedFile[];
  onMerge: (selectedSheetIdentifiers: string[]) => void;
  onCancel: () => void;
}

const ITEM_WIDTH = 250; // Fixed width for each file's column

const SheetSelector: React.FC<SheetSelectorProps> = ({ files, onMerge, onCancel }) => {
  const { t } = useTranslation();

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
    <Paper elevation={0} sx={{ p: 0, mt: 4, width: '100%', overflow: 'hidden', border: '1px solid', borderColor: 'hairline', borderRadius: 1 }}>
      <Box sx={{ p: 3, bgcolor: 'surface', borderBottom: '1px solid', borderColor: 'hairline' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>{t('sheetSelector.title')}</Typography>
        <Typography variant="body1" color="text.secondary">
          {t('sheetSelector.description')}
        </Typography>
      </Box>

      {/* Horizontal Scroll for files */}
      <Box sx={{ p: 3, display: 'flex', overflowX: 'auto', gap: 3, bgcolor: 'background.default' }}>
        {files.map((file) => {
          const fileSheetIdentifiers = file.sheets.map(sheet => `${file.fileName}::${sheet.sheetName}`);
          const isAllSelectedInFile = fileSheetIdentifiers.every(id => selectedSheets.includes(id)) && fileSheetIdentifiers.length > 0;
          const isIndeterminateInFile = fileSheetIdentifiers.some(id => selectedSheets.includes(id)) && !isAllSelectedInFile;

          return (
            <Paper 
              key={file.fileName} 
              elevation={0}
              variant="outlined" 
              sx={{ 
                width: ITEM_WIDTH, 
                p: 0, 
                maxHeight: 400, 
                overflow: 'hidden',
                borderRadius: 2,
                borderColor: isAllSelectedInFile || isIndeterminateInFile ? 'primary.main' : 'hairline',
                bgcolor: isAllSelectedInFile ? 'surfaceFeature' : 'background.paper',
                transition: 'all 0.2s ease'
              }}
            >
              <Box sx={{ p: 1.5, bgcolor: isAllSelectedInFile ? alpha('#00ED64', 0.1) : 'surface', borderBottom: '1px solid', borderColor: 'hairline' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={isAllSelectedInFile}
                      indeterminate={isIndeterminateInFile}
                      onChange={(e) => handleToggleAllInFile(file.fileName, file.sheets, e.target.checked)}
                    />
                  }
                  label={<Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }} noWrap>{file.fileName}</Typography>}
                  sx={{ m: 0, width: '100%' }}
                />
              </Box>
              <List dense disablePadding sx={{ maxHeight: 340, overflowY: 'auto' }}>
                {file.sheets.map((sheet) => {
                  const sheetIdentifier = `${file.fileName}::${sheet.sheetName}`;
                  const isSheetSelected = selectedSheets.includes(sheetIdentifier);
                  return (
                    <ListItem
                      key={sheetIdentifier}
                      disablePadding
                      onClick={() => handleToggle(sheetIdentifier)}
                      sx={{
                        cursor: 'pointer',
                        px: 1,
                        backgroundColor: isSheetSelected ? alpha('#00ED64', 0.15) : 'transparent',
                        '&:hover': {
                          backgroundColor: isSheetSelected ? alpha('#00ED64', 0.2) : 'action.hover',
                        },
                        borderBottom: '1px solid',
                        borderColor: 'hairlineSoft'
                      }}
                    >
                      <Checkbox
                        edge="start"
                        checked={isSheetSelected}
                        size="small"
                      />
                      <Typography
                        variant="body2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSameNamedSheetAcrossFiles(sheet.sheetName);
                        }}
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { textDecoration: 'underline', color: 'primary.main' }, 
                          flexGrow: 1, 
                          ml: 1,
                          fontWeight: isSheetSelected ? 600 : 400,
                          color: isSheetSelected ? 'primary.main' : 'text.primary'
                        }}
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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, p: 3, bgcolor: 'surface', borderTop: '1px solid', borderColor: 'hairline' }}>
        <Button 
          variant="outlined" 
          onClick={onCancel}
          sx={{ borderColor: 'hairlineStrong', color: 'text.secondary' }}
        >
          {t('sheetSelector.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleMergeClick}
          disabled={selectedSheets.length === 0}
          sx={{ px: 4, fontWeight: 700 }}
        >
          {t('sheetSelector.merge', { count: selectedSheets.length })}
        </Button>
      </Box>
    </Paper>
  );
};

export default SheetSelector;
