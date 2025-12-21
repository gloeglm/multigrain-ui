# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multigrain Sample Manager is an Electron + React + TypeScript desktop application for managing audio samples on SD cards for the Instruō Multigrain Eurorack synthesizer module.

**Current Status**: ~85% complete. Core features implemented and tested with full CI/CD pipeline.

### Implemented Features

- ✅ Browse & navigate SD card structure with validation
- ✅ Audio preview with waveform visualization (WaveSurfer.js)
- ✅ Sample import with auto-conversion (FFmpeg: 48kHz/16-bit/stereo)
- ✅ File operations: rename samples, delete samples/projects with confirmation
- ✅ Project management: create projects, custom naming with factory presets
- ✅ Preset viewer with intelligent sample location resolution (PROJECT → WAVS → RECS)
- ✅ Metadata editing: custom descriptions for projects and samples
- ✅ Project overview dashboard with statistics
- ✅ Comprehensive test suite (111 tests) with CI/CD integration

### Remaining Features (See PLAN.md)

- Preset custom naming
- PDF reference sheet export
- Enhanced file operations (move/copy samples)
- Search and filtering

## Build Commands

```bash
# Development
npm start              # Development server with hot reload
npm run package        # Package for current platform
npm run make           # Create distributable installers

# Code Quality (MUST pass before committing)
npm run type-check     # TypeScript type checking (0 errors required)
npm run lint           # ESLint code quality (0 warnings required)
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting

# Testing
npm test               # Run test suite with vitest (watch mode)
npm test -- --run      # Run once (CI mode)
npm run test:ui        # Run tests with UI
npm run test:coverage  # Generate coverage report
```

## Development Workflow

**Before committing ANY code**, ensure all quality checks pass:

```bash
npm run type-check && npm run lint && npm test -- --run
```

**CI/CD**: GitHub Actions automatically runs these checks on every push/PR to `main`. All checks must pass.

### Code Quality Standards

- **TypeScript**: Strict mode enabled, 0 type errors required
- **ESLint 9**: Flat config with TypeScript, React, and Prettier rules, 0 warnings required (`--max-warnings 0`)
- **Prettier**: Consistent formatting (single quotes, 100 char width, semicolons, LF line endings)
- **Testing**: Comprehensive test coverage for all new features

## Testing Requirements

**IMPORTANT: All new functionality MUST be covered by tests before committing.**

### Test Infrastructure

- **Test Runner**: Vitest with globals enabled (`describe`, `it`, `expect` available without imports)
- **Component Testing**: React Testing Library (@testing-library/react)
- **User Interactions**: @testing-library/user-event
- **File System Mocking**: memfs for IPC handler tests
- **Current Status**: 111 passing tests across 7 test files

### Test Organization

```
src/
├── test/
│   ├── setup.ts              # Global test setup, memfs mocking
│   └── helpers.ts            # Mock data factories (createMockSample, createMockProject)
├── main/
│   ├── ipc/*.test.ts         # IPC handler tests
│   └── utils/*.test.ts       # Utility function tests
├── renderer/
│   └── components/*.test.tsx # Component tests
└── shared/
    └── *.test.ts             # Shared logic tests
```

### Testing Guidelines

#### Component Tests
- **Use `data-testid` attributes** for stable test selectors (not text content)
  ```typescript
  // Component
  <button data-testid="rename-sample-button">✎</button>

  // Test
  screen.getByTestId('rename-sample-button')
  ```
- Test user interactions with `userEvent.setup()`
- Mock IPC calls in `beforeEach` using `vi.mocked(window.electronAPI.method)`
- Test loading states, error handling, and edge cases

#### IPC Handler Tests
- Use memfs for file system operations
- Test success paths, validation, and error handling
- Verify correct return types match TypeScript definitions

#### Test Coverage Expectations
- **New components**: Comprehensive test suite covering all user interactions
- **Bug fixes**: Add regression test demonstrating the fix
- **Refactoring**: Ensure existing tests still pass

### Running Tests

```bash
npm test              # Run tests in watch mode
npm test -- --run     # Run once (CI mode)
npm test -- <path>    # Run specific test file
```

### Current Test Status

- **111 tests passing** across 7 test files (1 skipped test for FileTree rename integration)
- Coverage: Setup, utilities, IPC handlers (fileOperations, audio, projectMetadata), components (App, SampleInfo), integration tests

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
| `index.ts` | File system operations, folder selection, SD card navigation |
| `audio.ts` | WAV metadata extraction/writing using music-metadata library |
| `audioConversion.ts` | FFmpeg wrapper for WAV conversion (48kHz, 16-bit, stereo) |
| `audioImport.ts` | Sample import orchestration with validation and conflict resolution |
| `fileOperations.ts` | Rename/delete operations for samples and projects with security validation |
| `preset.ts` | Binary .mgp preset file parsing to extract sample references |
| `projectMetadata.ts` | Custom project naming, factory names batch updates |
| `multigrain.ts` | SD card structure validation (in utils/) |

### UI Components

| Component | Purpose |
|-----------|---------|
| `FileTree.tsx` | Hierarchical file browser for Projects/Wavs/Recs with context menus for operations |
| `SampleView.tsx` | Composition component for sample display (name, audio, technical details) |
| `AudioWaveform.tsx` | WaveSurfer.js waveform visualization and playback controls |
| `SampleInfo.tsx` | Editable sample information (inline rename, description editing) |
| `SampleTechnicalDetails.tsx` | Read-only technical metadata display |
| `PresetViewer.tsx` | Displays 8 sample references from .mgp presets with intelligent location resolution |
| `ImportDialog.tsx` | Sample import UI with validation and conflict resolution |
| `ProjectCreationDialog.tsx` | New project creation with bank/position grid selection |
| `ConfirmDialog.tsx` | Reusable confirmation dialog for destructive operations |

**Component Architecture**: Components follow Single Responsibility Principle for better maintainability and testability. Path-based selection eliminates stale references.

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
