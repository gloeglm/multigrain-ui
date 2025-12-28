/**
 * PDF Layout Constants for Reference Sheet Generation
 * Defines page dimensions, fonts, colors, and spacing for print-optimized PDFs
 */

// Page dimensions (A4 size: 210mm × 297mm at 72 DPI)
export const PAGE = {
  WIDTH: 595,
  HEIGHT: 842,
  MARGIN: {
    TOP: 36,
    BOTTOM: 36,
    LEFT: 36,
    RIGHT: 36,
  },
  get CONTENT_WIDTH() {
    return this.WIDTH - this.MARGIN.LEFT - this.MARGIN.RIGHT;
  },
  get CONTENT_HEIGHT() {
    return this.HEIGHT - this.MARGIN.TOP - this.MARGIN.BOTTOM;
  },
};

// Typography
export const FONTS = {
  TITLE: {
    family: 'Helvetica-Bold',
    size: 16,
  },
  HEADING: {
    family: 'Helvetica-Bold',
    size: 12,
  },
  SUBHEADING: {
    family: 'Helvetica-Bold',
    size: 10,
  },
  BODY: {
    family: 'Helvetica',
    size: 9,
  },
  SMALL: {
    family: 'Helvetica',
    size: 8,
  },
  MONO: {
    family: 'Courier',
    size: 8,
  },
};

// Color palette
export const COLORS = {
  BLACK: '#000000',
  GRAY: '#666666',
  LIGHT_GRAY: '#999999',
  BLUE: '#2563eb',
  BORDER: '#d1d5db',
  LIGHT_BORDER: '#e5e7eb',
  BACKGROUND_LIGHT: '#f9fafb',
};

// Spacing
export const SPACING = {
  SECTION_GAP: 16,
  LINE_GAP: 4,
  TABLE_ROW_HEIGHT: 18,
  TABLE_HEADER_HEIGHT: 20,
  INDENT: 12,
};

// Table column widths (for overview sheet) - optimized for A4
export const OVERVIEW_TABLE = {
  COL_BANK_POS: 58, // "X / 1"
  COL_NAME: 270, // Project name
  COL_SAMPLES: 68, // Sample count
  COL_PRESETS: 68, // Preset count
};

// Preset sample slot layout
export const PRESET_LAYOUT = {
  SAMPLE_SLOT_HEIGHT: 14,
  LOCATION_BADGE_WIDTH: 60,
};
