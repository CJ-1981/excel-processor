/**
 * useChartExport Hook
 * Manages chart export functionality using html2canvas
 */

import { useCallback } from 'react';
import type { ExportFormat } from '../types/chart';

export interface UseChartExportResult {
  exportChart: (chartId: string, format?: ExportFormat) => Promise<void>;
}


/**
 * Hook to export charts as PNG/JPG images
 */
export function useChartExport(): UseChartExportResult {
  const exportChart = useCallback(async (chartId: string, format: ExportFormat = 'png') => {
    const wrapper = document.querySelector(`[data-chart-id="${chartId}"]`) as HTMLElement | null;
    if (!wrapper) {
      console.warn(`Chart wrapper not found for id: ${chartId}`);
      return;
    }

    // Dynamic import to avoid SSR issues
    const html2canvas = (await import('html2canvas')).default;

    // If this panel contains multiple charts, capture the entire wrapper via html2canvas
    const svgAll = Array.from(wrapper.querySelectorAll('svg')) as SVGSVGElement[];
    if (svgAll.length > 1) {
      try {
        const canvas = await html2canvas(wrapper, {
          backgroundColor: '#ffffff',
          scale: Math.max(1, Math.floor(window.devicePixelRatio || 1)),
          useCORS: true,
        });
        downloadCanvas(canvas, chartId, format);
      } catch (error) {
        console.error('Failed to export chart wrapper:', error);
      }
      return;
    }

    // Pick the largest SVG inside the wrapper
    const svgEl = svgAll.length > 0
      ? svgAll.reduce((best, el) => {
          const r = el.getBoundingClientRect();
          const area = (r.width || 0) * (r.height || 0);
          const br = best.getBoundingClientRect();
          const bArea = (br.width || 0) * (br.height || 0);
          return area > bArea ? el : best;
        }, svgAll[0])
      : null;

    // If no SVG exists, fallback to html2canvas of wrapper
    if (!svgEl) {
      try {
        const canvas = await html2canvas(wrapper, {
          backgroundColor: '#ffffff',
          scale: Math.max(1, Math.floor(window.devicePixelRatio || 1)),
          useCORS: true,
        });
        downloadCanvas(canvas, chartId, format);
      } catch (error) {
        console.error('Failed to export chart wrapper:', error);
      }
      return;
    }

    // Measure displayed size of the chart area
    const rect = wrapper.getBoundingClientRect();
    let displayWidth = Math.max(1, Math.round(rect.width));
    let displayHeight = Math.max(1, Math.round(rect.height));

    if (!displayWidth || !displayHeight) {
      const vb = svgEl.getAttribute('viewBox');
      if (vb) {
        const parts = vb.split(/\s+/).map(Number);
        if (parts.length === 4) {
          displayWidth = parts[2];
          displayHeight = parts[3];
        }
      } else {
        try {
          const bbox = (svgEl as any).getBBox?.();
          if (bbox && bbox.width && bbox.height) {
            displayWidth = bbox.width;
            displayHeight = bbox.height;
          }
        } catch {
          // Ignore getBBox errors
        }
      }
      if (!displayWidth || !displayHeight) {
        displayWidth = wrapper.offsetWidth || 800;
        displayHeight = wrapper.offsetHeight || 400;
      }
    }

    // Clone and enforce explicit size + namespaces for reliable rasterization
    const cloned = svgEl.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    cloned.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    cloned.setAttribute('width', `${displayWidth}`);
    cloned.setAttribute('height', `${displayHeight}`);

    if (!cloned.getAttribute('viewBox')) {
      cloned.setAttribute('viewBox', `0 0 ${displayWidth} ${displayHeight}`);
    }

    const svgData = new XMLSerializer().serializeToString(cloned);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      URL.revokeObjectURL(svgUrl);
      return;
    }

    const scale = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    img.onload = () => {
      try {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
        downloadCanvas(canvas, chartId, format);
      } finally {
        URL.revokeObjectURL(svgUrl);
      }
    };

    img.onerror = async () => {
      URL.revokeObjectURL(svgUrl);
      // Fallback: rasterize the wrapper via html2canvas
      try {
        const canvas = await html2canvas(wrapper, {
          backgroundColor: '#ffffff',
          scale: Math.max(1, Math.floor(window.devicePixelRatio || 1)),
          useCORS: true,
        });
        downloadCanvas(canvas, chartId, format);
      } catch (error) {
        console.error('Failed to export chart (fallback):', error);
      }
    };

    img.src = svgUrl;
  }, []);

  return { exportChart };
}

/**
 * Download canvas as image file
 */
function downloadCanvas(canvas: HTMLCanvasElement, chartId: string, format: ExportFormat): void {
  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart-${chartId}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, mime, 0.92);
}
