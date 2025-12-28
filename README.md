# Multigrain Sample Manager

A cross-platform desktop application for managing audio samples on SD cards for the [Multigrain Eurorack module](https://www.instruomodular.com/product/multigrain/).

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://github.com/gloeglm/multigrain-ui/actions/workflows/test.yml/badge.svg)
![Release](https://github.com/gloeglm/multigrain-ui/actions/workflows/release.yml/badge.svg)

## Features

### Currently Implemented ✅

- **Browse & Navigate** - Intuitive file tree for Projects (01-48), WAVS, and RECS folders with validation
- **Audio Preview** - Waveform visualization with play/pause/stop controls and auto-play toggle
- **Sample Management** - Import with auto-conversion (48kHz/16-bit/stereo), rename, delete operations
- **Project Management** - Create new projects, custom naming with factory presets, delete with confirmation
- **Preset Viewer** - Inspect all 8 sample references per preset with intelligent location resolution (PROJECT → WAVS → RECS)
- **Metadata Editing** - Add custom descriptions to projects and samples, view technical details (sample rate, bit depth, duration)
- **Project Overview** - Quick statistics dashboard showing total projects, samples, recordings, and per-project counts

### Coming Soon 🚧

- **Preset Custom Naming** - User-defined names for presets (similar to project naming)
- **Reference Sheet Export** - Generate printable PDF documentation of projects and sample usage
- **Enhanced File Operations** - Move/copy samples between folders, batch operations
- **Search & Filtering** - Find samples by name, description, or location

## Requirements

- **Multigrain SD Card** with proper folder structure:
  ```
  Multigrain/
  ├── Project01/ to Project48/
  ├── Recs/
  ├── Wavs/
  └── Settings.mgs
  ```

- **Audio Files** must meet Multigrain specifications:
  - Format: `.WAV`
  - Sample Rate: 48 kHz
  - Bit Depth: 16-bit
  - Channels: Stereo (2)
  - Max Length: 32 seconds

## Installation

### From Release (Recommended)

1. Download the latest release for your platform from the [Releases](../../releases) page
2. Install the application:
   - **macOS**: Open the `.dmg` and drag to Applications
     - ⚠️ **Important**: macOS will block the unsigned app. See [MACOS_INSTALL.md](MACOS_INSTALL.md) for bypass instructions
   - **Windows**: Run the `.exe` installer
   - **Linux**: Install the `.deb` or `.rpm` package

### From Source

```bash
# Clone the repository
git clone <repository-url>
cd multigrain-ui

# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run package
```

## Usage

1. **Launch the Application**
   - The application opens with an empty state

2. **Select Your SD Card**
   - Click "Select SD Card" in the top-right
   - Navigate to your SD card's `Multigrain` folder
   - The folder structure will be validated and loaded

3. **Load Factory Project Names** (Optional)
   - Click "Load Factory Names" button in the header
   - Confirm to apply Intellijel's factory project names
   - Projects 1-4, 9-13, and 17-21 will be named automatically

4. **Browse Samples**
   - Expand projects in the file tree (left panel)
   - Click on any project to view its Autosave.mgp preset
   - Click on any preset to see its 8 sample references
   - Click on any `.wav` file to preview it
   - Use the auto-play toggle to automatically play samples when selected

5. **Preview Audio**
   - View waveform visualization
   - Use play/pause/stop controls
   - Check sample metadata and technical details

6. **Inspect Presets**
   - Click on any `.mgp` preset file
   - View the 8 sample references with location badges
   - Click any sample to navigate to it and listen

7. **Customize Project Names**
   - Hover over a project folder
   - Click the edit button (✎)
   - Enter a custom name and save

8. **Add Sample Descriptions**
   - Select a sample
   - Click "Edit" in the Description section
   - Add notes about the sample

## Technology Stack

- **Electron** - Cross-platform desktop framework
- **React** - UI components
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **WaveSurfer.js** - Audio waveform visualization
- **music-metadata** - Audio file metadata reading

## Development

### Prerequisites

```bash
# Clone and install
git clone <repository-url>
cd multigrain-ui
npm install
```

### Available Scripts

**Development:**
- `npm start` - Start development server with hot reload
- `npm run package` - Package app for current platform
- `npm run make` - Create distributable installers

**Code Quality:**
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Check code style (zero warnings enforced)
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

**Testing:**
- `npm test` - Run test suite (111 tests)
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate coverage report

### Development Workflow

1. **Before committing**, ensure all checks pass:
   ```bash
   npm run type-check  # Must pass with 0 errors
   npm run lint        # Must pass with 0 warnings
   npm test            # All 111 tests must pass
   ```

2. **CI/CD** - GitHub Actions automatically runs these checks on every push/PR to `main`

3. **Code Standards:**
   - TypeScript strict mode enabled
   - ESLint with React and TypeScript rules
   - Prettier for consistent formatting
   - Test coverage for new features

### Project Structure

```
src/
├── main/              # Electron main process
│   ├── ipc/          # IPC handlers (file ops, audio, presets, imports)
│   └── utils/        # Multigrain validation, file operations
├── renderer/         # React UI
│   ├── components/   # FileTree, AudioWaveform, SampleInfo, PresetViewer
│   └── hooks/        # useMultigrain state management
└── shared/
    ├── types.ts      # TypeScript definitions
    └── constants.ts  # Multigrain specs, factory names
```

### Adding New Features

1. Create IPC handlers in `src/main/ipc/` for main process operations
2. Expose handlers via `electronAPI` in `src/main/preload.ts`
3. Add TypeScript types to `src/shared/types.ts`
4. Create React components in `src/renderer/components/`
5. Write tests for new functionality (see existing `*.test.ts` files)
6. Ensure all quality checks pass before committing

## Multigrain Specifications

### Storage Limits
- **Projects**: 48 (6 banks × 8 projects)
- **Presets per Project**: 48 (6 banks × 8 presets)
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

## Troubleshooting

### Application won't load SD card
- Ensure you're selecting the `Multigrain` folder (not the SD card root)
- Verify the folder contains `Project01/`, `Wavs/`, and `Recs/` subfolders

### Audio won't play
- Check that the file is a valid WAV file
- Verify the sample rate is supported (48kHz preferred)
- Try reloading the structure with "Change Location"

### Custom names/descriptions not saving
- Ensure the SD card is not write-protected
- Check that you have write permissions to the folder
- Look for error messages in the red notification bar

## Contributing

Contributions are welcome! Please follow the development workflow:

1. Fork the repository and create a feature branch
2. Make your changes following the code standards
3. Ensure all quality checks pass: `npm run type-check && npm run lint && npm test`
4. Submit a pull request with a clear description

All PRs must pass CI checks (type checking, linting, and all 111 tests) before merging.

## License

MIT License - See [LICENSE](LICENSE) file for details

## Credits

Built for the [Instruō Multigrain](https://www.instruomodular.com/product/multigrain/) granular synthesizer module.

## Roadmap

See [PLAN.md](docs/PLAN.md) for detailed implementation roadmap and technical specifications.
