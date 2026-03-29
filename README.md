# Multigrain Sample Manager

A cross-platform desktop application for managing audio samples on SD cards for the [Intellijel Multigrain](https://intellijel.com/shop/eurorack/multigrain/) Eurorack module.

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://github.com/gloeglm/multigrain-ui/actions/workflows/test.yml/badge.svg)
![Release](https://github.com/gloeglm/multigrain-ui/actions/workflows/release.yml/badge.svg)

## Features

- **Browse & Navigate** - Intuitive file tree for Projects (01-48), WAVS, and RECS folders with validation
- **Audio Preview** - Waveform visualization with play/pause/stop controls and auto-play toggle
- **Sample Import** - Auto-conversion to Multigrain format (48kHz/16-bit/stereo) with conflict resolution
- **Sample Numbering** - Automatically number samples on import, or renumber existing samples to control playback order
- **Project Management** - Create new projects, custom naming with factory presets, delete with confirmation
- **Preset Viewer** - Inspect all 8 sample references per preset with intelligent location resolution (PROJECT → WAVS → RECS)
- **Metadata Editing** - Add custom descriptions to projects and samples, view technical details (sample rate, bit depth, duration)
- **Project Overview** - Quick statistics dashboard showing total projects, samples, recordings, and per-project counts
- **PDF Reference Sheets** - Export printable documentation of projects, sample listings, and preset assignments

### Coming Soon 🚧

- **Preset Custom Naming** - User-defined names for presets (similar to project naming)
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

Download the latest release for your platform from the [Releases](../../releases) page:

- **macOS**: Open the `.dmg` and drag to Applications
- **Windows**: Run the `.exe` installer
- **Linux**: Install the `.deb` or `.rpm` package

### From Source

```bash
git clone https://github.com/gloeglm/multigrain-ui.git
cd multigrain-ui
npm install
npm start
```

## Usage

1. **Select Your SD Card** — Click "Select SD Card" and navigate to your SD card's `Multigrain` folder
2. **Browse** — Expand projects in the file tree to see samples and presets
3. **Preview Audio** — Click any `.wav` file to see its waveform and play it back
4. **Inspect Presets** — Click any `.mgp` preset to see its 8 sample references
5. **Import Samples** — Right-click a project folder and choose "Import Samples"
6. **Manage Numbering** — Right-click a project folder to add or update number prefixes on samples
7. **Customize Names** — Hover over a project and click ✎ to set a custom name
8. **Export Reference Sheets** — Right-click a project and choose "Export Sheet" for a printable PDF

## Technology Stack

- **Electron** - Cross-platform desktop framework
- **React** - UI components
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **WaveSurfer.js** - Audio waveform visualization
- **FFmpeg** - Audio conversion
- **PDFKit** - PDF export

## Development

### Available Scripts

**Development:**
- `npm start` - Start development server with hot reload
- `npm run package` - Package app for current platform
- `npm run make` - Create distributable installers

**Code Quality:**
- `npm run type-check` - Run TypeScript type checking (0 errors required)
- `npm run lint` - Check code style (0 warnings enforced)
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier

**Testing:**
- `npm test` - Run test suite (276 tests)
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate coverage report

### Development Workflow

Before committing, ensure all checks pass:
```bash
npm run type-check && npm run lint && npm test -- --run
```

CI/CD via GitHub Actions runs these checks on every push to `main`.

### Project Structure

```
src/
├── main/              # Electron main process
│   ├── ipc/          # IPC handlers (file ops, audio, presets, imports)
│   └── utils/        # Multigrain validation, numbering, preset parsing
├── renderer/         # React UI
│   ├── components/   # FileTree, AudioWaveform, SampleInfo, PresetViewer, ...
│   └── hooks/        # useMultigrain state management
└── shared/
    ├── types.ts      # TypeScript definitions
    └── constants.ts  # Multigrain specs, factory names
```

## Multigrain Specifications

### Storage Limits
- **Projects**: 48 (6 banks × 8 projects)
- **Presets per Project**: 48 (6 banks × 8 presets)
- **Samples in /PROJECT**: 128 per project
- **Samples in /WAVS**: 128 global
- **Samples in /RECS**: 1024 recordings

## Troubleshooting

### Application won't load SD card
- Ensure you're selecting the `Multigrain` folder (not the SD card root)
- Verify the folder contains `Project01/`, `Wavs/`, and `Recs/` subfolders

### Audio won't play
- Check that the file is a valid WAV file
- Try reloading the structure with "Change Location"

### Custom names/descriptions not saving
- Ensure the SD card is not write-protected
- Check that you have write permissions to the folder

## Contributing

Contributions are welcome! Please follow the development workflow:

1. Fork the repository and create a feature branch
2. Make your changes following the code standards
3. Ensure all quality checks pass: `npm run type-check && npm run lint && npm test`
4. Submit a pull request with a clear description

## License

MIT License - See [LICENSE](LICENSE) file for details

## Credits

Built for the [Intellijel Multigrain](https://intellijel.com/shop/eurorack/multigrain/) granular synthesizer module.
