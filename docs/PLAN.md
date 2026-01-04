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

### Phase 1-3: Core Infrastructure ✅ **COMPLETE**
- [x] Electron + React + TypeScript with Tailwind CSS custom theme
- [x] SD card browsing with Multigrain folder structure validation
- [x] File tree navigation with custom project naming
- [x] Audio preview with WaveSurfer.js waveform visualization
- [x] Sample metadata management (descriptions, technical details)
- [x] Preset viewer with 8-sample references and intelligent location resolution
- [x] Factory project names initialization, auto-play toggle

### Phase 4: File Operations 🚧 **IN PROGRESS**

#### Phase 4a: Import & Project Creation ✅ **COMPLETE**
- [x] Sample import with FFmpeg auto-conversion (48kHz, 16-bit, stereo, 32s max)
- [x] Filename conflict resolution, storage limit enforcement
- [x] Project creation with bank/position grid, window state persistence

#### Phase 4b-c: Delete & Rename Operations ✅ **COMPLETE**
- [x] Delete projects/samples with confirmation dialogs and smart navigation
- [x] Inline sample rename with conflict detection, bidirectional sync (FileTree ↔ SampleInfo)
- [x] Path-based selection architecture (eliminates stale references)

#### Phase 4d: Preset Custom Naming ❌ **NOT STARTED**
- [ ] Custom naming for presets (similar pattern to project naming)
- [ ] Store in `.preset-metadata.json`, display as "Preset01 - My Custom Name"

### Phase 5: Automated Testing 🚧 **IN PROGRESS - HIGH PRIORITY**

Implement automated testing to catch bugs early and enable confident refactoring. Recent rename synchronization issues highlighted the need for comprehensive test coverage.

**Current Status**: 217 tests passing across 13 test files (54 infrastructure/utility + 29 IPC handler + 11 App + 23 SampleInfo + 8 integration tests + 18 PDF export + 13 WelcomeScreen + 21 ImportDialog + 46 sampleNumbering)

#### Phase 5a-d: Test Infrastructure & Core Testing ✅ **COMPLETE**
- [x] Vitest + React Testing Library setup with memfs for IPC mocking
- [x] Utility function tests (fileConflictResolver, constants, App helpers) - 54 tests
- [x] IPC handler tests (rename, delete operations with security validation) - 29 tests
- [x] Component refactoring: Split AudioPlayer into AudioWaveform, SampleInfo, SampleTechnicalDetails, SampleView
- [x] SampleInfo component tests (rename, description, validation, error handling) - 23 tests
- [x] WelcomeScreen component tests - 13 tests
- [x] ImportDialog component tests - 18 tests
- [x] Implemented data-testid best practices, documented in CLAUDE.md
- [x] Bug fixes: stop button, endless loop, UI consistency

**Architecture**: Components now follow Single Responsibility Principle for better testability

#### Phase 5e: Additional Component & Integration Tests 🚧 **IN PROGRESS**
- [ ] AudioWaveform component tests (WaveSurfer initialization, controls, auto-play)
- [ ] SampleTechnicalDetails component tests (metadata loading, display)
- [x] Integration tests (rename sync between FileTree/SampleInfo verified) - 8 tests
- [ ] Error recovery tests (failed operations, validation)
- [ ] Additional integration workflows (delete navigation, multi-step operations)

### Phase 6: Project Overview ✅ **COMPLETE**
- [x] Interactive tree view with clickable Multigrain/Projects nodes for overview
- [x] Storage usage statistics, unified selection architecture with type-safe state

### Phase 7: Reference Sheet Export ✅ **FUNCTIONAL - LAYOUT IMPROVEMENTS PENDING**

Generate printable PDF reference sheets to help users remember which projects are which and which samples are used where.

**Two Types of Reference Sheets**:

1. **Overview Sheet** - General SD card overview
   - [x] List all projects with bank/position mapping (e.g., "X / 1 - Project Name")
   - [x] Show custom names if set
   - [x] Display sample/preset counts per project
   - [ ] Layout improvements (optimize spacing, table formatting)

