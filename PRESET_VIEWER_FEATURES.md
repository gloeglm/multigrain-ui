# Preset Viewer Features

## Overview

The Preset Viewer displays the 8 sample references stored in Multigrain `.mgp` preset files, with intelligent resolution of sample locations and navigation capabilities.

## Features Implemented

### 1. Sample Reference Extraction
- Parses binary `.mgp` files to extract ASCII sample filenames
- Displays all 8 samples (one per Sound button 1-8)
- Pure Node.js implementation with no external dependencies

### 2. Intelligent Location Resolution
Samples are resolved with priority matching Multigrain's expected behavior:

**Priority Order**: `PROJECT` → `WAVS` → `RECS`

For each sample filename in the preset:
1. **First**, check the current project's sample folder
2. **Then**, check the global `/WAVS` folder
3. **Finally**, check the `/RECS` recordings folder
4. If not found anywhere, mark as `NOT FOUND`

### 3. Visual Location Indicators

Each sample displays a colored badge showing its resolved location:

| Badge | Color | Meaning |
|-------|-------|---------|
| **PROJECT** (or project name) | Blue | Found in current project folder |
| **WAVS** | Green | Found in global samples folder |
| **RECS** | Purple | Found in recordings folder |
| **NOT FOUND** | Red | Sample file is missing |

### 4. Click-to-Navigate

- Click any found sample to navigate to it in the file tree
- Automatically switches from preset view to sample view
- Opens the AudioPlayer for the selected sample
- Missing samples are not clickable (shown with red background)

### 5. User Interface

**Preset Information Card**:
- Preset name and number (1-48)

**Samples List**:
- Numbered 1-8 matching Sound buttons on Multigrain
- Shows filename (monospace font for clarity)
- Location badge on the right
- Hover effect for clickable samples
- "Click to navigate" hint for found samples

**Info Box**:
- Explains resolution priority
- Shows color legend for all location badges

**Technical Details**:
- Full file path to the preset

## Use Cases

### 1. Understanding Preset Dependencies
- See which samples a preset needs
- Identify if any samples are missing
- Understand which folders the preset draws from

### 2. Finding Sample Sources
- Quickly locate where a specific sample is stored
- Differentiate between project-specific and global samples

### 3. Quick Navigation
- Click a sample to listen to it immediately
- Navigate from preset to sample in one click
- Useful for auditioning sounds used in a preset

### 4. Missing Sample Detection
- Red badges instantly show broken references
- Helps identify samples that need to be restored or replaced

## Technical Implementation

### Backend
- **File**: `src/main/ipc/preset.ts`
- **Method**: Buffer parsing to extract null-terminated ASCII strings
- **Returns**: Array of up to 8 sample filenames

### Frontend
- **Component**: `src/renderer/components/PresetViewer.tsx`
- **Resolution Logic**: Searches `Project.samples`, `structure.globalWavs`, `structure.recordings`
- **Navigation**: Calls `onNavigateToSample` callback to switch view

### Type Definitions
- **File**: `src/shared/types.ts`
- **New Interface**: `PresetWithSamples` extends `Preset`
- **Internal Type**: `ResolvedSample` tracks location and sample reference

## Example Workflow

1. User browses projects in the file tree
2. User expands a project and sees its presets
3. User clicks on "Preset01.mgp"
4. PresetViewer displays:
   - "Sound 1: guitar_improv.wav [PROJECT01]"
   - "Sound 2: ambient_pad.wav [WAVS]"
   - "Sound 3: Rec00042.wav [RECS]"
   - etc.
5. User clicks on "ambient_pad.wav"
6. App navigates to the /WAVS folder
7. AudioPlayer loads and plays the sample

## Future Enhancements

### Possible Additions
- **Sample usage tracking**: Show all presets that use a specific sample
- **Bulk sample location**: Highlight all samples from a preset in the file tree
- **Folder decode**: If `.mgp` format is fully decoded, show exact folder preference
- **Preset editing**: Update sample references when moving/renaming (requires format decode)
- **Missing sample warnings**: Alert before deleting samples used by presets
- **Orphaned sample detection**: Find samples not used by any preset

### Current Limitations
- Cannot determine the folder preference stored in `.mgp` (only searches in priority order)
- Cannot update `.mgp` files when samples are moved/renamed
- Cannot parse other preset data (knob positions, modulation, etc.)

See [MGP_RESEARCH.md](MGP_RESEARCH.md) for details on the binary format investigation.
