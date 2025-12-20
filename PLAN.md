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

### Phase 4: File Operations ❌ **NOT STARTED**
- [ ] Import samples with **automatic format conversion**:
  - [ ] Convert any sample rate → 48 kHz
  - [ ] Convert any bit depth → 16-bit
  - [ ] Convert mono → stereo (duplicate channel)
  - [ ] Trim files longer than 32 seconds (with user prompt)
- [ ] Move/copy samples between folders
- [ ] Rename samples
- [ ] Delete samples (with confirmation)

**Status**: Awaiting implementation. Will require FFmpeg integration for audio conversion.

**Dependencies needed**:
- `fluent-ffmpeg` or similar for audio conversion
- FFmpeg binaries bundled with app

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

## Current Progress: ~75% Complete

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

### What's Next (Priority Order)
1. **Phase 4**: File operations (import/move/rename/delete) - HIGH PRIORITY
2. **FFmpeg Integration**: Audio format conversion on import
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

### Files Still Needed for Phase 4
```
src/
├── main/
│   └── ipc/
│       ├── fileOperations.ts  ❌ Copy/move/rename/delete operations
│       └── audioConversion.ts ❌ FFmpeg integration
└── renderer/
    └── components/
        ├── ImportDialog.tsx   ❌ Sample import UI
        └── FileOperations.tsx ❌ Context menu for file ops
```
