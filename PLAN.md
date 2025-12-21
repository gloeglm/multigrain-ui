# Multigrain Sample Manager - Implementation Plan

## Overview
Cross-platform desktop application (Electron + React) for managing audio samples on an SD card for the Multigrain Eurorack module.

## Core Features
1. **Browse & Preview** - Navigate SD card contents, playback WAV files, view waveforms
2. **Organize Files** - Move, rename, delete samples on the SD card
3. **Import Samples** - Add new WAV files from computer to SD card (with auto-conversion)
4. **Project Overview** - Display/print the file and project structure on the card

## Technology Stack
- **Framework**: Electron (cross-platform desktop)
- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **Audio Playback**: Web Audio API for preview
- **Audio Conversion**: FFmpeg (via fluent-ffmpeg) for format conversion
- **Waveform**: wavesurfer.js for visualization
- **File System**: Node.js fs module via Electron's main process

---

## Multigrain File Structure Specification

### SD Card Root Structure
```
Multigrain/
├── Project01/          # Project folders (01-48)
├── Project02/
├── ...
├── Project48/
├── Recs/               # Global recordings folder
├── Wavs/               # Global WAV samples folder
└── Settings.mgs           # Global settings file
```

### Project Folder Structure
```
ProjectXX/
├── Autosave.mgp           # Autosave state for this project
├── Preset01.mgp           # Preset files (01-48)
├── Preset02.mgp
├── ...
├── Preset48.mgp
├── SampleA.wav            # Project-specific samples (up to 128)
└── SampleB.wav
```

### Audio File Requirements
| Property | Value |
|----------|-------|
| Format | .WAV |
| Sample Rate | 48 kHz |
| Bit Depth | 16-bit |
| Channels | Stereo (2) |
| Max Length | 32 seconds |

### Storage Limits
- **Projects**: 48 total (6 banks × 8 projects)
- **Presets per Project**: 48 (6 banks × 8 presets)
- **Sounds per Preset**: 8
- **Samples in /PROJECT**: 128 per project
- **Samples in /WAVS**: 128 global
- **Samples in /RECS**: 1024 recordings

### Hierarchy
```
Project
└── Presets (48 per project)
    └── Sounds (8 per preset)
        └── Scenes (2 per sound) + Sample reference
```

---

## Implementation Steps

### Phase 1: Project Setup ✅ **COMPLETE**
- [x] Initialize Electron + React + TypeScript project
- [x] Configure Tailwind CSS with custom Multigrain color scheme
- [x] Set up IPC communication between main/renderer processes
- [x] Create basic window with file system access

**Status**: All core infrastructure in place. Custom Tailwind theme implemented with Multigrain-inspired colors (blues, grays, reds).

### Phase 2: SD Card Detection & Browsing ✅ **COMPLETE**
- [x] Implement SD card/drive detection (folder selection dialog)
- [x] Validate Multigrain folder structure (`src/main/utils/multigrain.ts`)
- [x] Build file tree component for navigation (`src/renderer/components/FileTree.tsx`)
- [x] Display project/preset/sample hierarchy
- [x] **BONUS**: Custom project naming feature with `.multigrain-metadata.txt` storage
- [x] **BONUS**: Editable project names directly in UI

**Status**: Full browsing capability with enhanced project management features beyond original plan.

### Phase 3: Audio Preview ✅ **COMPLETE**
- [x] Integrate Web Audio API for playback via WaveSurfer.js
- [x] Add waveform visualization (`src/renderer/components/AudioPlayer.tsx`)
- [x] Implement play/pause/stop controls
- [x] Show sample metadata (duration, sample rate, bit depth, channels)
- [x] **BONUS**: Auto-play toggle with localStorage persistence
- [x] **BONUS**: Editable sample descriptions stored in `.metadata.txt` files
- [x] **BONUS**: Real-time playback progress display
- [x] **BONUS**: Technical details panel showing audio specs

**Status**: Complete audio preview system with metadata management exceeding original requirements.

### Phase 3.5: Preset Viewer & Advanced Navigation ✅ **COMPLETE**
- [x] Extract sample references from `.mgp` preset files (`src/main/ipc/preset.ts`)
- [x] Display preset contents with 8 sample references (`src/renderer/components/PresetViewer.tsx`)
- [x] Intelligent sample location resolution (PROJECT → WAVS → RECS priority)
- [x] Color-coded location badges for sample origins
- [x] Click-to-navigate from preset samples to audio files
- [x] Autosave.mgp viewer - show current project state when clicking projects
- [x] Independent scroll areas for file tree and content panel
- [x] Factory project names initialization button
- [x] Batch metadata writing for quick setup

