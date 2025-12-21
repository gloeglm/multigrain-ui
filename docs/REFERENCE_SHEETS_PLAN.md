# Printable Reference Sheet Generation for Multigrain Sample Manager

## Overview
Add ability to generate print-optimized PDF reference sheets to help users remember which projects are which and which samples are used where.

## User Requirements

### Two Types of Reference Sheets:

1. **General Overview Sheet**
   - List ALL projects on SD card
   - Show bank/position mapping (e.g., "X / 1 - Project Name")
   - Show custom names if set
   - Compact, space-saving layout
   - Single page if possible

2. **Individual Project Reference Sheets**
   - One sheet per project
   - Available samples in the project
   - Which presets use which samples (including Autosave)
   - Include user descriptions for samples
   - **Exclude** technical info (sample rate, bit depth, sizes, durations)
   - Print-optimized layout

### Output Format
- PDF files optimized for printing
- Triggered from UI (context menus or buttons)

## Technology Choice

**PDFKit** - Node.js native PDF generation library
- Small bundle size (~200KB)
- No external dependencies (unlike Puppeteer's 300MB+)
- Precise control for compact layouts
- Works perfectly in Electron main process
- Cross-platform (Windows, macOS, Linux)

## Architecture

**Main Process Generation**
- Direct file system access
- Use existing IPC pattern for UI triggers
- Native save dialogs via Electron
- Better performance for batch operations

```
Renderer (Context Menu) → [IPC] → Main Process (PDFKit) → User-selected file location
```

## Implementation Plan

### Phase 1: Dependencies & Types

**Step 1: Install PDFKit**
```bash
npm install pdfkit @types/pdfkit
```

**Step 2: Add Type Definitions**
File: `src/shared/types.ts`

```typescript
export interface OverviewData {
  rootPath: string;
  totalProjects: number;
  projects: Array<{
    index: number;
    bankPosition: string; // "X / 1"
    name: string;
    customName?: string;
    sampleCount: number;
    presetCount: number;
  }>;
}

export interface ProjectExportData {
  project: {
    index: number;
    bankPosition: string;
    name: string;
    customName?: string;
  };
  samples: Array<{
    name: string;
    description?: string;
    usedByPresets: string[]; // Preset names referencing this sample
  }>;
  presets: Array<{
    name: string;
    index: number;
    isAutosave: boolean;
    samples: Array<{
      slotNumber: number; // 1-8
      name: string;
      location: 'PROJECT' | 'WAVS' | 'RECS' | 'NOT_FOUND';
    }>;
  }>;
}
```

### Phase 2: Data Aggregation

**Step 3: Create Data Aggregator**
File: `src/main/utils/exportDataAggregator.ts` (NEW)

Key functions:
- `aggregateOverviewData(structure)` - Collect all project info for overview
- `aggregateProjectData(project, structure, rootPath)` - Full project data with presets/samples
- Sample resolution logic (reuse from PresetViewer: PROJECT → WAVS → RECS → NOT_FOUND)
- Batch read audio metadata for descriptions
- Build reverse mapping: sample → presets that use it

**Critical Logic:**
```typescript
// For each preset, read sample references using existing IPC pattern
const presetData = await window.electronAPI.readPresetSamples(preset.path);

// Resolve sample locations (match PresetViewer.tsx logic)
const resolvedSample = resolveSampleLocation(sampleName, project, structure);

// Build usage map: which presets reference each sample
const usageMap = new Map<string, string[]>();
for (const preset of presets) {
  for (const sample of preset.samples) {
    usageMap.get(sample.name)?.push(preset.name);
  }
}
```

### Phase 3: PDF Generation Engine

**Step 4: Create Layout Constants**
File: `src/main/utils/pdfLayouts.ts` (NEW)

```typescript
export const PAGE = {
  WIDTH: 612,   // Letter size: 8.5" × 11" at 72 DPI
  HEIGHT: 792,
  MARGIN: { TOP: 36, BOTTOM: 36, LEFT: 36, RIGHT: 36 },
};

export const FONTS = {
  TITLE: { family: 'Helvetica-Bold', size: 16 },
  HEADING: { family: 'Helvetica-Bold', size: 12 },
  BODY: { family: 'Helvetica', size: 9 },
  SMALL: { family: 'Helvetica', size: 8 },
  MONO: { family: 'Courier', size: 8 },
};

export const COLORS = {
  BLACK: '#000000',
  GRAY: '#666666',
  LIGHT_GRAY: '#999999',
  BLUE: '#2563eb',
  BORDER: '#d1d5db',
};
```

**Step 5: Create PDF Generator**
File: `src/main/utils/pdfGenerator.ts` (NEW)

**Overview Sheet Layout:**
```typescript
export async function generateOverviewSheet(data: OverviewData, outputPath: string) {
  const doc = new PDFDocument({ size: 'LETTER', margin: 36 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Header
  doc.font('Helvetica-Bold').fontSize(16)
     .text('Multigrain Sample Manager', { align: 'center' });
  doc.fontSize(12).text('Project Overview', { align: 'center' });

  // Summary stats
  doc.fontSize(9).font('Helvetica');
  doc.text(`SD Card: ${data.rootPath}`);
  doc.text(`Total Projects: ${data.totalProjects}`);

  // Table: Bank/Pos | Name | Samples | Presets
  drawOverviewTable(doc, data.projects);

  doc.end();
  return streamToPromise(stream);
}
```

**Project Sheet Layout:**
```typescript
export async function generateProjectSheet(data: ProjectExportData, outputPath: string) {
  const doc = new PDFDocument({ size: 'LETTER', margin: 36 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Project header
  drawProjectHeader(doc, data.project);

  // Samples section
  doc.font('Helvetica-Bold').fontSize(12).text('Available Samples');
  drawSamplesTable(doc, data.samples);
  // Each sample: name, description, "Used by: Preset01, Preset05"

  // Presets section (auto page break if needed)
  checkPageBreak(doc, 200);
  doc.font('Helvetica-Bold').fontSize(12).text('Presets');
  drawPresetsTable(doc, data.presets);
  // Each preset: name, 8 sample slots with location badges

  doc.end();
  return streamToPromise(stream);
}
```

**Helper Functions:**
- `drawOverviewTable()` - 4-column compact table with pagination
- `drawSamplesTable()` - Sample name, description, usage list
- `drawPresetsTable()` - Preset name, 8 samples with [PROJECT]/[WAVS]/[RECS] tags
- `checkPageBreak(doc, requiredSpace)` - Add page if < requiredSpace remaining
- Text wrapping handled by PDFKit's `width` option

### Phase 4: IPC Integration

**Step 6: Create IPC Handlers**
File: `src/main/ipc/pdfExport.ts` (NEW)

```typescript
export function registerPdfExportHandlers(): void {
  // Export overview sheet
  ipcMain.handle('pdf:exportOverview', async (_event, structure: MultigainStructure) => {
    const result = await dialog.showSaveDialog({
      title: 'Export Overview Sheet',
      defaultPath: 'Multigrain_Overview.pdf',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    const data = await aggregateOverviewData(structure);
    await generateOverviewSheet(data, result.filePath);

    return { success: true, path: result.filePath };
  });

  // Export single project sheet
  ipcMain.handle('pdf:exportProject', async (_event, project: Project, structure: MultigainStructure) => {
    const defaultName = `${project.customName || project.name}_Reference.pdf`
      .replace(/[/\\:*?"<>|]/g, '_');

    const result = await dialog.showSaveDialog({
      title: 'Export Project Sheet',
      defaultPath: defaultName,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    const data = await aggregateProjectData(project, structure, structure.rootPath);
    await generateProjectSheet(data, result.filePath);

    return { success: true, path: result.filePath };
  });

  // Export all projects (batch)
  ipcMain.handle('pdf:exportAllProjects', async (_event, structure: MultigainStructure) => {
    const result = await dialog.showOpenDialog({
      title: 'Select Folder for Project Sheets',
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const outputDir = result.filePaths[0];
    const results = [];

    for (const project of structure.projects) {
      const fileName = `${project.index}_${(project.customName || project.name).replace(/[/\\:*?"<>|]/g, '_')}.pdf`;
      const outputPath = path.join(outputDir, fileName);

      try {
        const data = await aggregateProjectData(project, structure, structure.rootPath);
        await generateProjectSheet(data, outputPath);
        results.push({ project: project.name, success: true });
      } catch (error) {
        results.push({ project: project.name, success: false });
      }
    }

    return { success: true, count: results.filter(r => r.success).length, total: results.length };
  });
}
```

**Step 7: Register Handlers**
File: `src/main/ipc/index.ts` (MODIFY)

```typescript
import { registerPdfExportHandlers } from './pdfExport';

