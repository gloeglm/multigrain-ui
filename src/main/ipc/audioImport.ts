import { ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ImportRequest, ImportResult, ImportProgress, AudioAnalysis } from '@shared/types/import';
import {
  analyzeAudioFile,
  convertAudioFile,
  getTempConversionPath,
  cleanupTempFile,
} from './audioConversion';
import { resolveConflict, sanitizeFilename } from '../utils/fileConflictResolver';
import { STORAGE_LIMITS } from '@shared/constants';
import {
  detectNumberingScheme,
  applyNumberPrefix,
  hasNumberPrefix,
  NumberingScheme,
} from '../utils/sampleNumbering';

/**
 * Get WAV filenames in a directory
 */
async function getWavFilenames(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.wav'))
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

/**
 * Get the count of WAV files in a directory
 */
async function getWavFileCount(dirPath: string): Promise<number> {
  const filenames = await getWavFilenames(dirPath);
  return filenames.length;
}

/**
 * Determine storage limit for a given path
 * Returns 128 for project folders and Wavs, 1024 for Recs
 */
function getStorageLimit(targetPath: string): number {
  const folderName = path.basename(targetPath);
  if (folderName === 'Recs') {
    return STORAGE_LIMITS.SAMPLES_IN_RECS;
  }
  // Project folders and Wavs both have 128 limit
  return STORAGE_LIMITS.SAMPLES_PER_PROJECT;
}

/**
 * Register all import-related IPC handlers
 */
export function registerAudioImportHandlers(): void {
  /**
   * Open file selection dialog for audio files
   */
  ipcMain.handle('import:selectFiles', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Audio Files',
          extensions: ['wav', 'mp3', 'flac', 'aiff', 'aif', 'm4a', 'ogg', 'wma'],
        },
        { name: 'All Files', extensions: ['*'] },
      ],
      title: 'Select Audio Files to Import',
    });

    if (result.canceled) {
      return null;
    }

    return result.filePaths;
  });

  /**
   * Validate selected files and check for issues
   */
  ipcMain.handle(
    'import:validateFiles',
    async (_event, request: { files: string[]; targetPath: string }) => {
      const { files, targetPath } = request;
      const analyses: AudioAnalysis[] = [];

      // Analyze each file
      for (const filePath of files) {
        const analysis = await analyzeAudioFile(filePath);
        analyses.push(analysis);
      }

      // Check storage limit
      const currentCount = await getWavFileCount(targetPath);
      const validFilesCount = analyses.filter((a) => a.isValid).length;
      const storageLimit = getStorageLimit(targetPath);
      const availableSlots = storageLimit - currentCount;

      // Detect numbering scheme from existing files
      const existingFiles = await getWavFilenames(targetPath);
      const numberingScheme = detectNumberingScheme(existingFiles);

      return {
        analyses,
        storageInfo: {
          currentCount,
          limit: storageLimit,
          availableSlots,
          wouldExceed: validFilesCount > availableSlots,
        },
        numberingInfo: {
          pattern: numberingScheme.pattern,
          digits: numberingScheme.digits,
          separator: numberingScheme.separator,
          nextNumber: numberingScheme.nextNumber,
        },
      };
    }
  );

  /**
   * Execute batch import with conversions
   */
  ipcMain.handle('import:executeBatch', async (event, request: ImportRequest) => {
    const { files, targetPath, numberingOptions } = request;
    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      trimmed: [],
      renamed: [],
      numbered: [],
      errors: [],
    };

    // Check storage limit before starting
    const currentCount = await getWavFileCount(targetPath);
    const storageLimit = getStorageLimit(targetPath);
    let availableSlots = storageLimit - currentCount;

    // Set up numbering if enabled
    let numberingScheme: NumberingScheme | null = null;
    let currentNumber = 0;

    if (numberingOptions?.enabled) {
      const existingFiles = await getWavFilenames(targetPath);

      if (numberingOptions.scheme === 'auto' || !numberingOptions.scheme) {
        // Auto-detect from existing files
        numberingScheme = detectNumberingScheme(existingFiles);
      } else {
        // Use specified scheme but detect next number and separator from existing files
        const detected = detectNumberingScheme(existingFiles);
        numberingScheme = {
          pattern: numberingOptions.scheme,
          digits: numberingOptions.scheme === '001_' ? 3 : 2,
          separator: detected.separator,
          nextNumber: detected.nextNumber,
        };
      }

      currentNumber = numberingScheme.nextNumber;
    }

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      const filename = path.basename(filePath);

      // Check if we've hit the storage limit
      if (availableSlots <= 0) {
        result.errors.push({
          file: filename,
          error: 'Storage limit reached',
        });
        result.failed++;
        continue;
      }

      // Send progress update
      const progress: ImportProgress = {
        currentFile: filename,
        currentIndex: i,
        totalFiles: files.length,
        percent: Math.round((i / files.length) * 100),
        stage: 'validating',
      };
      event.sender.send('import:progress', progress);

      try {
        // Analyze the file
        const analysis = await analyzeAudioFile(filePath);

        if (!analysis.isValid) {
          // File is not readable
          result.errors.push({
            file: filename,
            error: analysis.issues[0]?.message || 'File is not readable',
          });
          result.failed++;
          continue;
        }

        // Track if file was trimmed
        if (analysis.willBeTrimmed) {
          result.trimmed.push(filename);
        }

        let sourceFileForCopy = filePath;
        let tempFilePath: string | null = null;

        // Convert if needed
        if (analysis.needsConversion) {
          progress.stage = 'converting';
          event.sender.send('import:progress', progress);

          tempFilePath = getTempConversionPath(filename);

          const conversionResult = await convertAudioFile(filePath, tempFilePath, (percent) => {
            // Update progress with conversion percentage
            const overallPercent = Math.round(((i + percent / 100) / files.length) * 100);
            event.sender.send('import:progress', {
              ...progress,
              percent: overallPercent,
            });
          });

          if (!conversionResult.success) {
            result.errors.push({
              file: filename,
              error: conversionResult.error || 'Conversion failed',
            });
            result.failed++;
            if (tempFilePath) {
              await cleanupTempFile(tempFilePath);
            }
            continue;
          }

          sourceFileForCopy = tempFilePath;
        }

        // Copy to destination
        progress.stage = 'copying';
        event.sender.send('import:progress', progress);

        // Sanitize filename
        const sanitized = sanitizeFilename(filename);
        let desiredName = sanitized.endsWith('.wav')
          ? sanitized
          : `${path.basename(sanitized, path.extname(sanitized))}.wav`;

        // Apply numbering prefix if enabled
        let wasNumbered = false;
        if (numberingScheme && !hasNumberPrefix(desiredName)) {
          const numberedName = applyNumberPrefix(desiredName, currentNumber, numberingScheme);
          result.numbered.push({
            original: desiredName,
            final: numberedName,
          });
          desiredName = numberedName;
          currentNumber++;
          wasNumbered = true;
        }

        // Resolve conflicts
        const finalFilename = await resolveConflict(targetPath, desiredName);

        // Track if renamed due to conflict (not just numbered)
        if (finalFilename !== desiredName) {
          result.renamed.push({
            original: wasNumbered ? desiredName : filename,
            final: finalFilename,
          });
        } else if (!wasNumbered && finalFilename !== filename) {
          // File was renamed due to sanitization
          result.renamed.push({
            original: filename,
            final: finalFilename,
          });
        }

        // Copy file to destination
        const destinationPath = path.join(targetPath, finalFilename);
        await fs.copyFile(sourceFileForCopy, destinationPath);

        // Cleanup temp file if we created one
        if (tempFilePath) {
          await cleanupTempFile(tempFilePath);
        }

        // Success!
        result.imported++;
        availableSlots--;
      } catch (error) {
        result.errors.push({
          file: filename,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        result.failed++;
      }
    }

    // Send final progress
    const finalProgress: ImportProgress = {
      currentFile: '',
      currentIndex: files.length,
      totalFiles: files.length,
      percent: 100,
      stage: 'copying',
    };
    event.sender.send('import:progress', finalProgress);

    result.success = result.failed === 0;
    return result;
  });
}
