import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as numberToWords from 'number-to-words';
import { loadKoreanFont, containsKorean, setFontForText, isKoreanFontLoaded } from '../../utils/pdfFonts';
import type {
  PDFTemplate,
  PDFGenerationContext,
  HeaderSection,
  TextSection,
  SummarySection,
  TableSection,
  FooterSection,
  LabeledFieldSection,
  TextBlockSection,
  CheckboxFieldSection,
  BoxSection,
  CustomDataTableSection,
} from '../../types';

export async function generatePDF(
  template: PDFTemplate,
  context: PDFGenerationContext
): Promise<void> {
  const doc = new jsPDF({
    orientation: template.page.orientation,
    format: template.page.format,
  });

  // Load Korean font for proper character rendering
  await loadKoreanFont(doc);

  let yPosition = template.page.margins.top;

  // Process each section
  for (const section of template.sections) {
    switch (section.type) {
      case 'header':
        yPosition = renderHeader(doc, section as HeaderSection, context, yPosition);
        break;
      case 'text':
        yPosition = renderText(doc, section as TextSection, context, yPosition);
        break;
      case 'summary':
        yPosition = renderSummary(doc, section as SummarySection, context, yPosition);
        break;
      case 'table':
        yPosition = await renderTable(doc, section as TableSection, context, yPosition);
        break;
      case 'customDataTable':
        yPosition = await renderCustomDataTable(doc, section as CustomDataTableSection, context, yPosition);
        break;
      case 'footer':
        renderFooter(doc, section as FooterSection, context);
        break;
      // NEW: absolute positioned sections (don't affect yPosition)
      case 'labeledField':
        renderLabeledField(doc, section as LabeledFieldSection, context);
        break;
      case 'textBlock':
        renderTextBlock(doc, section as TextBlockSection, context);
        break;
      case 'checkbox':
        renderCheckbox(doc, section as CheckboxFieldSection, context);
        break;
      case 'box':
        renderBox(doc, section as BoxSection, context, { doc, context });
        break;
      // Page break
      case 'pageBreak':
        doc.addPage();
        yPosition = template.page.margins.top;
        break;
      // Spacer to advance Y position
      case 'spacer':
        yPosition += (section as any).height;
        break;
    }
  }

  // Download PDF
  const fileName = context.selectedNames.length > 1
    ? 'report.pdf'
    : `${context.selectedNames[0]}_report.pdf`;

  doc.save(fileName);
}