2. **Project Sheets** - Detailed per-project reference
   - [x] List available samples in the project
   - [x] Show which presets use which samples (including Autosave)
   - [x] Include user descriptions for samples
   - [x] Display sample location badges (PROJECT/WAVS/RECS)
   - [x] Exclude technical details (sample rate, bit depth, file sizes)
   - [ ] Layout improvements (optimize spacing, better formatting)

**Implementation Status**:
- [x] Install PDFKit dependency (`pdfkit`, `@types/pdfkit`)
- [x] Create data aggregation utilities (overview data, project data with preset-to-sample mapping)
- [x] Build PDF generator with compact layouts (overview table, samples list, presets with 8 sample slots)
- [x] Add IPC handlers for three export types (overview, single project, batch all projects)
- [x] Create React hook for export operations with loading states
- [x] Add context menu items: "Export Overview Sheet", "Export Project Sheet", "Export All Project Sheets"
- [x] Implement file name sanitization for special characters
- [x] Build reverse mapping: sample → presets that use it (for "Used by" lists)
- [x] PDFs open in system browser (cross-platform)
- [x] Shared preset parser utility to eliminate code duplication
- [x] Empty preset slot filtering (bug fix)
- [x] Comprehensive test coverage (18 new tests)
- [ ] Test cross-platform PDF generation (Windows tested, macOS/Linux pending)

**Files Created**:
1. ✅ `src/main/ipc/pdfExport.ts` - IPC handlers for PDF export operations
2. ✅ `src/main/utils/pdfGenerator.ts` - Core PDF generation logic using PDFKit
3. ✅ `src/main/utils/pdfLayouts.ts` - Layout constants (page dimensions, fonts, colors)
4. ✅ `src/main/utils/exportDataAggregator.ts` - Data preparation and sample resolution
5. ✅ `src/main/utils/presetParser.ts` - Shared preset file parsing utility
6. ✅ `src/renderer/hooks/usePdfExport.ts` - React hook for export UI integration
7. ✅ `src/main/utils/presetParser.test.ts` - Preset parser tests (8 tests)
8. ✅ `src/main/utils/exportDataAggregator.test.ts` - Data aggregator tests (10 tests)

**Files Modified**:
1. ✅ `src/main/ipc/index.ts` - Register PDF export handlers
2. ✅ `src/main/preload.ts` - Expose PDF export API to renderer
3. ✅ `src/shared/types.ts` - Add `OverviewData` and `ProjectExportData` interfaces
4. ✅ `src/renderer/components/FileTree.tsx` - Add context menu items for export
5. ✅ `package.json` - Add pdfkit dependency
6. ✅ `src/main/ipc/preset.ts` - Use shared preset parser
7. ✅ `src/main/index.ts` - Add development menu with reload shortcuts

**Status**: Core functionality implemented and tested. PDFs generate correctly with accurate data. Layout refinements needed for better print presentation. System browser preview works reliably across platforms.

**Key Bug Fixes**:
- ✅ Fixed "Not used in any presets" issue by creating shared preset parser
- ✅ Filter empty preset slots in sample usage mapping
- ✅ Correct bank naming (X, Y, Z, XX, YY, ZZ)

