# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multigrain Sample Manager is an Electron + React + TypeScript desktop application for managing audio samples on SD cards for the Instruō Multigrain Eurorack synthesizer module.

## Build Commands

```bash
npm start          # Development server with hot reload
npm run package    # Package for current platform
npm run make       # Create distributable installers
```

No testing or linting is currently configured.

## Architecture

### Process Model (Electron)

- **Main process** (`src/main/`): Node.js runtime handling file system, audio metadata, and IPC
- **Renderer process** (`src/renderer/`): React UI running in Chromium
- **Preload script** (`src/main/preload.ts`): Secure bridge exposing `electronAPI` to renderer via context bridge

### IPC Communication Pattern

All main process functionality is exposed through typed IPC handlers:

1. Define handler in `src/main/ipc/<module>.ts`
2. Register in `src/main/ipc/index.ts`
3. Expose via `contextBridge` in `src/main/preload.ts`
4. Add types to `src/shared/types.ts`
5. Call from renderer as `window.electronAPI.<method>()`

### Key IPC Modules

| Module | Purpose |
|--------|---------|
| `fileSystem.ts` | Directory reading, metadata files (.project-metadata.json, .metadata.txt) |
| `audio.ts` | WAV metadata extraction using music-metadata library |
| `preset.ts` | Binary .mgp preset file parsing to extract sample references |
| `projectMetadata.ts` | Custom project naming, factory names batch updates |
| `drives.ts` | Drive/volume detection |
| `multigrain.ts` | SD card structure validation |

### UI Components

| Component | Purpose |
|-----------|---------|
| `FileTree.tsx` | Hierarchical file browser for Projects/Wavs/Recs |
| `AudioPlayer.tsx` | WaveSurfer.js waveform visualization and playback |
| `PresetViewer.tsx` | Displays 8 sample references from .mgp presets |

### State Management

- React hooks + `useMultigrain` custom hook for central structure state
- localStorage for persistence (SD card path, auto-play preference)

## Multigrain Hardware Constraints

### Audio File Requirements
- Format: WAV (PCM), 48kHz, 16-bit, stereo, max 32 seconds

### Storage Limits
- 48 projects (Project01-Project48)
- 128 samples per project folder
- 128 global samples in /Wavs
- 1024 recordings in /Recs
- 48 presets per project (.mgp files)

### SD Card Structure
```
Multigrain/
├── Project01/ to Project48/   (each contains .wav samples and .mgp presets)
├── Recs/                      (global recordings)
├── Wavs/                      (global samples)
└── Settings.mgs               (module settings)
```

### Sample Indexing
- `/PROJECT` and `/WAVS`: Alphabetically sorted
- `/RECS`: Chronologically sorted (newest first by mtime)

## Key Types (src/shared/types.ts)

- `MultigainStructure`: Root data model for entire SD card state
- `Project`: Contains presets, samples, customName
- `PresetWithSamples`: Preset with extracted sample filenames
- `FileEntry`, `WavFile`: File system representations

## Binary File Formats

### .mgp Preset Files
- 16KB fixed size binary format
- Contains 8 sample references per preset
- Sample filenames extractable as ASCII strings
- Folder location (PROJECT/WAVS/RECS) encoded but partially decoded

### .mgs Settings File
- Global module settings (proprietary binary format)

## Path Aliases

TypeScript path aliases configured in tsconfig.json:
- `@shared/*` → `src/shared/*`