export function registerAllHandlers(): void {
  // ... existing handlers
  registerPdfExportHandlers();
}
```

**Step 8: Update Preload**
File: `src/main/preload.ts` (MODIFY)

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing APIs

  exportOverviewPdf: (structure: MultigainStructure) =>
    ipcRenderer.invoke('pdf:exportOverview', structure),
  exportProjectPdf: (project: Project, structure: MultigainStructure) =>
    ipcRenderer.invoke('pdf:exportProject', project, structure),
  exportAllProjectsPdf: (structure: MultigainStructure) =>
    ipcRenderer.invoke('pdf:exportAllProjects', structure),
});
```

### Phase 5: UI Integration

**Step 9: Create React Hook**
File: `src/renderer/hooks/usePdfExport.ts` (NEW)

```typescript
export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportOverview = async (structure: MultigainStructure) => {
    setIsExporting(true);
    try {
      const result = await window.electronAPI.exportOverviewPdf(structure);
      if (result.success && result.path) {
        alert(`Overview sheet exported to:\n${result.path}`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const exportProject = async (project: Project, structure: MultigainStructure) => {
    // Similar pattern
  };

  const exportAllProjects = async (structure: MultigainStructure) => {
    if (!confirm(`Export sheets for all ${structure.projects.length} projects?`)) {
      return;
    }
    // Batch export logic
  };

  return { exportOverview, exportProject, exportAllProjects, isExporting, error };
}
```