// Variable substitution
function substituteVariables(text: string, context: PDFGenerationContext): string {
  let result = text
    .replace(/\{\{names\}\}/g, context.selectedNames.join(', '))
    .replace(/\{\{timestamp\}\}/g, new Date().toLocaleString())
    .replace(/\{\{rowCount\}\}/g, String(context.includedIndices.size))
    .replace(/\{\{sourceFiles\}\}/g, context.sourceFiles.join(', '))
    .replace(/\{\{sourceSheets\}\}/g, context.sourceSheets.join(', '))
    .replace(/\{\{pageNum\}\}/g, '')  // Placeholder for footer
    .replace(/\{\{totalPages\}\}/g, '');

  // Support customFields
  if (context.customFields) {
    for (const [key, value] of Object.entries(context.customFields)) {
      const regex = new RegExp(`\\{\\{customFields\\.${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
  }

  return result;
}

// Number to words conversion
function convertValue(value: unknown, toWords: boolean, capitalize?: string): string {
  if (!toWords || typeof value !== 'number') {
    return String(value ?? '');
  }

  const words = numberToWords.toWords(value);
  switch (capitalize) {
    case 'upper':
      return words.toUpperCase();
    case 'lower':
      return words.toLowerCase();
    case 'title':
      return words.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
    default:
      return words; // Keep default format
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

function renderHeader(
  doc: jsPDF,
  section: HeaderSection,
  context: PDFGenerationContext,
  startY: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = startY;

  const title = substituteVariables(section.title, context);
  doc.setFontSize(section.fontSize);
  setFontForText(doc, title, true);

  let xPosition: number;
  switch (section.alignment) {
    case 'center':
      xPosition = pageWidth / 2;
      doc.text(title, xPosition, yPosition, { align: 'center' });
      break;
    case 'right':
      xPosition = pageWidth - doc.internal.pageSize.getWidth() / 2;
      doc.text(title, xPosition, yPosition, { align: 'right' });
      break;
    default: // left
      xPosition = 0;
      doc.text(title, xPosition + doc.internal.pageSize.getWidth() * 0.1, yPosition, { align: 'left' });
  }

  yPosition += section.fontSize * 0.5;

  if (section.subtitle) {
    const subtitle = substituteVariables(section.subtitle, context);
    doc.setFontSize(section.fontSize * 0.7);
    setFontForText(doc, subtitle, false);

    switch (section.alignment) {
      case 'center':
        doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
        break;
      case 'right':
        doc.text(subtitle, pageWidth - 10, yPosition, { align: 'right' });
        break;
      default: // left
        doc.text(subtitle, doc.internal.pageSize.getWidth() * 0.1, yPosition, { align: 'left' });
    }

    yPosition += section.fontSize * 0.5;
  }

  return yPosition + 10;
}

function renderText(
  doc: jsPDF,
  section: TextSection,
  context: PDFGenerationContext,
  startY: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const content = substituteVariables(section.content, context);

  doc.setFontSize(section.fontSize);
  setFontForText(doc, content, false);

  let xPosition: number;
  switch (section.alignment) {
    case 'center':
      xPosition = pageWidth / 2;
      doc.text(content, xPosition, startY + section.margin.top, { align: 'center' });
      break;
    case 'right':
      xPosition = pageWidth - 10;
      doc.text(content, xPosition, startY + section.margin.top, { align: 'right' });
      break;
    default: // left
      doc.text(content, doc.internal.pageSize.getWidth() * 0.1, startY + section.margin.top, { align: 'left' });
  }

  return startY + section.margin.top + section.margin.bottom;
}

function renderSummary(
  doc: jsPDF,
  section: SummarySection,
  context: PDFGenerationContext,
  startY: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = startY;

  if (section.showRowCounts || section.showColumnTotals) {
    // Draw background
    const boxWidth = pageWidth * 0.8;
    const boxHeight = 15;
    const boxX = (pageWidth - boxWidth) / 2;

    doc.setFillColor(...hexToRgb(section.backgroundColor));
    doc.rect(boxX, yPosition, boxWidth, boxHeight, 'F');

    doc.setFontSize(section.fontSize);
    doc.setFont('helvetica', 'normal');

    let summaryText = '';
    if (section.showRowCounts) {
      summaryText = `Total Rows: ${context.includedIndices.size}`;
    }

    if (section.showColumnTotals && Object.keys(context.columnTotals).length > 0) {
      if (summaryText) summaryText += ' | ';
      const totalsText = Object.entries(context.columnTotals)
        .map(([col, total]) => `${col}: ${total}`)
        .join(', ');
      summaryText += `Totals: ${totalsText}`;
    }

    if (summaryText) {
      doc.text(summaryText, pageWidth / 2, yPosition + boxHeight / 2 + 2, { align: 'center' });
    }

    yPosition += boxHeight + 5;
  }

  return yPosition;
}

async function renderTable(
  doc: jsPDF,
  section: TableSection,
  context: PDFGenerationContext,
  startY: number
): Promise<number> {
  // Build table data
  const headers = context.visibleHeaders.map(h => h.label);

  const body = context.data
    .filter((_, idx) => context.includedIndices.has(idx))
    .map(row => {
      return context.visibleHeaders.map(header => {
        let value = row[header.id] ?? '';

        // Apply number-to-words conversion if configured
        if (section.columnConversions?.[header.label]?.toWords) {
          value = convertValue(
            value,
            true,
            section.columnConversions![header.label]!.capitalize
          );
        }

        return String(value);
      });
    });

  // Check if data contains Korean text
  const hasKorean = body.some(row =>
    row.some(cell => containsKorean(String(cell)))
  ) || headers.some(h => containsKorean(h));

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: body,
    startY: startY,
    styles: {
      fontSize: section.options.fontSize,
      cellPadding: section.options.cellPadding,
      lineColor: hexToRgb(section.options.borderColor),
      lineWidth: section.options.borderWidth,
      font: hasKorean && isKoreanFontLoaded() ? 'NotoSansKR' : 'helvetica',
    },
    headStyles: {
      fillColor: hexToRgb(section.options.headerBackgroundColor),
      textColor: hexToRgb(section.options.headerTextColor),
      fontStyle: 'bold',
    },
    alternateRowStyles: section.options.alternateRowColors ? {
      fillColor: hexToRgb(section.options.alternateRowColor2),
    } : undefined,
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

async function renderCustomDataTable(
  doc: jsPDF,
  section: CustomDataTableSection,
  context: PDFGenerationContext,
  startY: number
): Promise<number> {
  // Process body data with optional variable substitution
  const body = section.rows.map(row =>
    row.map(cell =>
      section.substituteVariables !== false
        ? substituteVariables(String(cell), context)
        : String(cell)
    )
  );

  // Check if data contains Korean text
  const hasKorean = body.some(row =>
    row.some(cell => containsKorean(String(cell)))
  ) || (section.headers && section.headers.some(h => containsKorean(h)));

  // Generate table
  autoTable(doc, {
    head: section.options.showHeaders ? [section.headers] : undefined,
    body: body,
    startY: startY,
    styles: {
      fontSize: section.options.fontSize,
      cellPadding: section.options.cellPadding,
      lineColor: hexToRgb(section.options.borderColor),
      lineWidth: section.options.borderWidth,
      font: hasKorean && isKoreanFontLoaded() ? 'NotoSansKR' : 'helvetica',
    },
    headStyles: section.options.showHeaders ? {
      fillColor: hexToRgb(section.options.headerBackgroundColor),
      textColor: hexToRgb(section.options.headerTextColor),
      fontStyle: 'bold',
    } : undefined,
    alternateRowStyles: section.options.alternateRowColors ? {
      fillColor: hexToRgb(section.options.alternateRowColor2),
    } : undefined,
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

function renderLabeledField(
  doc: jsPDF,
  section: LabeledFieldSection,
  context: PDFGenerationContext
): void {
  const label = substituteVariables(section.label, context);
  const value = substituteVariables(section.value, context);
  const separator = section.separator ?? ': ';

  doc.setFontSize(section.labelFontSize ?? section.fontSize ?? 10);
  setFontForText(doc, label, section.boldLabel !== false);
  doc.text(label, section.x, section.y);

  const labelWidth = section.labelWidth ?? doc.getTextWidth(label + separator);
  const valueX = section.x + labelWidth;

  doc.setFontSize(section.fontSize ?? 10);
  setFontForText(doc, value, section.boldValue === true);
  doc.text(separator + value, valueX, section.y);
}

function renderTextBlock(
  doc: jsPDF,
  section: TextBlockSection,
  context: PDFGenerationContext
): void {
  const content = substituteVariables(section.content, context);
  doc.setFontSize(section.fontSize ?? 10);
  setFontForText(doc, content, section.bold === true);

  const textOptions: any = { maxWidth: section.width };
  if (section.align === 'center') textOptions.align = 'center';
  else if (section.align === 'right') textOptions.align = 'right';
  else if (section.align === 'justify') textOptions.align = 'justify';
  else textOptions.align = 'left';

  doc.text(content, section.x, section.y, textOptions);
}

function renderCheckbox(
  doc: jsPDF,
  section: CheckboxFieldSection,
  context: PDFGenerationContext
): void {
  const boxSize = section.boxSize ?? 10;
  const checked = typeof section.checked === 'string'
    ? substituteVariables(section.checked, context) === 'true'
    : section.checked;
  const label = substituteVariables(section.label, context);

  // Calculate available width for text (page width - right margin - checkbox position)
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxTextWidth = pageWidth - 15 - (section.x + boxSize + 5);

  // Draw checkbox square
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(section.x, section.y - boxSize/2, boxSize, boxSize);

  // Draw X if checked
  if (checked) {
    doc.line(section.x, section.y - boxSize/2, section.x + boxSize, section.y + boxSize/2);
    doc.line(section.x + boxSize, section.y - boxSize/2, section.x, section.y + boxSize/2);
  }

  // Draw label with text wrapping
  doc.setFontSize(section.fontSize ?? 10);
  setFontForText(doc, label, false);

  // Split text into lines that fit within maxTextWidth
  const lines = doc.splitTextToSize(label, maxTextWidth);

  // For multi-line text, the first line is at yPosition, subsequent lines are below
  // We need to use the checkbox y as the baseline for the first line
  const lineHeight = (section.fontSize ?? 10) * 0.4; // Line height factor

  // Draw all lines, first line aligned with checkbox, rest below
  lines.forEach((line: string, index: number) => {
    const lineY = section.y + (index * lineHeight);
    doc.text(line, section.x + boxSize + 5, lineY);
  });
}

function renderBox(
  doc: jsPDF,
  section: BoxSection,
  _context: PDFGenerationContext,
  _generatorRef: { doc: jsPDF; context: PDFGenerationContext }
): void {
  // Draw box border and background
  if (section.backgroundColor) {
    doc.setFillColor(...hexToRgb(section.backgroundColor));
    doc.rect(section.x, section.y, section.width, section.height, 'F');
  }

  if (section.border !== false) {
    doc.setDrawColor(...hexToRgb(section.borderColor ?? '#000000'));
    doc.setLineWidth(section.borderWidth ?? 0.5);
    doc.rect(section.x, section.y, section.width, section.height);
  }

  // Render nested sections (positioned relative to box)
  // For simplicity, nested sections maintain their absolute positions
  // but are rendered within the box's coordinate space
  // TODO: Implement nested section rendering when needed
}

function renderFooter(
  doc: jsPDF,
  section: FooterSection,
  context: PDFGenerationContext
): void {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(section.fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);

    const footerY = pageHeight - 10;

    if (section.left) {
      const leftText = substituteVariables(section.left, context);
      setFontForText(doc, leftText, false);
      doc.text(leftText, 10, footerY, { align: 'left' });
    }

    if (section.center) {
      let centerText = substituteVariables(section.center, context);
      centerText = centerText
        .replace(/\{\{pageNum\}\}/g, String(i))
        .replace(/\{\{totalPages\}\}/g, String(pageCount));
      setFontForText(doc, centerText, false);
      doc.text(centerText, doc.internal.pageSize.getWidth() / 2, footerY, { align: 'center' });
    }

    if (section.right) {
      const rightText = substituteVariables(section.right, context);
      setFontForText(doc, rightText, false);
      doc.text(rightText, doc.internal.pageSize.getWidth() - 10, footerY, { align: 'right' });
    }
  }
}
