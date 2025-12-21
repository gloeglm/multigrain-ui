# .mgp File Format Research

## Summary

Research into the Multigrain `.mgp` preset file format to extract sample references.

## File Structure

- **File Size**: Fixed 16,384 bytes (16 KB)
- **Format**: Binary, proprietary
- **Contains**: 8 Sound configurations (one per Sound button)

## Sample References

### Extraction Method

Sample filenames can be reliably extracted as ASCII strings from `.mgp` files using standard string extraction tools.

**Tested Method**:
```bash
strings preset.mgp | grep -E '\.wav$'
```

This returns the filenames of all 8 samples referenced in the preset (one per Sound).

### Sample Order

Samples appear in the file in order from Sound 1 to Sound 8:
- Sound 1 sample filename
- Sound 2 sample filename
- ...
- Sound 8 sample filename

### Findings

1. **Filenames are stored as null-terminated ASCII strings**
2. **Each preset references exactly 8 samples** (one per Sound)
3. **Sample filenames include extension** (e.g., `sample.wav`)
4. **Filenames do NOT include folder path** - just the filename itself

### Folder Location Mystery

We attempted to find a byte flag indicating which folder (/PROJECT, /WAVS, or /RECS) each sample comes from, but **no clear pattern was identified**.

The binary structure uses:
- Byte sequence `00 00 01` appears at the start of each Sound block
- Samples stored at offset 0x3AB, 0x965, 0xA65, 0xF1F, 0x14D9, 0x1A93, 0x204D, 0x2607 (approx)
- Each Sound block is approximately 0x5BA bytes

**Conclusion**: We cannot determine from the `.mgp` file alone which folder a sample is stored in. This information may be:
- Resolved at runtime by the module searching folders
- Stored in a complex binary format we haven't decoded
- Not needed by the module (searches all three folders for the filename)

## Implementation for Sample Manager

### What We Can Do

✅ **Extract sample filenames** from `.mgp` files
✅ **Display which samples each preset uses**
✅ **Show preset→sample relationships**
✅ **Detect if a sample exists on the SD card**
✅ **Warn before deleting samples that are referenced in presets**

### What We Cannot Do (Yet)

❌ **Determine which folder** (/PROJECT, /WAVS, /RECS) a preset expects to load from
❌ **Update sample references** when moving/renaming files
❌ **Parse other preset settings** (knob positions, modulation, etc.)

### Workaround for Folder Detection

When checking if a sample is referenced, we can:
1. Extract the filename from the `.mgp`
2. Search for the filename in all three possible locations:
   - `/ProjectXX/filename.wav`
   - `/Wavs/filename.wav`
   - `/Recs/filename.wav`
3. If found in multiple locations, flag as ambiguous

This matches how the module itself might resolve samples.

## Sample Code

### Extract Samples from Preset

```typescript
async function extractSamplesFromPreset(mgpFilePath: string): Promise<string[]> {
  const { execSync } = require('child_process');

  // Use strings command to extract ASCII strings, filter for .wav files
  const output = execSync(`strings "${mgpFilePath}" | grep -E '\\.wav$'`, {
    encoding: 'utf-8'
  });

  // Split by newlines and clean up
  const samples = output
    .trim()
    .split('\n')
    .filter(line => line.length > 0);

  // Should return exactly 8 samples (one per Sound)
  return samples;
}
```

### Node.js Alternative (No Shell)

```typescript
import fs from 'node:fs/promises';

async function extractSamplesFromPresetPure(mgpFilePath: string): Promise<string[]> {
  const buffer = await fs.readFile(mgpFilePath);
  const samples: string[] = [];

  // Look for null-terminated strings ending in .wav
  let currentString = '';
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];

    if (byte === 0) {
      // Null terminator - check if we have a .wav file
      if (currentString.toLowerCase().endsWith('.wav')) {
        samples.push(currentString);
      }
      currentString = '';
    } else if (byte >= 32 && byte <= 126) {
      // Printable ASCII
      currentString += String.fromCharCode(byte);
    } else {
      // Non-printable - reset
      if (currentString.length > 0 && !currentString.toLowerCase().endsWith('.wav')) {
        currentString = '';
      }
    }
  }

  return samples;
}
```

## Testing Results

### Test Case 1: Project01/Preset01.mgp
All 8 samples from `/PROJECT01/` folder:
- 01-intellijel-factory-guitar_improv_Em.wav
- 02-intellijel-factory-lunrgirl_improv_dry_Gm.wav
- 03-intellijel-factory-piano_improv_Am.wav
- 04-intellijel-factory-casc_loop.wav
- 05-intellijel-factory-garage-door.wav
- 06-intellijel-factory-intellijel-counting_ALT.wav
- 00 A Intellijel Startup Sound.wav
- 07-intellijel-factory-Intellijel-sound.wav

### Test Case 2: Project01/Preset02.mgp
Mixed sources (WAVS and PROJECT):
- intellijel-10-Cascadia-oneshots.wav [/WAVS]
- intellijel-10-PO-32_beat.wav [/WAVS]
- 01-intellijel-factory-guitar_improv_Em.wav [/PROJECT01]
- intellijel-10-Cascadia-percussion-loop.wav [/WAVS]
- intellijel-20-ob6_chord_F#.wav [/WAVS]
- intellijel-20-lunrgirl_improv_dry_Gm.wav [/WAVS]
- intellijel-20-tongue_drum_Am.wav [/WAVS]
- intellijel-20-guitar_improv_Em.wav [/WAVS]

### Test Case 3: Project04/Preset02.mgp
Mixed sources (RECS and PROJECT):
- Rec00040.wav [/RECS]
- TD_MusicBox1.wav [/PROJECT04]
- Rec00041.wav [/RECS]
- Rec00043.wav [/RECS]
- Rec00045.wav [/RECS]
- Rec00046.wav [/RECS]
- Rec00054.wav [/RECS]
- Rec00049.wav [/RECS]

## Future Work

To fully decode the `.mgp` format, further reverse engineering is needed:
- Hex analysis of known preset states
- Comparison of presets with single parameter changes
- Possible use of binary diffing tools
- Contact with Instruō for format documentation
