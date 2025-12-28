/**
 * PDF Generation Engine for Reference Sheets
 * Creates print-optimized PDFs for overview and project documentation
 */

import PDFDocument from 'pdfkit';
import { OverviewData, ProjectExportData } from '@shared/types';
import { PAGE, FONTS, COLORS, SPACING, OVERVIEW_TABLE, PRESET_LAYOUT } from './pdfLayouts';

/**
 * Generate overview sheet PDF with all projects
 * Returns a Buffer containing the PDF data
 */
export async function generateOverviewSheet(data: OverviewData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: PAGE.MARGIN.TOP,
          bottom: PAGE.MARGIN.BOTTOM,
          left: PAGE.MARGIN.LEFT,
          right: PAGE.MARGIN.RIGHT,
        },
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(FONTS.TITLE.size).text('Multigrain Sample Manager', { align: 'center' });

      doc.moveDown(0.3);
      doc.fontSize(FONTS.HEADING.size).text('Project Overview', {
        align: 'center',
      });

      doc.moveDown(1);

      // Summary info
      doc.fontSize(FONTS.BODY.size);
      doc.fillColor(COLORS.GRAY);
      doc.text(`SD Card: ${data.rootPath}`);
      doc.text(`Total Projects: ${data.totalProjects}`);

      doc.moveDown(1);

      // Draw overview table
      drawOverviewTable(doc, data.projects);

      // Add footer to all pages
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(FONTS.SMALL.size)
          .fillColor(COLORS.LIGHT_GRAY)
          .text(
            `Generated ${new Date().toLocaleDateString()} - Page ${i + 1} of ${range.count}`,
            PAGE.MARGIN.LEFT,
            PAGE.HEIGHT - PAGE.MARGIN.BOTTOM + 10,
            {
              width: PAGE.CONTENT_WIDTH,
              align: 'center',
            }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate project sheet PDF with samples and presets
 * Returns a Buffer containing the PDF data
 */
export async function generateProjectSheet(data: ProjectExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: PAGE.MARGIN.TOP,
          bottom: PAGE.MARGIN.BOTTOM,
          left: PAGE.MARGIN.LEFT,
          right: PAGE.MARGIN.RIGHT,
        },
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Project header
      drawProjectHeader(doc, data.project);

      // Samples section
      doc.moveDown(1);
      doc.fontSize(FONTS.HEADING.size).fillColor(COLORS.BLACK);
      doc.text('Available Samples');
      doc.moveDown(0.5);

      if (data.samples.length > 0) {
        drawSamplesTable(doc, data.samples);
      } else {
        doc.fontSize(FONTS.BODY.size).fillColor(COLORS.GRAY);
        doc.text('No samples in this project');
      }

      // Presets section
      checkPageBreak(doc, 200);
      doc.moveDown(1.5);
      doc.fontSize(FONTS.HEADING.size).fillColor(COLORS.BLACK);
      doc.text('Presets');
      doc.moveDown(0.5);

      if (data.presets.length > 0) {
        drawPresetsTable(doc, data.presets);
      } else {
        doc.fontSize(FONTS.BODY.size).fillColor(COLORS.GRAY);
        doc.text('No presets in this project');
      }

      // Add footer to all pages
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(FONTS.SMALL.size)
          .fillColor(COLORS.LIGHT_GRAY)
          .text(
            `Generated ${new Date().toLocaleDateString()} - Page ${i + 1} of ${range.count}`,
            PAGE.MARGIN.LEFT,
            PAGE.HEIGHT - PAGE.MARGIN.BOTTOM + 10,
            {
              width: PAGE.CONTENT_WIDTH,
              align: 'center',
            }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Draw overview table with project list
 */
function drawOverviewTable(
  doc: typeof PDFDocument.prototype,
  projects: OverviewData['projects']
): void {
  const startX = PAGE.MARGIN.LEFT;
  let currentY = doc.y;

  // Table header
  doc.fontSize(FONTS.SUBHEADING.size).fillColor(COLORS.BLACK);

  const headerY = currentY;
  doc.text('Bank/Pos', startX, headerY, { width: OVERVIEW_TABLE.COL_BANK_POS, continued: false });
  doc.text('Project Name', startX + OVERVIEW_TABLE.COL_BANK_POS, headerY, {
    width: OVERVIEW_TABLE.COL_NAME,
    continued: false,
  });
  doc.text('Samples', startX + OVERVIEW_TABLE.COL_BANK_POS + OVERVIEW_TABLE.COL_NAME, headerY, {
    width: OVERVIEW_TABLE.COL_SAMPLES,
    align: 'center',
    continued: false,
  });
  doc.text(
    'Presets',
    startX + OVERVIEW_TABLE.COL_BANK_POS + OVERVIEW_TABLE.COL_NAME + OVERVIEW_TABLE.COL_SAMPLES,
    headerY,
    { width: OVERVIEW_TABLE.COL_PRESETS, align: 'center', continued: false }
  );

  currentY += SPACING.TABLE_HEADER_HEIGHT;

  // Header underline
  doc
    .moveTo(startX, currentY)
    .lineTo(
      startX +
        OVERVIEW_TABLE.COL_BANK_POS +
        OVERVIEW_TABLE.COL_NAME +
        OVERVIEW_TABLE.COL_SAMPLES +
        OVERVIEW_TABLE.COL_PRESETS,
      currentY
    )
    .stroke(COLORS.BORDER);

  currentY += SPACING.LINE_GAP;

  // Table rows
  doc.fontSize(FONTS.BODY.size);

  for (const project of projects) {
    // Check if we need a page break
    if (currentY > PAGE.HEIGHT - PAGE.MARGIN.BOTTOM - SPACING.TABLE_ROW_HEIGHT) {
      doc.addPage();
      currentY = PAGE.MARGIN.TOP;
    }

    const displayName = project.customName || project.name;

    doc.fillColor(COLORS.BLACK);
    doc.text(project.bankPosition, startX, currentY, {
      width: OVERVIEW_TABLE.COL_BANK_POS,
      continued: false,
    });
    doc.text(displayName, startX + OVERVIEW_TABLE.COL_BANK_POS, currentY, {
      width: OVERVIEW_TABLE.COL_NAME,
      continued: false,
      ellipsis: true,
    });
    doc.fillColor(COLORS.GRAY);
    doc.text(
      String(project.sampleCount),
      startX + OVERVIEW_TABLE.COL_BANK_POS + OVERVIEW_TABLE.COL_NAME,
      currentY,
      { width: OVERVIEW_TABLE.COL_SAMPLES, align: 'center', continued: false }
    );
    doc.text(
      String(project.presetCount),
      startX + OVERVIEW_TABLE.COL_BANK_POS + OVERVIEW_TABLE.COL_NAME + OVERVIEW_TABLE.COL_SAMPLES,
      currentY,
      { width: OVERVIEW_TABLE.COL_PRESETS, align: 'center', continued: false }
    );

    currentY += SPACING.TABLE_ROW_HEIGHT;
  }

  doc.y = currentY;
}

/**
 * Draw project header section
 */
function drawProjectHeader(
  doc: typeof PDFDocument.prototype,
  project: ProjectExportData['project']
): void {
  // Title
  doc.fontSize(FONTS.TITLE.size).fillColor(COLORS.BLACK);
  const displayName = project.customName || project.name;
  doc.text(`${project.bankPosition} - ${displayName}`, { align: 'center' });

  doc.moveDown(0.3);

  // Subtitle
  doc.fontSize(FONTS.BODY.size).fillColor(COLORS.GRAY);
  doc.text(project.name, { align: 'center' });
}

/**
 * Draw samples table
 */
function drawSamplesTable(
  doc: typeof PDFDocument.prototype,
  samples: ProjectExportData['samples']
): void {
  const startX = PAGE.MARGIN.LEFT;

  for (const sample of samples) {
    checkPageBreak(doc, 40);

    const currentY = doc.y;

    // Sample name (bold)
    doc.fontSize(FONTS.SUBHEADING.size).fillColor(COLORS.BLACK);
    doc.text(sample.name, startX, currentY);

    // Description (if available)
    if (sample.description) {
      doc.fontSize(FONTS.BODY.size).fillColor(COLORS.GRAY);
      doc.text(sample.description, startX + SPACING.INDENT, doc.y, {
        width: PAGE.CONTENT_WIDTH - SPACING.INDENT,
      });
    }

    // Used by presets
    if (sample.usedByPresets.length > 0) {
      doc.fontSize(FONTS.SMALL.size).fillColor(COLORS.BLUE);
      const presetList = sample.usedByPresets.join(', ');
      doc.text(`Used by: ${presetList}`, startX + SPACING.INDENT, doc.y, {
        width: PAGE.CONTENT_WIDTH - SPACING.INDENT,
      });
    } else {
      doc.fontSize(FONTS.SMALL.size).fillColor(COLORS.LIGHT_GRAY);
      doc.text('Not used in any presets', startX + SPACING.INDENT, doc.y);
    }

    doc.moveDown(0.8);
  }
}

/**
 * Draw presets table with sample slots
 */
function drawPresetsTable(
  doc: typeof PDFDocument.prototype,
  presets: ProjectExportData['presets']
): void {
  const startX = PAGE.MARGIN.LEFT;

  for (const preset of presets) {
    // Check if we need space for preset header + 8 samples
    const requiredSpace =
      SPACING.TABLE_HEADER_HEIGHT + preset.samples.length * PRESET_LAYOUT.SAMPLE_SLOT_HEIGHT + 20;
    checkPageBreak(doc, requiredSpace);

    const currentY = doc.y;

    // Preset name with autosave badge
    doc.fontSize(FONTS.SUBHEADING.size).fillColor(COLORS.BLACK);
    doc.text(preset.name, startX, currentY, { continued: preset.isAutosave });

    if (preset.isAutosave) {
      doc
        .fillColor(COLORS.BLUE)
        .fontSize(FONTS.SMALL.size)
        .text(' [Current State]', { continued: false });
    }

    doc.moveDown(0.3);

    // Sample slots
    doc.fontSize(FONTS.BODY.size);

    for (const sample of preset.samples) {
      const slotY = doc.y;

      // Slot number
      doc.fillColor(COLORS.GRAY);
      doc.text(`${sample.slotNumber}.`, startX + SPACING.INDENT, slotY, {
        width: 20,
        continued: false,
      });

      // Sample name
      doc.fillColor(COLORS.BLACK);
      doc.text(sample.name || '(empty)', startX + SPACING.INDENT + 20, slotY, {
        width: PAGE.CONTENT_WIDTH - SPACING.INDENT - 20 - PRESET_LAYOUT.LOCATION_BADGE_WIDTH - 10,
        continued: false,
        ellipsis: true,
      });

      // Location badge
      if (sample.name) {
        const badgeX = PAGE.MARGIN.LEFT + PAGE.CONTENT_WIDTH - PRESET_LAYOUT.LOCATION_BADGE_WIDTH;
        const badgeColor =
          sample.location === 'PROJECT'
            ? COLORS.BLUE
            : sample.location === 'NOT_FOUND'
              ? COLORS.GRAY
              : COLORS.BLACK;

        doc.fillColor(badgeColor).fontSize(FONTS.SMALL.size);
        doc.text(`[${sample.location}]`, badgeX, slotY, {
          width: PRESET_LAYOUT.LOCATION_BADGE_WIDTH,
          align: 'right',
        });
      }

      doc.moveDown(0.6);
    }

    doc.moveDown(0.5);
  }
}

/**
 * Check if there's enough space on current page, add new page if needed
 */
function checkPageBreak(doc: typeof PDFDocument.prototype, requiredSpace: number): void {
  if (doc.y > PAGE.HEIGHT - PAGE.MARGIN.BOTTOM - requiredSpace) {
    doc.addPage();
  }
}
