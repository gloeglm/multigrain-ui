# Multigrain Technical Specifications

## Purpose

This document describes the **data model, storage format, and file structure** used by the Multigrain Eurorack module. It serves as a technical reference for developing the Multigrain Sample Manager application.

### In Scope
- File and folder structure on the SD card
- Data relationships and dependencies
- Storage limits and constraints
- Audio file specifications
- Binary file formats (`.mgp`, `.mgs`)
- Implementation considerations for respecting the data model

### Out of Scope
- How to operate the Multigrain hardware module
- User guides or tutorials
- Musical/creative usage of the module
- Hardware specifications or circuit design
- Firmware implementation details

For general information about Multigrain, see the [official Instruō documentation](https://www.instruomodular.com/product/multigrain/).

---

## Hierarchy Overview

```
Multigrain Module
└── 48 Projects (6 Banks × 8 Projects)
    └── 48 Presets per Project (6 Banks × 8 Presets)
        └── 8 Sounds per Preset
            └── 2 Scenes per Sound + Sample Reference
```

## Sample Storage

Samples are stored in three distinct locations with specific capacity limits:

| Location | Path | Capacity | Scope | Description |
|----------|------|----------|-------|-------------|
| Project Samples | `/PROJECT` (per project) | 128 per project | Project-specific | Samples unique to this project |
| Global Samples | `/WAVS` | 128 total | All projects | Shared samples accessible from any project |
| Recordings | `/RECS` | 1024 total | All projects | Recordings made on the Multigrain module |

**Total Possible Samples**: Up to 6,272 samples (48 projects × 128 + 128 global + 1024 recordings)

### Sample Indexing Order

The module indexes samples differently depending on the folder:

| Folder | Indexing Method | Technical Implication |
|--------|----------------|----------------------|
| `/PROJECT` | Alphabetically | Sort by filename A-Z |
| `/WAVS` | Alphabetically | Sort by filename A-Z |
| `/RECS` | Chronologically | Sort by file modification time, newest first |

**Note**: Our sample manager should respect this ordering to maintain consistency with the module's behavior.

## File Structure

```
📁 Multigrain/                    # Root folder (all Multigrain files)
├── 📁 Project01/                 # Project 1 folder
│   ├── Autosave.mgp             # Autosave state for this project
│   ├── Preset01.mgp             # Preset file (contains sound/scene data)
│   ├── Preset02.mgp             # ...
│   ├── ...                      # ...
│   ├── Preset48.mgp             # Last preset
│   ├── SampleA.wav              # Project-specific samples
│   └── SampleB.wav              # ...
├── 📁 Project02/                 # Project 2 folder
│   └── (same structure)
├── ...
├── 📁 Project48/                 # Last project folder
├── 📁 Recs/                      # Global recordings folder
│   ├── Rec00001.wav             # Recording made on Multigrain
│   ├── Rec00002.wav             # Sequential numbering
│   └── ...
├── 📁 Wavs/                      # Global WAV samples folder
│   ├── Cool_beats.wav           # Samples copied from computer
│   ├── Cool_beans.wav           # Available to all projects
│   └── ...
└── Settings.mgs                 # Global settings file
```

## Settings Files

### Global Settings (Settings.mgs)

Located in the Multigrain root folder, contains module-wide settings:

- **Latest Project Number** - Last active project
- **Session Count** - Module usage tracking
- **Input Trim** - Input gain adjustment
- **Resampling** - Resampling quality settings
- **Normalize** - Audio normalization settings
- **Theme** - UI color scheme
- **Threshold** - Audio detection threshold
- **Blur** - Visual effect setting

### Preset Settings (Presetxx.mgp / Autosave.mgp)

Located in each Project folder. Each preset file contains:

#### Preset-Level Settings
- **Preset Number** - Position in bank (1-48)
- **Latest Scene** - Last active scene
- **Latest Sound Number** - Last active sound (1-8)
- **Mod A and B Out Option** - Modulation output routing
- **Input Thru Enabled** - Audio pass-through setting
- **Latch Enabled** - Latch mode state
- **Sync Enabled** - Clock sync state
- **Freeze Modulation Assignments** - Frozen mod state (v1.2+)

#### Sound Settings (8 sounds per preset)
Each of the 8 sounds contains:
- **Sync Mode** - Synchronization behavior
- **Link Size-Pitch** - Grain size/pitch coupling
- **Link Size-Rate** - Grain size/rate coupling
- **Quantizer** - Pitch quantization settings
- **Sample Folder** - Which folder the sample is in (`/PROJECT`, `/WAVS`, or `/RECS`)
- **Sample Filename** - ⚠️ **CRITICAL**: Direct reference to the WAV file used
- **Quantize Mode** - Quantization algorithm
- **Fine Tune** - Pitch adjustment
- **Ping Pong** - Playback direction mode

#### Scene Settings (2 scenes per sound)
Each scene contains:
- **Panel Settings** - 10 knob positions + Reverse switch state
- **Mod Assigns** - Modulation assignments for RAND, X, Y, Z axes
  - Applied to all 10 knobs and Reverse control

## Audio File Requirements

All audio files must meet these specifications:

| Property | Requirement |
|----------|-------------|
| Format | WAV (PCM) |
| Sample Rate | 48 kHz |
| Bit Depth | 16-bit |
| Channels | Stereo (2 channels) |
| Max Duration | 32 seconds |
| Encoding | Uncompressed PCM |

## Recording Naming Convention

Recordings created by the module follow a sequential pattern:
- `Rec00001.wav`
- `Rec00002.wav`
- `Rec00003.wav`
- etc.

The counter increments with each new recording and does not reuse deleted numbers.

## Ephemeral Mode

Multigrain can operate without a microSD card in "Ephemeral Mode" with limited functionality:
- No sample loading from files
- No preset saving/loading
- Settings are not persisted
- Live input and live memory only

**microSD LED States**:
- **OFF** - Card not recognized or missing
- **ON** - Card detected and working

## Data Relationships

### Sample References in Preset Files
Each Sound entry in a `.mgp` preset file contains:
- **Folder reference**: Which folder the sample is stored in (`/PROJECT`, `/WAVS`, or `/RECS`)
- **Filename reference**: The exact filename of the sample

**Critical Implications**:
- Sample references are direct file path dependencies
- Multiple Sounds across different presets can reference the same sample file
- Deleting/moving/renaming a sample breaks references in all `.mgp` files that point to it
- No automatic reference updating mechanism in the binary format

### Project Data Scope
| Data Type | Scope | Accessibility |
|-----------|-------|---------------|
| Presets (`.mgp` files) | Project-specific | Only within that project |
| Project samples (`/PROJECT`) | Project-specific | Only within that project |
| Global samples (`/WAVS`) | Global | All projects |
| Recordings (`/RECS`) | Global | All projects |
| Settings (`.mgs`) | Global | Module-wide |

**Key Point**: A preset in Project01 can reference samples from `/PROJECT01/`, `/WAVS/`, or `/RECS/`, but cannot reference samples from `/PROJECT02/`.

## File Format Notes

### .mgp Files (Preset Files)
- **Format**: Binary (proprietary)
- **File Size**: Fixed 16,384 bytes (16 KB)
- **Contains**: All preset, sound, and scene configuration
- **Autosave.mgp**: Automatically updated with current module state
- **Sample References**: Stores filename for each of the 8 sounds

**What Can Be Extracted**:
- ✅ Sample filenames (8 per preset) as ASCII strings
- ✅ Can detect which samples each preset uses
- ✅ Can implement "safe delete" warnings

**What Cannot Be Determined** (without full format decode):
- ❌ Which folder (/PROJECT, /WAVS, /RECS) the preset expects
- ❌ Knob positions, modulation assignments, etc.
- ❌ Cannot update references when moving/renaming samples

**Extraction Method**:
```bash
strings preset.mgp | grep -E '\.wav$'
```
Returns 8 sample filenames in Sound order (1-8).

See [MGP_RESEARCH.md](MGP_RESEARCH.md) for detailed reverse engineering findings.

### .mgs File (Settings File)
- **Format**: Binary (proprietary)
- **Contains**: Global module settings
- **Count**: Single file for entire module

## Development Considerations

### Sample Management Features

#### High Priority
1. **Before deleting a sample**: Scan all `.mgp` files to check for references (requires parsing)
2. **Sample validation**: Verify files meet audio specifications before import
3. **Storage limit enforcement**: Warn when approaching folder capacity limits

#### Future Enhancements
1. Parse `.mgp` files to extract preset/sample relationships
2. Visual preset browser showing which samples each preset uses
3. "Safe delete" that prevents deletion of in-use samples with warnings
4. Sample usage statistics (which samples are used, which are orphaned)
5. Preset backup/restore functionality
6. Settings.mgs viewer/editor (if format can be decoded)

### Validation Checklist
- ✅ Folder structure matches expected layout (Project01-48, Recs, Wavs)
- ✅ Settings.mgs file exists
- ✅ Samples sorted alphabetically in /PROJECT and /WAVS folders
- ⚠️ Sample counts don't exceed limits (not yet enforced)
- ⚠️ Audio file specifications validated on import (not yet implemented)
- ⚠️ /RECS samples should be sorted chronologically (newest first) - currently sorted alphabetically
- ❌ Recording number sequence consistency (not yet checked)
- ❌ Preset file integrity (not yet validated)

### Critical File Operations
When implementing file operations, consider:

1. **Deleting Samples**:
   - Risk: Breaking preset references
   - Solution: Parse `.mgp` files to detect usage, show warning

2. **Moving Samples**:
   - Risk: Breaking preset references
   - Solution: Update references in `.mgp` files (requires format knowledge)

3. **Renaming Samples**:
   - Risk: Breaking preset references
   - Solution: Update references in `.mgp` files (requires format knowledge)

4. **Importing Samples**:
   - Must validate audio format (48kHz, 16-bit, stereo)
   - Must check storage limits
   - Should auto-convert incompatible files

## Binary File Format Research Needed

To implement advanced features, reverse engineering of these formats is needed:

1. **`.mgp` files** (Preset Files)
   - Need to locate sample filename/folder fields
   - Would enable safe deletion and usage tracking
   - Could allow preset editing/backup

2. **`.mgs` file** (Settings File)
   - Less critical for sample management
   - Could enable settings backup/restore

**Note**: Binary format analysis tools and hex editors will be needed for this research.

## Implementation Considerations

### Respecting Data Model Constraints

To maintain compatibility with Multigrain's data model, the sample manager must:

#### Sample Display Order
Match the module's indexing behavior:
- **`/PROJECT` samples**: Sort alphabetically by filename
- **`/WAVS` samples**: Sort alphabetically by filename
- **`/RECS` samples**: Sort chronologically by file modification time (newest first)

**Current Implementation**: All folders sorted alphabetically - `/RECS` needs correction.

#### Storage Capacity Limits
Enforce the module's storage limits:
- `/PROJECT`: 128 samples per project (warn at 120, block at 128)
- `/WAVS`: 128 samples total (warn at 120, block at 128)
- `/RECS`: 1024 samples total (warn at 1000, block at 1024)

Visual indicators:
- Show current count vs. limit (e.g., "48/128 samples")
- Gray out/disable import when at capacity
- Warning state when approaching limit

#### Audio Format Validation
Enforce Multigrain's audio specifications before allowing imports:
- Sample Rate: Must be 48 kHz
- Bit Depth: Must be 16-bit
- Channels: Must be stereo (2 channels)
- Duration: Must be ≤ 32 seconds
- Format: WAV (PCM uncompressed)

**Actions**:
- Reject files that don't meet specs (with clear error message)
- Or: Auto-convert with user confirmation (requires FFmpeg)

#### Reference Integrity
Handle sample references in `.mgp` preset files:

**Before Deleting a Sample**:
1. Parse all `.mgp` files in the project (if format is known)
2. Check if sample filename is referenced
3. Show warning: "This sample is used in X presets. Delete anyway?"
4. List affected presets if possible

**Before Moving/Renaming**:
- Warn that this will break preset references (unless we can update `.mgp` files)
- Consider blocking these operations until `.mgp` format is decoded

**Orphaned Sample Detection**:
- Scan `.mgp` files to find which samples are actually used
- Highlight unused samples for potential cleanup

#### Empty Folder Handling
- Detect when folders are empty
- Show "Empty" state in UI (module shows button as OFF)
- Don't prevent viewing empty folders, just indicate the state
