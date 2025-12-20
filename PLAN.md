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

### Phase 1: Project Setup
1. Initialize Electron + React + TypeScript project
2. Configure Tailwind CSS
3. Set up IPC communication between main/renderer processes
4. Create basic window with file system access

### Phase 2: SD Card Detection & Browsing
1. Implement SD card/drive detection
2. Validate Multigrain folder structure
3. Build file tree component for navigation
4. Display project/preset/sample hierarchy

### Phase 3: Audio Preview
1. Integrate Web Audio API for playback
2. Add waveform visualization (using wavesurfer.js or similar)
3. Implement play/pause/stop controls
4. Show sample metadata (duration, format validation)

### Phase 4: File Operations
1. Import samples with **automatic format conversion**:
   - Convert any sample rate → 48 kHz
   - Convert any bit depth → 16-bit
   - Convert mono → stereo (duplicate channel)
   - Trim files longer than 32 seconds (with user prompt)
2. Move/copy samples between folders
3. Rename samples
4. Delete samples (with confirmation)

### Phase 5: Project Overview
1. Interactive tree view of SD card structure in-app
2. Export compact overview (text/markdown) for reference/printing
3. Show storage usage statistics (samples per folder, total count vs limits)

### Phase 6: Polish & Testing
1. Error handling for invalid files/formats
2. Cross-platform testing (Windows, macOS, Linux)
3. UI/UX refinements

---

## Key Files to Create
```
src/
├── main/
│   ├── index.ts              # Electron main process
│   ├── ipc/                   # IPC handlers
│   │   ├── fileSystem.ts     # File operations
│   │   └── audio.ts          # Audio processing
│   └── utils/
│       └── multigrain.ts     # Multigrain structure validation
├── renderer/
│   ├── App.tsx
│   ├── components/
│   │   ├── FileTree.tsx      # File browser
│   │   ├── AudioPlayer.tsx   # Playback controls
│   │   ├── Waveform.tsx      # Waveform display
│   │   └── ProjectOverview.tsx
│   ├── hooks/
│   │   └── useFileSystem.ts
│   └── types/
│       └── multigrain.ts     # Type definitions
└── shared/
    └── constants.ts          # Multigrain specs
```