**Status**: Advanced preset inspection and navigation features with intelligent sample resolution.

### Phase 4: File Operations 🚧 **IN PROGRESS**

#### Phase 4a: Import Samples ✅ **COMPLETE**
- [x] Import samples with **automatic format conversion**:
  - [x] Convert any sample rate → 48 kHz
  - [x] Convert any bit depth → 16-bit
  - [x] Convert mono → stereo (duplicate channel)
  - [x] Auto-trim files longer than 32 seconds
  - [x] Auto-rename on filename conflicts (file_1.wav, file_2.wav)
  - [x] Storage limit enforcement (128 samples per project/Wavs)

**Status**: ✅ Implementation complete. Import feature fully functional with FFmpeg integration.

**Dependencies to install**:
```bash
npm install fluent-ffmpeg @types/fluent-ffmpeg @ffmpeg-installer/ffmpeg
```

**Design Decisions**:
- **FFmpeg Integration**: Using `fluent-ffmpeg` + `@ffmpeg-installer/ffmpeg` for cross-platform binary bundling
- **Filename Conflicts**: Auto-rename with numeric suffixes (safe, no data loss)
- **Import Targets**: Individual project folders + global Wavs folder
- **Error Handling**: Continue with remaining files on errors, show summary
- **Long Files**: Auto-trim to 32 seconds with warning
- **UI**: React modal dialog with validation → progress → results flow

**Files to Create**:
1. `src/main/utils/fileConflictResolver.ts` - Generate unique filenames
2. `src/shared/types/import.ts` - Import type definitions
3. `src/main/ipc/audioConversion.ts` - FFmpeg conversion wrapper
4. `src/main/ipc/audioImport.ts` - Import orchestration and IPC handlers
5. `src/renderer/components/ImportDialog.tsx` - Import UI modal

**Files to Modify**:
1. `src/main/ipc/index.ts` - Register import handlers
2. `src/main/preload.ts` - Expose import API to renderer
3. `src/shared/types.ts` - Export import types
4. `src/renderer/components/FileTree.tsx` - Add import buttons
5. `src/renderer/hooks/useMultigrain.ts` - Ensure reload works

**Implementation Steps**:
1. Install dependencies (fluent-ffmpeg, @ffmpeg-installer/ffmpeg)
2. Create file conflict resolver utility (pure function, easy to test)
3. Create audio conversion module with FFmpeg integration
4. Define import type definitions
5. Create import orchestration IPC handlers
6. Build ImportDialog React component
7. Integrate import buttons into FileTree
8. Testing and polish

**Key Features**:
- **Validation before import**: Show users what will be converted/trimmed
- **Progress tracking**: Real-time updates via IPC events
- **Detailed results**: Show imported count, trimmed files, renamed files, errors
- **Storage limit checks**: Prevent exceeding 128 samples per location
- **Auto-refresh**: File tree updates after successful import

**Testing Checklist**:
- [ ] Convert 44.1kHz file → verify 48kHz output
- [ ] Convert mono file → verify stereo output
- [ ] Convert 24-bit file → verify 16-bit output
- [ ] Import MP3/FLAC → verify WAV output with correct specs
- [ ] Import file >32s → verify auto-trimmed to exactly 32s
- [ ] Import with filename conflict → verify auto-renamed
- [ ] Batch import with mixed valid/invalid → verify continues on errors
- [ ] Import to project with 127 samples → verify allows 1 more
- [ ] Import to project with 128 samples → verify blocks with limit error

#### Phase 4a.5: Project Creation ✅ **COMPLETE**
- [x] UI dialog for creating new projects with bank/position selection
- [x] Bank selection using Multigrain manual nomenclature (X, Y, Z, XX, YY, ZZ)
- [x] Position selection grid (1-8) showing existing projects as disabled
- [x] Project number calculation: (Bank - 1) × 8 + Position
- [x] Optional custom project naming on creation
- [x] Validation to prevent creating duplicate projects
- [x] Automatic .project-metadata.json creation for custom names
- [x] Auto-refresh file tree after project creation
- [x] Bank/position display prefix on all project names (e.g., "X / 1 - ProjectName")
- [x] Preventive UX: Disable unavailable banks and positions
- [x] Show custom names in occupied slot tooltips
- [x] Auto-select first available slot on dialog open
- [x] Auto-switch to available position when changing banks
- [x] Window state persistence (size and position)
- [x] Context menu system for file operations (right-click interface)

