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

**Current Status**: 111 tests passing (54 infrastructure/utility + 29 IPC handler + 11 App + 23 SampleInfo + 2 integration tests)

#### Phase 5a-d: Test Infrastructure & Core Testing ✅ **COMPLETE**
- [x] Vitest + React Testing Library setup with memfs for IPC mocking
- [x] Utility function tests (fileConflictResolver, constants, App helpers) - 54 tests
- [x] IPC handler tests (rename, delete operations with security validation) - 29 tests
- [x] Component refactoring: Split AudioPlayer into AudioWaveform, SampleInfo, SampleTechnicalDetails, SampleView
- [x] SampleInfo component tests (rename, description, validation, error handling) - 23 tests
- [x] Implemented data-testid best practices, documented in CLAUDE.md
- [x] Bug fixes: stop button, endless loop, UI consistency

**Architecture**: Components now follow Single Responsibility Principle for better testability

#### Phase 5e: Additional Component & Integration Tests 🚧 **IN PROGRESS**
- [ ] AudioWaveform component tests (WaveSurfer initialization, controls, auto-play)
- [ ] SampleTechnicalDetails component tests (metadata loading, display)
- [x] Integration tests (rename sync between FileTree/SampleInfo verified) - 2 tests
- [ ] Error recovery tests (failed operations, validation)
- [ ] Additional integration workflows (delete navigation, multi-step operations)

### Phase 6: Project Overview ✅ **COMPLETE**
- [x] Interactive tree view with clickable Multigrain/Projects nodes for overview
- [x] Storage usage statistics, unified selection architecture with type-safe state

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

### Phase 9: Distribution & Deployment 🚧 **IN PROGRESS**

#### Phase 9a: CI/CD Testing Pipeline ✅ **COMPLETE**
- [x] GitHub Actions workflow for automated testing
- [x] Run on push and pull requests to main branch
- [x] Type checking with TypeScript (tsc --noEmit)
- [x] Code linting with ESLint (strict mode, --max-warnings 0)
- [x] Test suite execution (111 tests)
- [x] Test results artifact upload
- [x] Status badge in README

**Test Workflow** (`.github/workflows/test.yml`):
- Runs on ubuntu-latest with Node.js 20
- Executes: `npm ci → type-check → lint → test`
- Badge: `![Tests](https://github.com/gloeglm/multigrain-ui/actions/workflows/test.yml/badge.svg)`

#### Phase 9b: Code Quality & Linting ✅ **COMPLETE**
- [x] ESLint 9 with flat config (eslint.config.js)
- [x] TypeScript ESLint plugin with recommended rules
- [x] React and React Hooks linting
- [x] Prettier integration for code formatting
- [x] Strict linting: --max-warnings 0 (zero tolerance)
- [x] Separate rules for test files (relaxed any types)
- [x] Scripts: lint, lint:fix, format, format:check, type-check
- [x] All 111 tests pass, zero linting warnings, zero type errors

**Linting Configuration**:
- ESLint 9 flat config with TypeScript, React, Prettier plugins
- Prettier for consistent formatting (single quotes, 100 char width, semicolons)
- Test files allow `any` types for mocking flexibility
- React hooks exhaustive-deps disabled where intentional

#### Phase 9c: Build & Release Automation ❌ **NOT STARTED**
- [ ] Multi-platform builds (Windows, macOS, Linux) on native runners
- [ ] Publish to GitHub Releases with draft review
- [ ] Version tagging and release process documentation
- [ ] Code signing setup (future)
  - [ ] macOS: Apple Developer ID signing + notarization
  - [ ] Windows: Code signing certificate
- [ ] Auto-update mechanism (future)

**Status**: Testing pipeline complete with linting and type checking. Build/release automation pending.

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
├── tsconfig.json             ✅ TypeScript configuration
├── eslint.config.js          ✅ ESLint 9 flat config
├── .prettierrc.json          ✅ Prettier formatting rules
└── .prettierignore           ✅ Prettier exclusions

CI/CD Files:
└── .github/
    ├── workflows/
    │   └── test.yml          ✅ GitHub Actions test workflow
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