**Design Decisions**:
- PDFKit over Puppeteer (smaller, no Chromium dependency)
- Main process over renderer (better file system access, no IPC overhead for large data)
- Context menus as primary trigger (consistent with existing UI patterns)
- System browser for preview (more reliable than Electron's PDF viewer)
- Batch export to folder (more efficient than individual file dialogs)

### Phase 8: Polish & User Experience ❌ **NOT STARTED**

#### Phase 8a: Tree Navigation Controls
- [ ] **Collapse All button** in tree view header
  - Add button next to file tree title/path display
  - Collapse all expanded projects and folders
  - Maintain current selection after collapse
  - Visual feedback (button state/icon)
  - Consider adding "Expand All" as complementary feature
- [ ] Arrow key navigation (up/down) through file tree items
- [ ] Build flattened navigation list respecting expansion states
- [ ] Add keyboard event handler at FileTree root
- [ ] Focus management with visible focus indicator
- [ ] Handle rename mode conflicts (skip navigation when editing)
- [ ] Test navigation at boundaries and with collapsed sections

#### Phase 8b: Multi-Select Delete
- [ ] Multi-select state for samples with Ctrl/Cmd+Click toggle
- [ ] Shift+Click range selection
- [ ] Visual feedback for multi-selected items (blue highlight)
- [ ] Floating action bar with delete/cancel buttons
- [ ] Batch delete confirmation dialog with sample count
- [ ] Delete key shortcut for batch delete
- [ ] Escape key to exit multi-select mode
- [ ] Error handling for partial batch delete failures

**Note**: Full implementation plan available in `.claude/plans/serialized-questing-honey.md`

#### Phase 8c: General Polish
- [ ] Enhanced error handling for invalid files/formats
- [ ] Cross-platform testing (Windows, macOS, Linux)
- [ ] UI/UX refinements and accessibility improvements
- [ ] Performance optimization for large sample libraries
- [ ] User documentation and help system
- [ ] CreateProjectDialog should submit on Enter key
- [ ] Comprehensive error messages and user guidance
- [ ] Edge case handling (corrupted files, permissions issues)

**Status**: Basic error handling exists. Comprehensive testing and polish phase pending.

### Phase 9: Distribution & Deployment 🚧 **IN PROGRESS**

#### Phase 9a: CI/CD Testing Pipeline ✅ **COMPLETE**
- [x] GitHub Actions workflow for automated testing
- [x] Run on push and pull requests to main branch
- [x] Type checking with TypeScript (tsc --noEmit)
- [x] Code linting with ESLint (strict mode, --max-warnings 0)
- [x] Test suite execution (217 tests)
- [x] Test results artifact upload
- [x] Status badge in README

**Test Workflow** (`.github/workflows/test.yml`):
- Runs on ubuntu-latest with Node.js 20
- Executes: `npm ci → type-check → lint → test`
- Badge: `![Tests](https://github.com/gloeglm/multigrain-ui/actions/workflows/test.yml/badge.svg)`
- Current: 168 tests, 0 TypeScript errors, 0 ESLint warnings

#### Phase 9b: Code Quality & Linting ✅ **COMPLETE**
- [x] ESLint 9 with flat config (eslint.config.js)
- [x] TypeScript ESLint plugin with recommended rules
- [x] React and React Hooks linting
- [x] Prettier integration for code formatting
- [x] Strict linting: --max-warnings 0 (zero tolerance)
- [x] Separate rules for test files (relaxed any types)
- [x] Scripts: lint, lint:fix, format, format:check, type-check
- [x] All 150 tests pass, zero linting warnings, zero type errors

**Linting Configuration**:
- ESLint 9 flat config with TypeScript, React, Prettier plugins
- Prettier for consistent formatting (single quotes, 100 char width, semicolons)
- Test files allow `any` types for mocking flexibility
- React hooks exhaustive-deps disabled where intentional

#### Phase 9c: Build & Release Automation ✅ **COMPLETE**
- [x] Multi-platform builds (Windows, macOS, Linux) on native runners
- [x] Publish to GitHub Releases with version tagging
- [x] Release workflow (`.github/workflows/release.yml`)
- [x] Two beta releases published (v0.1.0-beta.1, v0.1.0-beta.2)
- [ ] Code signing setup (future)
  - [ ] macOS: Apple Developer ID signing + notarization
  - [ ] Windows: Code signing certificate
- [ ] Auto-update mechanism (future)

**Status**: Full CI/CD pipeline operational. Multi-platform builds and GitHub Releases working. Code signing deferred to future release.

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
- [x] **Sample ordering & smart numbering** ✅ **COMPLETE** → See [detailed plan](./sample-numbering-plan.md)
  - [x] Optional number prefix during import (e.g., 01_kick.wav)
  - [x] Auto-detect existing numbering scheme and continue sequence
  - [x] Support for multiple separator styles (_, space, -, " - ", .)
  - [x] Drag-and-drop reordering in import dialog when numbering enabled
  - [x] Preview shows actual numbers that will be applied
  - [x] Persistent preference (localStorage)
  - [ ] Context menu action to add prefixes to existing samples (future)
  - [ ] Layout improvements for numbering UI (pending)
  - **Status**: Import numbering feature complete. Manual numbering action deferred.
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

## Current Progress: ~92% Complete

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
- ✅ **PDF reference sheet export (overview and project sheets)**
- ✅ **System browser PDF preview**
- ✅ **Batch export of all project sheets**
- ✅ **Sample numbering during import with auto-detection**
- ✅ **CI/CD pipeline with automated testing (217 tests)**
- ✅ **Multi-platform release builds (Windows, macOS, Linux)**
- ✅ **GitHub Releases integration (v0.1.0-beta.1, v0.1.0-beta.2)**
- ✅ **Welcome screen with SD card selection**

### What's Next (Priority Order)
1. **Sample Numbering Layout** - UI improvements for the numbering feature in ImportDialog
2. **Phase 5e: Additional Tests** - AudioWaveform, SampleTechnicalDetails, error recovery tests
3. **Phase 7**: PDF layout improvements (spacing, formatting)
4. **Phase 4d**: Preset custom naming
5. **Phase 8**: Polish and user experience improvements (collapse all, keyboard nav, multi-select)
6. **Phase 10**: Nice to have features (move/copy, manual numbering action)

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
│   │   ├── preset.ts         ✅ Preset sample extraction
│   │   └── pdfExport.ts      ✅ PDF export operations
│   └── utils/
│       ├── multigrain.ts     ✅ Multigrain structure validation + autosave
│       ├── presetParser.ts   ✅ Shared preset file parser
│       ├── pdfGenerator.ts   ✅ PDF generation with PDFKit
│       ├── pdfLayouts.ts     ✅ PDF layout constants
│       ├── exportDataAggregator.ts ✅ PDF data preparation
│       └── sampleNumbering.ts ✅ Number prefix detection & application
├── renderer/
│   ├── App.tsx               ✅ Main application component + factory names
│   ├── index.html            ✅ HTML entry point
│   ├── components/
│   │   ├── FileTree.tsx      ✅ File browser with project selection
│   │   ├── SampleView.tsx    ✅ Sample display composition component
│   │   ├── AudioWaveform.tsx ✅ WaveSurfer.js waveform + playback
│   │   ├── SampleInfo.tsx    ✅ Editable sample info (rename, description)
│   │   ├── SampleTechnicalDetails.tsx ✅ Read-only metadata display
│   │   ├── PresetViewer.tsx  ✅ Preset sample viewer with navigation
│   │   ├── ImportDialog.tsx  ✅ Sample import with validation
│   │   ├── WelcomeScreen.tsx ✅ Initial welcome + SD card selection
│   │   ├── ConfirmDialog.tsx ✅ Reusable confirmation dialog
│   │   └── CreateProjectDialog.tsx ✅ Project creation UI
│   ├── hooks/
│   │   ├── useMultigrain.ts  ✅ State management hook
│   │   └── usePdfExport.ts   ✅ PDF export operations hook
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
├── tsconfig.json             ✅ TypeScript configuration
├── eslint.config.js          ✅ ESLint 9 flat config
├── .prettierrc.json          ✅ Prettier formatting rules
└── .prettierignore           ✅ Prettier exclusions

CI/CD Files:
└── .github/
    ├── workflows/
    │   ├── test.yml          ✅ GitHub Actions test workflow
    │   └── release.yml       ✅ Multi-platform build & release workflow
    └── CI_CD.md              ✅ CI/CD documentation
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
