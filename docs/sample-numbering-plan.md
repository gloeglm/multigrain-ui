# Sample Numbering Feature Implementation Plan

## Overview
Add ability to prefix samples with sequential digits (e.g., `01_kick.wav`) to enforce reliable alphabetical ordering on the Multigrain hardware.

## Requirements
- **During Import**: Optional checkbox to add number prefixes when importing samples
- **Persistent Preference**: Numbering toggle state persists across app restarts (localStorage)
- **Reorder Before Import**: When numbering enabled, allow reordering files in import dialog to control which sample gets which number
- **Manual Action**: Context menu action to add prefixes to existing unnumbered samples
- **Auto-detect**: Detect existing numbering scheme (1_, 01_, 001_) and continue that pattern
- **Default**: 2-digit underscore (01_) if no existing scheme detected
- **Preserve existing**: Never rename already-numbered files (would break preset references)

---

## Implementation Steps

### Step 1: Create Core Numbering Utility

**New file: `src/main/utils/sampleNumbering.ts`**

```typescript
interface NumberingScheme {
  pattern: 'none' | '1_' | '01_' | '001_';
  nextNumber: number;
  digits: number;  // 1, 2, or 3
}

// Core functions:
detectNumberingScheme(existingFiles: string[]): NumberingScheme
hasNumberPrefix(filename: string): boolean
applyNumberPrefix(filename: string, number: number, scheme: NumberingScheme): string
```

**Detection logic:**
1. Regex patterns: `^\d_`, `^\d{2}_`, `^\d{3}_`
2. Count occurrences, use majority pattern
3. Find highest existing number, set nextNumber = max + 1
4. Default to 01_ if no pattern found

**New file: `src/main/utils/sampleNumbering.test.ts`**
- Test detection with various file combinations
- Test prefix application with proper padding
- Test edge cases: empty folder, all numbered, mixed patterns

---

### Step 2: Extend Import Types

**Modify: `src/shared/types/import.ts`**

```typescript
// Add to ImportRequest:
export interface ImportRequest {
  files: string[];
  targetPath: string;
  numberingOptions?: {
    enabled: boolean;
    scheme?: 'auto' | '01_' | '001_';
  };
}

// Add to ImportResult:
export interface ImportResult {
  // ... existing fields
  numbered: string[];  // Files that received number prefixes
}
```

---

### Step 3: Integrate Numbering into Import

**Modify: `src/main/ipc/audioImport.ts`**

In `import:executeBatch` handler (~line 120):
1. If numbering enabled, detect scheme from existing WAV files in target
2. Track currentNumber across batch
3. Before sanitizeFilename(), apply prefix to files without existing prefix
4. Track numbered files in result.numbered[]

**Modify: `src/main/preload.ts`**

Update `executeImport` signature to accept `numberingOptions` parameter.

---

### Step 4: Add Import Dialog UI

**Modify: `src/renderer/components/ImportDialog.tsx`**

Add in validation stage (after storage info):
```tsx
<div className="mb-4 p-3 bg-panel-dark rounded border border-panel-border">
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" checked={numberingEnabled} onChange={...} />
    <span>Add number prefixes (e.g., 01_kick.wav)</span>
  </label>
  {numberingEnabled && (
    <>
      <select value={numberingScheme} onChange={...}>
        <option value="auto">Auto-detect from existing files</option>
        <option value="01_">2-digit (01_, 02_, ...)</option>
        <option value="001_">3-digit (001_, 002_, ...)</option>
      </select>
      <p className="text-xs text-label-gray mt-2">
        Drag to reorder files below to control numbering sequence
      </p>
    </>
  )}
</div>
```

**Reorderable file list (only when numbering enabled):**

When `numberingEnabled = false`:
- File list displays in alphabetical order (matches final import order)
- No drag handles, no reordering capability
- Files imported with original names

When `numberingEnabled = true`:
- Add `fileOrder` state: `useState<number[]>([])` - array of indices
- Initialize with `[0, 1, 2, ...]` when files are validated
- Render file list using `fileOrder.map(i => validatedFiles[i])`
- Show drag handles (⋮⋮) on each file row
- Implement HTML5 drag-and-drop for reordering:
  - `draggable={true}` on file rows
  - `onDragStart`, `onDragOver`, `onDrop` handlers
  - Visual feedback during drag (opacity, drop indicator)
- Show preview number (01_, 02_, etc.) next to each filename
- Pass reordered file list to executeImport

Add state with localStorage persistence:
```typescript
const [numberingEnabled, setNumberingEnabled] = useState(() => {
  return localStorage.getItem('importNumberingEnabled') === 'true';
});
const [numberingScheme, setNumberingScheme] = useState<'auto' | '01_' | '001_'>(() => {
  return (localStorage.getItem('importNumberingScheme') as any) || 'auto';
});

// Persist changes
useEffect(() => {
  localStorage.setItem('importNumberingEnabled', String(numberingEnabled));
}, [numberingEnabled]);

useEffect(() => {
  localStorage.setItem('importNumberingScheme', numberingScheme);
}, [numberingScheme]);
```

Pass to executeImport and show numbered files in results.

---

### Step 5: Add Manual Numbering Action

**Modify: `src/main/ipc/fileOperations.ts`**

New handler `files:addNumberPrefixes`:
```typescript
ipcMain.handle('files:addNumberPrefixes', async (_event, folderPath: string) => {
  // 1. Get all WAV files in folder
  // 2. Detect existing numbering scheme
  // 3. Filter out already-numbered files
  // 4. Rename remaining files with sequential prefixes
  // 5. Return { renamed: [...], skipped: [...], errors: [...] }
});
```

**Modify: `src/main/preload.ts`**

Expose `addNumberPrefixes` via electronAPI.

**Modify: `src/renderer/components/FileTree.tsx`**

Add context menu item on Project and Wavs folders:
```typescript
{
  label: 'Add Number Prefixes to Samples',
  icon: '🔢',
  onClick: () => handleAddNumberPrefixes(folderPath),
}
```

Show confirmation dialog before renaming with:
- Detected scheme
- Files to be renamed
- Files to be skipped (already numbered)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/main/utils/sampleNumbering.ts` | **NEW** - Core numbering logic |
| `src/main/utils/sampleNumbering.test.ts` | **NEW** - Unit tests |
| `src/shared/types/import.ts` | Add numberingOptions to ImportRequest, numbered[] to ImportResult |
| `src/main/ipc/audioImport.ts` | Integrate numbering into import batch execution |
| `src/main/preload.ts` | Update executeImport signature, add addNumberPrefixes |
| `src/renderer/components/ImportDialog.tsx` | Add numbering checkbox/dropdown UI, drag-and-drop reordering |
| `src/main/ipc/fileOperations.ts` | Add files:addNumberPrefixes handler |
| `src/renderer/components/FileTree.tsx` | Add context menu action for manual numbering |

---

## Test Coverage

1. **sampleNumbering.test.ts**: Detection, prefix application, edge cases
2. **ImportDialog.test.tsx**: Extend with numbering UI toggle tests, reordering tests
3. **fileOperations.test.ts**: Extend with batch numbering tests

---

## Key Constraints

- **Never rename already-numbered files** - enforced by `hasNumberPrefix()` check
- Auto-detection uses majority voting if mixed patterns exist
- Numbering continues from highest existing number + 1
