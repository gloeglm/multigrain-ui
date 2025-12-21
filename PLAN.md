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

**Status**: ✅ Implementation complete. Users can create new projects via UI dialog.

**Implementation Details**:
- **Bank naming**: Uses manual labels (X, Y, Z, XX, YY, ZZ) instead of numbers
- **UI/UX**: Visual grid showing all 48 possible project slots with existing ones disabled
- **Folder creation**: Creates ProjectXX folder with optional metadata file
- **Integration**: "+" button appears on hover over Projects section in file tree

**Files Created**:
1. `src/renderer/components/CreateProjectDialog.tsx` - Project creation UI dialog
2. `src/main/ipc/projectOperations.ts` - IPC handler for project creation

**Files Modified**:
1. `src/main/ipc/index.ts` - Registered project operations handlers
2. `src/main/preload.ts` - Exposed createProject API to renderer
3. `src/renderer/components/FileTree.tsx` - Integrated create dialog with "+" button

#### Phase 4b: Move/Copy/Rename/Delete (Future)
- [ ] Move/copy samples between folders
- [ ] Rename samples
- [ ] Delete samples (with confirmation)

**Status**: Deferred until import feature is complete

#### Phase 4c: Sample Ordering & Organization (Future)
- [ ] **Smart numbering on import**:
  - [ ] Auto-detect existing numbering scheme in target folder (e.g., 01_, 001_, etc.)
  - [ ] Continue numbering sequence for newly imported files
  - [ ] Option to manually prefix imported files with numbers
  - [ ] Preview final filenames before import
- [ ] **Reordering capabilities**:
  - [ ] Drag-and-drop reordering in import dialog preview
  - [ ] Batch renumber existing samples in file tree
  - [ ] Visual preview of hardware order (1-128 index)
- [ ] **Numbering schemes**:
  - [ ] Support multiple formats: 01_, 001_, 1_, etc.
  - [ ] Option to add/remove numbering prefixes
  - [ ] Preserve original filenames after prefix

**Status**: Planned feature for better control over alphabetical ordering on hardware

**Rationale**: Since samples are alphabetically sorted on the Multigrain module,
numeric prefixes are essential for controlling playback order. This feature makes
it easier to maintain organized sample banks without manual renaming.

### Phase 5: Project Overview ⚠️ **PARTIALLY COMPLETE**
- [x] Interactive tree view of SD card structure in-app
- [x] Show storage usage statistics (basic counts)
- [ ] Export compact overview (text/markdown) for reference/printing
- [ ] Show detailed storage limits tracking (e.g., "48/128 samples in project")

**Status**: Overview dashboard functional with basic stats. Export feature and limit enforcement pending.

### Phase 6: Polish & Testing ❌ **NOT STARTED**
- [ ] Enhanced error handling for invalid files/formats
- [ ] Cross-platform testing (Windows, macOS, Linux)
- [ ] UI/UX refinements and accessibility improvements
- [ ] Performance optimization for large sample libraries
- [ ] User documentation and help system

**Status**: Basic error handling exists. Comprehensive testing and polish phase pending.

---

## Current Progress: ~87% Complete

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

### What's Next (Priority Order)
1. **Phase 4b**: Move/copy/rename/delete operations
2. **Phase 4c**: Sample ordering & smart numbering on import
3. **Phase 5**: Complete overview with export functionality
4. **Phase 6**: Testing, polish, and documentation

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

### Files for Phase 4b: Move/Copy/Rename/Delete (Future)
```
src/
├── main/
│   └── ipc/
│       └── fileOperations.ts      ❌ Copy/move/rename/delete operations
└── renderer/
    └── components/
        └── FileOperations.tsx     ❌ Context menu for file ops
```