**Status**: ✅ Implementation complete. Users can create new projects via UI dialog with enhanced UX.

**Implementation Details**:
- **Bank naming**: Uses manual labels (X, Y, Z, XX, YY, ZZ) instead of numbers
- **UI/UX**: Visual grid showing all 48 possible project slots with existing ones disabled
- **Folder creation**: Creates ProjectXX folder with optional metadata file
- **Integration**: Right-click context menus for all file operations
- **Smart Selection**: Dialog opens on first available slot and prevents invalid selections
- **Display Format**: All projects shown as "Bank / Position - Name" throughout the app
- **State Persistence**: Window size/position saved via electron-store with display validation
- **Context Menus**: Clean right-click interface replacing inline buttons, scalable for future actions

**Files Created**:
1. `src/renderer/components/CreateProjectDialog.tsx` - Project creation UI dialog
2. `src/main/ipc/projectOperations.ts` - IPC handler for project creation
3. `src/renderer/components/ContextMenu.tsx` - Reusable context menu component

**Files Modified**:
1. `src/main/ipc/index.ts` - Registered project operations handlers
2. `src/main/preload.ts` - Exposed createProject API to renderer
3. `src/renderer/components/FileTree.tsx` - Replaced inline buttons with context menus
4. `src/shared/constants.ts` - Added bank/position formatting utilities
5. `src/renderer/App.tsx` - Updated to use formatted project names
6. `src/renderer/components/PresetViewer.tsx` - Updated autosave display formatting
7. `src/main/index.ts` - Added window state persistence with electron-store

#### Phase 4b: Delete Operations ✅ **COMPLETE**
- [x] Delete projects with confirmation dialog
- [x] Delete samples with confirmation dialog
- [x] Smart navigation after deletion (to parent project or overview)
- [x] Security validation (only allow deleting ProjectXX folders and .wav files)

**Status**: Delete functionality complete.

**Completed Features**:
- Confirmation dialogs with danger variant styling
- Comprehensive delete warnings showing what will be removed
- Auto-navigation after deletion to prevent showing deleted items
- IPC handlers with security checks in `fileOperations.ts`
- Context menu integration for projects and samples

**Files Created**:
1. `src/main/ipc/fileOperations.ts` - Delete operations with security validation
2. `src/renderer/components/ConfirmDialog.tsx` - Reusable confirmation dialog

**Files Modified**:
1. `src/main/ipc/index.ts` - Registered file operations handlers
2. `src/main/preload.ts` - Exposed delete APIs
3. `src/renderer/components/FileTree.tsx` - Added delete context menus and navigation

#### Phase 4c: Rename Operations ✅ **COMPLETE**
- [x] Rename samples with conflict detection
- [x] Inline editing UI matching project rename pattern
- [x] Invalid character validation
- [x] Auto .wav extension handling
- [x] Context menu integration
- [x] Inline rename in AudioPlayer detail view
- [x] Bidirectional synchronization (rename from tree or AudioPlayer)
- [ ] Rename projects (already supported via metadata, this would rename the actual folder)
- [ ] Batch rename capabilities

**Status**: Sample renaming complete with bidirectional sync. Project folder renaming and batch operations deferred.

