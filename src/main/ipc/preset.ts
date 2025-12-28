import { ipcMain } from 'electron';
import { extractSamplesFromPreset } from '../utils/presetParser';

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