**Step 10: Add Context Menu Items**
File: `src/renderer/components/FileTree.tsx` (MODIFY)

Import hook: `const pdfExport = usePdfExport();`

Add to Multigrain node context menu:
```typescript
{
  label: 'Export Overview Sheet',
  icon: '📄',
  onClick: () => pdfExport.exportOverview(structure),
}
```

Add to Projects folder context menu:
```typescript
{
  label: 'Export All Project Sheets',
  icon: '📑',
  onClick: () => pdfExport.exportAllProjects(structure),
}
```

Add to individual project context menu:
```typescript
{
  label: 'Export Project Sheet',
  icon: '📄',
  onClick: () => pdfExport.exportProject(project, structure),
}
```

**Step 11: Add Header Button (Optional)**
File: `src/renderer/App.tsx` (MODIFY)

```typescript
{structure && (
  <button
    onClick={() => exportOverview(structure)}
    disabled={isExporting}
    className="bg-label-blue hover:bg-button-dark text-white px-4 py-2 rounded"
  >
    {isExporting ? 'Exporting...' : 'Export Overview'}
  </button>
)}
```

## Critical Implementation Details

### Sample Resolution
Reuse exact logic from `PresetViewer.tsx` lines 30-53:
1. Check project.samples
2. Check structure.globalWavs
3. Check structure.recordings
4. Mark as NOT_FOUND if none match

### Preset-to-Sample Cross-Reference
Build reverse mapping for "Used by" lists:
```typescript
const sampleUsageMap = new Map<string, string[]>();
for (const preset of presets) {
  for (const sample of preset.samples) {
    if (!sampleUsageMap.has(sample.name)) {
      sampleUsageMap.set(sample.name, []);
    }
    sampleUsageMap.get(sample.name)!.push(preset.name);
  }
}
```

### Pagination Strategy
- **Overview**: Aim for single page, use compact 4-column layout
- **Project sheets**: Auto page break when `doc.y > PAGE.HEIGHT - 100`
- **Smart breaks**: Don't orphan preset header without its samples

### Performance
- Batch read all audio metadata with `Promise.all`
- Cache resolved sample locations
- Stream PDF to file (no in-memory buffer)

## Testing Checklist

- [ ] Overview sheet with all 48 projects
- [ ] Project sheet with samples and descriptions
- [ ] Preset-to-sample mapping accurate
- [ ] Sample location badges correct (PROJECT/WAVS/RECS)
- [ ] Autosave preset identified
- [ ] Missing samples marked [NOT FOUND]
- [ ] Batch export all projects
- [ ] File name sanitization (special characters)
- [ ] Cross-platform (Windows, macOS, Linux)
- [ ] PDF opens in default viewer
- [ ] Context menus work
- [ ] Edge cases: empty projects, no presets, long names

## File Summary

### New Files (5)
1. `src/main/ipc/pdfExport.ts` - IPC handlers
2. `src/main/utils/pdfGenerator.ts` - PDF generation logic
3. `src/main/utils/pdfLayouts.ts` - Layout constants
4. `src/main/utils/exportDataAggregator.ts` - Data preparation
5. `src/renderer/hooks/usePdfExport.ts` - React hook

### Modified Files (5)
1. `src/main/ipc/index.ts` - Register PDF handlers
2. `src/main/preload.ts` - Expose PDF export API
3. `src/shared/types.ts` - Add export data types
4. `src/renderer/components/FileTree.tsx` - Add context menu items
5. `src/renderer/App.tsx` - Optional header button

### Dependencies
- `pdfkit` - PDF generation
- `@types/pdfkit` - TypeScript types

## Implementation Order

1. Install dependencies
2. Add type definitions
3. Create layout constants
4. Create data aggregator (start with overview, then project)
5. Create PDF generator (overview first, simpler to test)
6. Create IPC handlers
7. Update IPC registration and preload
8. Create React hook
9. Update UI (context menus + optional button)
10. Test on all platforms
11. Refine layouts based on real PDFs

## Integration with PLAN.md

This feature should be added as **Phase 4d: Reference Sheet Export** in the project plan, positioned after import/project creation features and before final polish.
