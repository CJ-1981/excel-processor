/**
 * ChartExport Component
 * Provides export button for downloading charts as PNG/JPG
 */

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Download } from '@mui/icons-material';
import type { ExportFormat } from '../../types/chart';

export interface ChartExportProps {
  chartId: string;
  onExport: (chartId: string, format: ExportFormat) => Promise<void>;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const ChartExport: React.FC<ChartExportProps> = ({
  chartId,
  onExport,
  label = 'Download as PNG',
  icon = <Download fontSize="small" />,
  disabled = false,
  className,
}) => {
  const handleExportPNG = async () => {
    await onExport(chartId, 'png');
  };

  const handleExportJPG = async () => {
    await onExport(chartId, 'jpg');
  };

  return (
    <React.Fragment>
      <Tooltip title={label}>
        <span>
          <IconButton size="small" onClick={handleExportPNG} disabled={disabled} className={className}>
            {icon}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Download as JPG">
        <span>
          <IconButton size="small" onClick={handleExportJPG} disabled={disabled} className={className}>
            <Download fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </React.Fragment>
  );
};

export default ChartExport;
