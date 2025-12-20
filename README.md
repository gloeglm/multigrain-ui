# Multigrain Sample Manager

A cross-platform desktop application for managing audio samples on SD cards for the [Multigrain Eurorack module](https://www.instruomodular.com/product/multigrain/).

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Currently Implemented

- **Browse SD Card Structure** - Navigate your Multigrain SD card with an intuitive file tree
  - Projects (01-48)
  - Global WAV samples
  - Recordings
  - Presets per project

- **Audio Preview** - Listen to samples before working with them
  - Waveform visualization
  - Play/pause/stop controls
  - Real-time playback progress
  - Auto-play toggle with preference saving

- **Sample Information** - View detailed metadata
  - Sample rate, bit depth, channels
  - File size and duration
  - Full file path

- **Custom Project Names** - Rename projects with human-readable names
  - Editable directly in the UI
  - Stored in `.project-metadata.json` files
  - Original folder names preserved
  - Factory project names button for quick setup

- **Sample Descriptions** - Add notes to your samples
  - Editable text descriptions
  - Stored in `.metadata.txt` files alongside samples

- **Preset Viewer** - Inspect preset contents and sample references
  - View all 8 sample references in any preset
  - Intelligent location resolution (PROJECT → WAVS → RECS)
  - Color-coded badges showing where samples are stored
  - Click samples to navigate and listen instantly
  - Autosave preset display when selecting projects

- **Project Overview** - Quick statistics dashboard
  - Total projects, samples, and recordings
  - Per-project sample and preset counts
  - Independent scroll areas for tree and content

### Coming Soon

- **Import Samples** - Add new audio files with automatic conversion
  - Auto-convert to 48kHz, 16-bit, stereo WAV
  - Trim files longer than 32 seconds
  - Format validation

- **File Operations** - Manage your sample library
  - Move/copy samples between folders
  - Rename samples
  - Delete samples with confirmation

- **Export Project Overview** - Print-ready documentation
  - Text/markdown export of SD card structure
  - Storage usage statistics vs. limits

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

### Project Structure

```
src/
├── main/                   # Electron main process
│   ├── index.ts           # Main entry point
│   ├── preload.ts         # Preload script for IPC
│   ├── ipc/               # IPC handlers
│   │   ├── index.ts       # File system operations
│   │   ├── audio.ts       # Audio metadata handling
│   │   ├── projectMetadata.ts  # Project naming + batch updates
│   │   └── preset.ts      # Preset sample extraction
│   └── utils/
│       └── multigrain.ts  # Folder structure validation + autosave
├── renderer/              # React UI
│   ├── App.tsx           # Main application component
│   ├── components/
│   │   ├── FileTree.tsx  # File browser with project selection
│   │   ├── AudioPlayer.tsx  # Audio preview component
│   │   └── PresetViewer.tsx # Preset sample viewer
│   ├── hooks/
│   │   └── useMultigrain.ts  # State management
│   └── index.html
└── shared/
    ├── types.ts          # Shared TypeScript types
    └── constants.ts      # Factory names + specs
```

### Available Scripts

- `npm start` - Start development server with hot reload
- `npm run package` - Package app for current platform
- `npm run make` - Create distributable installers
- `npm run lint` - Run linter

### Adding New Features

1. Create IPC handlers in `src/main/ipc/` for main process operations
2. Expose handlers via `electronAPI` in `src/main/preload.ts`
3. Add TypeScript types to `src/shared/types.ts`
4. Create React components in `src/renderer/components/`
5. Update `App.tsx` or create custom hooks as needed

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

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - See [LICENSE](LICENSE) file for details

## Credits

Built for the [Instruō Multigrain](https://www.instruomodular.com/product/multigrain/) granular synthesizer module.

## Roadmap

See [PLAN.md](PLAN.md) for detailed implementation roadmap and technical specifications.
