import { ipcMain } from 'electron';
import fs from 'node:fs/promises';

/**
 * Extract sample filenames from a .mgp preset file
 * Returns the 8 sample names referenced in the preset (one per Sound)
 */
async function extractSamplesFromPreset(mgpFilePath: string): Promise<string[]> {
  try {
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
        // Printable ASCII character
        currentString += String.fromCharCode(byte);
      } else {
        // Non-printable character - reset if we don't have a potential .wav
        if (currentString.length > 0 && !currentString.toLowerCase().endsWith('.wav')) {
          currentString = '';
        }
      }
    }

    // Should return exactly 8 samples (one per Sound button)
    return samples.slice(0, 8);
  } catch (error) {
    console.error('Error reading .mgp file:', error);
    throw error;
  }
}

export function setupPresetHandlers() {
  ipcMain.handle('preset:readSamples', async (_event, filePath: string) => {
    try {
      const samples = await extractSamplesFromPreset(filePath);
      return { success: true, samples };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}