**Completed Features**:
- Inline editing with save/cancel buttons in both FileTree and AudioPlayer
- Enter/Escape keyboard shortcuts
- Automatic .wav extension handling (adds if missing)
- Invalid character validation (< > : " | ? *)
- File conflict detection and prevention
- IPC handler with security validation
- Bidirectional synchronization - rename works from either location
- Both FileTree and AudioPlayer stay in sync after rename

**Files Modified**:
1. `src/main/ipc/fileOperations.ts` - Added renameSample IPC handler
2. `src/main/preload.ts` - Exposed renameSample API
3. `src/renderer/components/FileTree.tsx` - Added rename UI and state management
4. `src/renderer/components/AudioPlayer.tsx` - Added inline rename UI
5. `src/renderer/App.tsx` - Path-based selection and helper functions
6. `src/shared/types.ts` - Updated TreeSelection to store paths

**Architecture Improvements**:
- Refactored to use React Context to eliminate prop drilling
- Reduced ProjectNode props from 16 to 4
- Reduced SampleNode props from 7 to 1
- Created FileTreeContext for shared state management
- More maintainable and follows React best practices
- **Fixed stale object references**: Changed TreeSelection to store paths instead of object references
  - Selection now stores `samplePath`, `presetPath`, `projectPath` as strings
  - App.tsx derives fresh objects from current structure using helper functions
  - Ensures AudioPlayer and FileTree always render with current data after reloads
  - Eliminates timing issues and guarantees synchronization after mutations

**Architecture Note - Future Consideration**:
If synchronization issues persist or state management becomes more complex, consider migrating to **optimistic updates pattern**:
- Immediately update structure state in memory after file operations (faster UI)
- No need to reload from disk after every mutation
- Trade-off: More complex state management, risk of divergence from disk if operations fail
- Current reload-based approach is simpler and always in sync with file system

#### Phase 4d: Preset Custom Naming (Future)
- [ ] Allow users to give custom names to presets
- [ ] Store custom names in `.preset-metadata.json` files within project folders
- [ ] Display custom names in PresetViewer (e.g., "Preset01 - My Bass Patch")
- [ ] Add "Rename Preset" option to context menu
- [ ] Inline editing in file tree (similar to project naming)
- [ ] Show custom names in preset lists and navigation
- [ ] Include custom preset names in reference sheet exports

**Status**: Not started. Will follow same pattern as project custom naming.

**Implementation Approach**:
- Reuse metadata storage pattern from `projectMetadata.ts`
- Create `presetMetadata.ts` IPC handler
- Store metadata at `ProjectXX/.preset-metadata.json`
- JSON format: `{ "Preset01.mgp": "My Custom Name", "Preset02.mgp": "Another Name" }`
- Update `Preset` interface to include `customName?: string`
- Add inline editing in FileTree's PresetNode component
- Display format: "Preset01 - My Custom Name" (or just preset name if no custom name)

**Files to Create**:
1. `src/main/ipc/presetMetadata.ts` - Read/write preset metadata

**Files to Modify**:
1. `src/shared/types.ts` - Add `customName` to `Preset` interface
2. `src/main/ipc/index.ts` - Register preset metadata handlers
3. `src/main/preload.ts` - Expose preset metadata API
4. `src/main/utils/multigrain.ts` - Load preset metadata during structure scan
5. `src/renderer/components/FileTree.tsx` - Add preset renaming UI
6. `src/renderer/components/PresetViewer.tsx` - Display custom names

**User Benefits**:
- Remember what each preset does (e.g., "Kick Drums", "Ambient Textures")
- Better organization and workflow
- Custom names included in printed reference sheets

### Phase 5: Automated Testing 🚧 **IN PROGRESS - HIGH PRIORITY**

Implement automated testing to catch bugs early and enable confident refactoring. Recent rename synchronization issues highlighted the need for comprehensive test coverage.

#### Phase 5a: Testing Infrastructure Setup ✅ **COMPLETE**
- [x] Install testing dependencies (vitest, @testing-library/react, memfs)
- [x] Configure vitest with TypeScript and React support
- [x] Add test scripts to package.json (`npm test`, `npm run test:ui`)
- [x] Set up test file structure (`*.test.ts`, `*.test.tsx`)
- [x] Configure mock file system for IPC handler tests
- [x] Create test helpers and mock factories
- [x] Create testing documentation (README.md)

**Dependencies to Install**:
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event memfs happy-dom
```

**Configuration**:
- Create `vitest.config.ts` with jsdom/happy-dom environment
- Add test patterns to include `**/*.test.{ts,tsx}`
- Configure path aliases to match webpack config

#### Phase 5b: Utility Function Tests (High Value, Low Overhead)
- [ ] Test `fileConflictResolver.ts` - unique filename generation
- [ ] Test format helpers (`formatProjectDisplayName`, bank/position utilities)
- [ ] Test sample resolution logic (PROJECT → WAVS → RECS priority)
- [ ] Test metadata parsing utilities
- [ ] Test path manipulation helpers

**Example Test Coverage**:
```typescript
// fileConflictResolver.test.ts
- generateUniqueFilename with no conflicts
- generateUniqueFilename with existing files (_1, _2, etc.)
- edge cases: long filenames, special characters

// constants.test.ts
- formatProjectDisplayName with/without custom names
- bank position calculation (1-48)
```

#### Phase 5c: IPC Handler Tests (Critical Business Logic)
- [ ] Test `renameSample` handler:
  - Valid rename operations
  - Invalid character validation
  - Conflict detection
  - Security checks (only .wav files)
  - .wav extension auto-append
- [ ] Test `deleteSample` and `deleteProject` handlers:
  - Security validation (only ProjectXX folders and .wav files)
  - Error handling for missing files
- [ ] Test audio metadata read/write handlers
- [ ] Test project metadata handlers
- [ ] Test import validation:
  - Format checks (sample rate, bit depth, channels)
  - Storage limit enforcement
  - File conflict resolution

**Approach**:
- Use `memfs` to mock file system operations
- Mock `ipcMain.handle` calls
- Test success and error paths
- Verify security checks prevent malicious operations

#### Phase 5d: React Component Tests (Critical State Management)
- [ ] Test **App.tsx** selection helpers:
  - `findSampleByPath` returns correct sample after structure reload
  - `findSampleByPath` returns null for non-existent paths
  - `findPresetByPath` resolves correctly
  - `findProjectByPath` resolves correctly
- [ ] Test **FileTree** context and state:
  - Sample selection updates selection state
  - Project selection shows autosave preset if available
  - Context menu triggers for rename/delete
- [ ] Test **AudioPlayer** component:
  - Renders sample information correctly
  - Inline rename updates on save
  - Edit mode keyboard shortcuts (Enter/Escape)
  - Metadata loading and display
- [ ] Test **rename synchronization** (regression test):
  - Rename from FileTree updates AudioPlayer display
  - Rename from AudioPlayer updates FileTree display
  - Both views show updated name after reload
- [ ] Test **delete navigation**:
  - Deleting selected sample navigates to parent project
  - Deleting project navigates to overview

**Critical Test Case (Rename Sync Bug)**:
```typescript
it('keeps AudioPlayer and FileTree in sync when renaming from tree', async () => {
  const { structure } = renderWithStructure(<App />);
  const sample = structure.projects[0].samples[0];

  // Select sample
  userEvent.click(screen.getByText(sample.name));
  expect(screen.getByRole('heading', { name: sample.name })).toBeInTheDocument();

  // Rename from tree context menu
  userEvent.rightClick(screen.getByText(sample.name));
  userEvent.click(screen.getByText('Rename Sample'));
  userEvent.clear(screen.getByRole('textbox'));
  userEvent.type(screen.getByRole('textbox'), 'newname');
  userEvent.click(screen.getByText('Save'));

  // Wait for reload and verify both views updated
  await waitFor(() => {
    expect(screen.getByText('newname.wav')).toBeInTheDocument(); // Tree
    expect(screen.getByRole('heading', { name: 'newname.wav' })).toBeInTheDocument(); // AudioPlayer
  });
});
```

#### Phase 5e: Integration Test Patterns
- [ ] Test complete workflows:
  - Import samples → verify in tree → play sample
  - Create project → rename project → add samples
  - Rename sample → delete sample → navigate to overview
- [ ] Test error recovery:
  - Failed rename reverts state
  - Failed delete shows error message
  - Invalid import shows validation errors

**Status**: Not started. HIGH PRIORITY - implement before adding more features to prevent accumulating technical debt.

**Benefits**:
- Catch bugs like rename synchronization issues automatically
- Enable confident refactoring of complex state management
- Document expected behavior through tests
- Reduce manual testing time during development
- Prevent regressions when adding new features

**Testing Philosophy**:
- Focus on **behavior**, not implementation details
- Test **critical paths** that users depend on
- Mock **file system** to avoid real disk I/O
- Keep tests **fast** and **maintainable**
- Write tests for **bugs found** (regression prevention)

### Phase 6: Project Overview ✅ **COMPLETE**
- [x] Interactive tree view of SD card structure in-app
- [x] Show storage usage statistics (basic counts)
- [x] Multigrain node always expanded, clickable to show overview
- [x] Projects folder clickable to show overview
- [x] Unified selection architecture with type-safe state management

**Status**: Overview dashboard functional with basic stats. Clean navigation and selection architecture implemented. Detailed storage limit tracking moved to Phase 9 (Nice to Have).

**Architecture Improvements**:
- **Unified Selection State**: Single `TreeSelection` type replaces multiple callback props
- **Type Safety**: Discriminated union prevents invalid selection combinations
- **Simplified State**: One state variable instead of three separate states
- **Cleaner Interface**: FileTree now has 2 props (`selection`, `onSelectionChange`) instead of 5 callbacks
- **Better Maintainability**: Easy to add new selection types (folders, categories, etc.)

### Phase 7: Reference Sheet Export ❌ **NOT STARTED**

Generate printable PDF reference sheets to help users remember which projects are which and which samples are used where.

**Two Types of Reference Sheets**:

1. **Overview Sheet** - General SD card overview
   - [ ] List all projects with bank/position mapping (e.g., "X / 1 - Project Name")
   - [ ] Show custom names if set
   - [ ] Display sample/preset counts per project
   - [ ] Compact, space-saving layout optimized for single page

2. **Project Sheets** - Detailed per-project reference
   - [ ] List available samples in the project
   - [ ] Show which presets use which samples (including Autosave)
   - [ ] Include user descriptions for samples
   - [ ] Display sample location badges (PROJECT/WAVS/RECS)
   - [ ] Exclude technical details (sample rate, bit depth, file sizes)

**Implementation Approach**:
- **Technology**: PDFKit for native Node.js PDF generation (~200KB, cross-platform)
- **Architecture**: Main process generation with direct file system access
- **UI Integration**: Context menu triggers on Multigrain root, Projects folder, and individual projects
- **Save Options**: Native file/folder dialogs for single or batch export
- **Data Aggregation**: Reuse existing sample resolution logic from PresetViewer
- **Layout**: Print-optimized with automatic pagination and smart page breaks

**Key Features**:
- [ ] Install PDFKit dependency (`pdfkit`, `@types/pdfkit`)
- [ ] Create data aggregation utilities (overview data, project data with preset-to-sample mapping)
- [ ] Build PDF generator with compact layouts (overview table, samples list, presets with 8 sample slots)
- [ ] Add IPC handlers for three export types (overview, single project, batch all projects)
- [ ] Create React hook for export operations with loading states
- [ ] Add context menu items: "Export Overview Sheet", "Export Project Sheet", "Export All Project Sheets"
- [ ] Implement file name sanitization for special characters
- [ ] Build reverse mapping: sample → presets that use it (for "Used by" lists)
- [ ] Test cross-platform PDF generation (Windows, macOS, Linux)

**Files to Create**:
1. `src/main/ipc/pdfExport.ts` - IPC handlers for PDF export operations
2. `src/main/utils/pdfGenerator.ts` - Core PDF generation logic using PDFKit
3. `src/main/utils/pdfLayouts.ts` - Layout constants (page dimensions, fonts, colors)
4. `src/main/utils/exportDataAggregator.ts` - Data preparation and sample resolution
5. `src/renderer/hooks/usePdfExport.ts` - React hook for export UI integration

**Files to Modify**:
1. `src/main/ipc/index.ts` - Register PDF export handlers
2. `src/main/preload.ts` - Expose PDF export API to renderer
3. `src/shared/types.ts` - Add `OverviewData` and `ProjectExportData` interfaces
4. `src/renderer/components/FileTree.tsx` - Add context menu items for export
5. `package.json` - Add pdfkit dependency

**Status**: Full implementation plan documented in `REFERENCE_SHEETS_PLAN.md`. Ready for implementation when prioritized.

**Design Decisions**:
- PDFKit over Puppeteer (smaller, no Chromium dependency)
- Main process over renderer (better file system access, no IPC overhead for large data)
- Context menus as primary trigger (consistent with existing UI patterns)
- Batch export to folder (more efficient than individual file dialogs)

### Phase 8: Polish & User Experience ❌ **NOT STARTED**
- [ ] Enhanced error handling for invalid files/formats
- [ ] Cross-platform testing (Windows, macOS, Linux)
- [ ] UI/UX refinements and accessibility improvements
- [ ] Performance optimization for large sample libraries
- [ ] User documentation and help system
- [ ] Comprehensive error messages and user guidance
- [ ] Edge case handling (corrupted files, permissions issues)

**Status**: Basic error handling exists. Comprehensive testing and polish phase pending.

### Phase 9: Distribution & Deployment ❌ **NOT STARTED**
- [ ] GitHub Actions CI/CD workflow for automated builds
- [ ] Multi-platform builds (Windows, macOS, Linux) on native runners
- [ ] Publish to GitHub Releases with draft review
- [ ] Version tagging and release process documentation
- [ ] Code signing setup (future)
  - [ ] macOS: Apple Developer ID signing + notarization
  - [ ] Windows: Code signing certificate
- [ ] Auto-update mechanism (future)

**Status**: No CI/CD currently configured. Planning to use GitHub Actions with Electron Forge publishers.

**Implementation Approach**:
- **GitHub Actions**: Trigger on version tags (`v*.*.*`)
- **Matrix Build Strategy**: Parallel builds on ubuntu-latest, macos-latest, windows-latest
- **Electron Forge GitHub Publisher**: Automatically upload artifacts to GitHub Releases
- **Draft Releases**: Allow review before making public
- **Auto-generated Release Notes**: Use GitHub's release notes generation from commit history
- **No Code Signing Initially**: Structure workflow to add signing later when certificates obtained

**Files to Create**:
1. `.github/workflows/release.yml` - CI/CD workflow configuration
2. `RELEASING.md` - Release process documentation

**Files to Modify**:
1. `forge.config.js` - Add `publishers` array with GitHub publisher config
2. `package.json` - Add `@electron-forge/publisher-github` dev dependency

**Release Process**:
```bash
npm version patch  # or minor/major
git push origin main --follow-tags
```
GitHub Actions will build installers and create a draft release for review.

### Phase 10: Nice to Have Features ❌ **NOT STARTED**

Optional enhancements that improve user experience but are not essential for core functionality. Users can work around these limitations manually.

- [ ] **Export samples to local file system**
  - Export individual samples to computer
  - Batch export multiple samples at once
  - Export entire project folder contents
  - Export all recordings from Recs folder
  - Select destination folder via native dialog
  - Progress indicator for batch exports
  - Option to preserve or flatten folder structure
  - **Use Case**: Especially useful for backing up recordings made on the hardware to the computer. Users can currently access files via SD card reader or Finder/Explorer.
- [ ] **Move/Copy samples between folders**
  - Move samples between Projects, Wavs, and Recs folders
  - Copy samples to create duplicates
  - Drag-and-drop to move samples
  - Conflict detection and resolution
  - Update preset references when moving samples (advanced)
  - **Rationale**: Users can achieve the same result by deleting samples and re-importing them to the desired location.
- [ ] **Sample ordering & smart numbering**
  - Auto-detect existing numbering scheme in target folder (e.g., 01_, 001_, etc.)
  - Continue numbering sequence for newly imported files
  - Option to manually prefix imported files with numbers
  - Preview final filenames before import
  - Drag-and-drop reordering in import dialog preview
  - Batch renumber existing samples in file tree
  - Visual preview of hardware order (1-128 index)
  - Support multiple formats: 01_, 001_, 1_, etc.
  - Option to add/remove numbering prefixes
  - Preserve original filenames after prefix
  - **Rationale**: Since samples are alphabetically sorted on the Multigrain module, numeric prefixes control playback order. Users can manually rename files to achieve this.
- [ ] **Detailed storage limits tracking** (e.g., "48/128 samples in PROJECT folder")
  - Show current vs. maximum sample counts per location
  - Visual progress bars or indicators
  - Warning when approaching limits
- [ ] **Action visibility in right panel**
  - Show "Create New Project" button on overview page
  - Show "Import Samples" / "Rename" buttons when project selected
  - Duplicate key context menu actions as buttons for better discoverability
- [ ] **Advanced search and filtering**
  - Search samples by name or description
  - Filter by sample location (PROJECT/WAVS/RECS)
  - Filter presets that use specific samples
- [ ] **Sample waveform thumbnails in lists**
  - Compact waveform previews in file tree
  - Visual identification of samples
- [ ] **Drag-and-drop file import**
  - Drop files directly onto project/folder nodes
  - Visual feedback during drag operations
- [ ] **Keyboard shortcuts**
  - Common operations (import, export, create project)
  - Navigation shortcuts
- [ ] **Dark mode theme**
  - Alternative color scheme
  - Respect system preferences

**Status**: Collection of polish features to enhance usability. Implement as time/resources allow.

---

## Current Progress: ~85% Complete

### What's Working
- ✅ Complete browsing and navigation of Multigrain SD cards
- ✅ Full audio preview with waveform visualization
- ✅ Project and sample metadata management
- ✅ Custom naming for projects
- ✅ Sample descriptions
- ✅ Preset viewer with sample reference extraction
- ✅ Intelligent sample location resolution
- ✅ Autosave preset display on project selection
- ✅ Independent scroll areas for better UX
- ✅ Factory project names initialization
- ✅ Basic statistics overview
- ✅ **Sample import with automatic format conversion**
- ✅ **FFmpeg integration for audio conversion**
- ✅ **Auto-trimming files >32 seconds**
- ✅ **Automatic filename conflict resolution**
- ✅ **Storage limit enforcement**
- ✅ **Project creation with bank/position selection UI**
- ✅ **Delete operations for projects and samples**
- ✅ **Smart navigation after deletion**
- ✅ **Confirmation dialogs with comprehensive warnings**
- ✅ **Sample renaming with inline editing**
- ✅ **Filename validation and conflict detection**

### What's Next (Priority Order)
1. **Phase 5: Automated Testing** ⚠️ HIGH PRIORITY - Implement ASAP before adding more features
2. **Phase 4d**: Preset custom naming
3. **Phase 7**: Reference sheet export (printable PDF documentation)
4. **Phase 8**: Polish and user experience improvements
5. **Phase 9**: CI/CD and distribution
6. **Phase 10**: Nice to have features (move/copy, sample ordering, advanced features)

---

## Key Files (Implementation Status)
```
src/
├── main/
│   ├── index.ts              ✅ Electron main process
│   ├── preload.ts            ✅ IPC bridge (electronAPI)
│   ├── ipc/                  ✅ IPC handlers
│   │   ├── index.ts          ✅ File operations & folder selection
│   │   ├── audio.ts          ✅ Audio metadata read/write
│   │   ├── projectMetadata.ts ✅ Project custom naming + batch updates
│   │   └── preset.ts         ✅ Preset sample extraction
│   └── utils/
│       └── multigrain.ts     ✅ Multigrain structure validation + autosave
├── renderer/
│   ├── App.tsx               ✅ Main application component + factory names
│   ├── index.html            ✅ HTML entry point
│   ├── components/
│   │   ├── FileTree.tsx      ✅ File browser with project selection
│   │   ├── AudioPlayer.tsx   ✅ Playback + waveform + metadata
│   │   └── PresetViewer.tsx  ✅ Preset sample viewer with navigation
│   ├── hooks/
│   │   └── useMultigrain.ts  ✅ State management hook
│   └── styles/
│       └── globals.css       ✅ Tailwind imports
└── shared/
    ├── types.ts              ✅ TypeScript definitions
    └── constants.ts          ✅ Factory project names + specs

Configuration Files:
├── package.json              ✅ Dependencies & scripts
├── tailwind.config.js        ✅ Custom theme configuration
├── webpack.main.config.js    ✅ Main process webpack config
├── forge.config.js           ✅ Electron Forge configuration
└── tsconfig.json             ✅ TypeScript configuration
```

### Files for Phase 4a: Import Feature ✅ **COMPLETE**

**New Files Created**:
```
src/
├── main/
│   ├── ipc/
│   │   ├── audioConversion.ts     ✅ FFmpeg conversion wrapper
│   │   └── audioImport.ts         ✅ Import orchestration handlers
│   └── utils/
│       └── fileConflictResolver.ts ✅ Filename conflict resolution
├── renderer/
│   └── components/
│       └── ImportDialog.tsx       ✅ Import UI modal
└── shared/
    └── types/
        └── import.ts              ✅ Import type definitions
```

**Files Modified**:
```
src/
├── main/
│   ├── ipc/index.ts               ✅ Added import handler registration
│   └── preload.ts                 ✅ Exposed import API
├── renderer/
│   ├── App.tsx                    ✅ Added onImportComplete callback
│   ├── components/
│   │   └── FileTree.tsx           ✅ Added import buttons
└── shared/
    └── types.ts                   ✅ Exported import types

Configuration:
├── webpack.main.config.js         ✅ Added FFmpeg externals + path aliases
└── package.json                   ✅ Added FFmpeg dependencies
```

### Files for Phase 4b: Delete Operations ✅ **COMPLETE**
```
src/
├── main/
│   └── ipc/
│       └── fileOperations.ts      ✅ Delete operations with security validation
└── renderer/
    └── components/
        └── ConfirmDialog.tsx      ✅ Reusable confirmation dialog
```

### Files for Phase 4c: Rename Operations ✅ **COMPLETE**
```
src/
├── main/
│   └── ipc/
│       └── fileOperations.ts      ✅ Added renameSample handler (existing file)
└── renderer/
    └── components/
        └── FileTree.tsx           ✅ Added inline rename UI (existing file)
```

**Note**: Rename functionality was integrated into existing files rather than creating new modules.
