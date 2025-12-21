import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { parseFile } from 'music-metadata';
import { AudioAnalysis, AudioMetadata, AudioIssue, ConversionResult } from '@shared/types/import';
import { AUDIO_SPECS } from '@shared/constants';

// Set FFmpeg path from installer
// When running from asar, adjust path to use unpacked directory
let ffmpegPath = ffmpegInstaller.path;
if (ffmpegPath.includes('app.asar')) {
  ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
}
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Analyze an audio file to determine if it needs conversion
 * and what issues it has
 */
export async function analyzeAudioFile(filePath: string): Promise<AudioAnalysis> {
  const filename = path.basename(filePath);
  const issues: AudioIssue[] = [];
  let metadata: AudioMetadata | null = null;
  let needsConversion = false;
  let willBeTrimmed = false;

  try {
    // Parse audio metadata
    const parsed = await parseFile(filePath);

    // Extract metadata
    const duration = parsed.format.duration || 0;
    const sampleRate = parsed.format.sampleRate || 0;
    const bitDepth = parsed.format.bitsPerSample || 16;
    const channels = parsed.format.numberOfChannels || 0;
    const format = parsed.format.container || 'unknown';

    metadata = {
      duration,
      sampleRate,
      bitDepth,
      channels,
      format,
    };

    // Check duration
    if (duration > AUDIO_SPECS.MAX_DURATION_SECONDS) {
      willBeTrimmed = true;
      needsConversion = true;
      issues.push({
        type: 'duration',
        message: `File is ${duration.toFixed(1)}s long (max ${AUDIO_SPECS.MAX_DURATION_SECONDS}s). Will be trimmed.`,
        severity: 'warning',
      });
    }

    // Check sample rate
    if (sampleRate !== AUDIO_SPECS.SAMPLE_RATE) {
      needsConversion = true;
      issues.push({
        type: 'sampleRate',
        message: `Sample rate is ${sampleRate}Hz (requires ${AUDIO_SPECS.SAMPLE_RATE}Hz). Will be converted.`,
        severity: 'warning',
      });
    }

    // Check bit depth
    if (bitDepth !== AUDIO_SPECS.BIT_DEPTH) {
      needsConversion = true;
      issues.push({
        type: 'bitDepth',
        message: `Bit depth is ${bitDepth}-bit (requires ${AUDIO_SPECS.BIT_DEPTH}-bit). Will be converted.`,
        severity: 'warning',
      });
    }

    // Check channels
    if (channels !== AUDIO_SPECS.CHANNELS) {
      needsConversion = true;
      if (channels === 1) {
        issues.push({
          type: 'channels',
          message: 'Mono file will be converted to stereo.',
          severity: 'warning',
        });
      } else if (channels > 2) {
        issues.push({
          type: 'channels',
          message: `${channels}-channel file will be downmixed to stereo.`,
          severity: 'warning',
        });
      }
    }

    // Check format
    if (format.toLowerCase() !== 'wave') {
      needsConversion = true;
      issues.push({
        type: 'format',
        message: `${format.toUpperCase()} file will be converted to WAV.`,
        severity: 'warning',
      });
    }

    return {
      path: filePath,
      filename,
      isValid: true,
      needsConversion,
      willBeTrimmed,
      issues,
      metadata,
    };
  } catch (error) {
    // File is unreadable or not a valid audio file
    return {
      path: filePath,
      filename,
      isValid: false,
      needsConversion: false,
      willBeTrimmed: false,
      issues: [
        {
          type: 'unreadable',
          message: `Cannot read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
        },
      ],
      metadata: null,
    };
  }
}

/**
 * Convert an audio file to Multigrain specifications
 * Returns the path to the converted file
 */
export async function convertAudioFile(
  sourcePath: string,
  destinationPath: string,
  onProgress?: (percent: number) => void
): Promise<ConversionResult> {
  return new Promise((resolve) => {
    try {
      // Create FFmpeg command
      let command = ffmpeg(sourcePath)
        .audioCodec('pcm_s16le') // 16-bit PCM
        .audioFrequency(AUDIO_SPECS.SAMPLE_RATE) // 48kHz
        .audioChannels(AUDIO_SPECS.CHANNELS) // Stereo
        .format('wav') // WAV format
        .outputOptions([
          '-map_metadata',
          '-1', // Strip all metadata
          '-bitexact', // Don't add encoder info
        ]);

      // Trim if longer than max duration
      // Use -t flag to limit duration to exactly 32 seconds
      command = command.duration(AUDIO_SPECS.MAX_DURATION_SECONDS);

      // Set output path
      command = command.output(destinationPath);

      // Progress handling
      if (onProgress) {
        command.on('progress', (progress) => {
          // FFmpeg progress.percent can be undefined or > 100
          const percent = Math.min(100, Math.max(0, progress.percent || 0));
          onProgress(percent);
        });
      }

      // Success handler
      command.on('end', async () => {
        // Validate the output file
        try {
          const validated = await validateConvertedFile(destinationPath);
          if (validated) {
            resolve({ success: true, outputPath: destinationPath });
          } else {
            resolve({
              success: false,
              error: 'Converted file does not meet specifications',
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      });

      // Error handler
      command.on('error', (error) => {
        resolve({
          success: false,
          error: `Conversion failed: ${error.message}`,
        });
      });

      // Start the conversion
      command.run();
    } catch (error) {
      resolve({
        success: false,
        error: `Failed to start conversion: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });
}

/**
 * Validate that a converted file meets Multigrain specifications
 */
async function validateConvertedFile(filePath: string): Promise<boolean> {
  try {
    const metadata = await parseFile(filePath);

    const sampleRate = metadata.format.sampleRate || 0;
    const bitDepth = metadata.format.bitsPerSample || 0;
    const channels = metadata.format.numberOfChannels || 0;
    const duration = metadata.format.duration || 0;

    // Check all specs
    const isValid =
      sampleRate === AUDIO_SPECS.SAMPLE_RATE &&
      bitDepth === AUDIO_SPECS.BIT_DEPTH &&
      channels === AUDIO_SPECS.CHANNELS &&
      duration <= AUDIO_SPECS.MAX_DURATION_SECONDS;

    return isValid;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

/**
 * Generate a temporary file path for conversion
 */
export function getTempConversionPath(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);
  const timestamp = Date.now();
  const tempFilename = `multigrain_${baseName}_${timestamp}.wav`;
  return path.join(os.tmpdir(), tempFilename);
}

/**
 * Cleanup temporary conversion file
 */
export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore errors during cleanup
    console.warn('Failed to cleanup temp file:', filePath, error);
  }
}
