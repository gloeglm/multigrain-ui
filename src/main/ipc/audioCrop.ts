import * as path from 'path';
import * as fs from 'fs/promises';
import { ipcMain } from 'electron';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { AUDIO_SPECS } from '@shared/constants';

let ffmpegPath = ffmpegInstaller.path;
if (ffmpegPath.includes('app.asar')) {
  ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
}
ffmpeg.setFfmpegPath(ffmpegPath);

export function registerAudioCropHandlers(): void {
  ipcMain.handle(
    'audio:crop',
    async (_event, filePath: string, startSec: number, endSec: number) => {
      if (startSec < 0 || endSec <= startSec) {
        return { success: false, error: 'Invalid crop range' };
      }

      const duration = endSec - startSec;
      if (duration > AUDIO_SPECS.MAX_DURATION_SECONDS) {
        return {
          success: false,
          error: `Crop duration ${duration.toFixed(2)}s exceeds maximum ${AUDIO_SPECS.MAX_DURATION_SECONDS}s`,
        };
      }

      const ext = path.extname(filePath);
      const baseName = path.basename(filePath, ext);
      const dir = path.dirname(filePath);
      const tempPath = path.join(dir, `__crop_tmp_${baseName}_${Date.now()}${ext}`);

      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg(filePath)
            .setStartTime(startSec)
            .duration(duration)
            .audioCodec('pcm_s16le')
            .audioFrequency(AUDIO_SPECS.SAMPLE_RATE)
            .audioChannels(AUDIO_SPECS.CHANNELS)
            .format('wav')
            .outputOptions(['-map_metadata', '-1', '-bitexact'])
            .output(tempPath)
            .on('end', () => resolve())
            .on('error', (err: Error) => reject(err))
            .run();
        });

        // Atomically replace the original with the cropped file
        await fs.rename(tempPath, filePath);
        return { success: true };
      } catch (error) {
        try {
          await fs.unlink(tempPath);
        } catch {
          // ignore cleanup errors
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Crop failed',
        };
      }
    }
  );
}
