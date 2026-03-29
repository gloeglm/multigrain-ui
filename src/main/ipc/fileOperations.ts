import { ipcMain } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  detectNumberingScheme,
  hasNumberPrefix,
  extractPrefixNumber,
  NumberingScheme,
} from '../utils/sampleNumbering';
import { extractSamplesFromPreset } from '../utils/presetParser';

interface NumberingPlan {
  scheme: NumberingScheme;
  alreadyNumbered: number;
  renames: Array<{ oldName: string; newName: string }>;
}

/**
 * Build a renumbering plan for all WAV files in a folder.
 * Files are renumbered starting from 1, preserving the relative order of
 * already-numbered files, with unnumbered files sorted alphabetically at the end.
 */
async function buildNumberingPlan(folderPath: string): Promise<NumberingPlan> {
  const files = await fs.promises.readdir(folderPath);
  const wavFiles = files.filter((f) => f.toLowerCase().endsWith('.wav'));

  if (wavFiles.length === 0) {
    throw new Error('No WAV files found in folder');
  }

  // Detect existing numbering scheme (for separator style)
  const scheme = detectNumberingScheme(wavFiles);

  // Separate numbered and unnumbered files
  const numberedFiles: Array<{ name: string; number: number; baseName: string }> = [];
  const unnumberedFiles: Array<{ name: string; baseName: string }> = [];

  for (const file of wavFiles) {
    if (hasNumberPrefix(file)) {
      const num = extractPrefixNumber(file);
      if (num !== null) {
        const baseName = file.replace(/^\d{1,3}(\s*[-_.]\s*|\s+)/, '');
        numberedFiles.push({ name: file, number: num, baseName });
      }
    } else {
      unnumberedFiles.push({ name: file, baseName: file });
    }
  }

  // Sort numbered files by their number to preserve order
  numberedFiles.sort((a, b) => a.number - b.number);

  // Sort unnumbered files alphabetically
  unnumberedFiles.sort((a, b) => a.baseName.localeCompare(b.baseName));

  // Combine: numbered files first (in order), then unnumbered files
  const allFiles = [...numberedFiles, ...unnumberedFiles];

  // Build the rename plan - renumber everything starting from 1
  const renames: Array<{ oldName: string; newName: string }> = [];
  let currentNumber = 1;

  for (const file of allFiles) {
    const paddedNumber = String(currentNumber).padStart(scheme.digits, '0');
    const newName = `${paddedNumber}${scheme.separator}${file.baseName}`;

    // Only add to renames if the name actually changes
    if (file.name !== newName) {
      renames.push({ oldName: file.name, newName });
    }

    currentNumber++;
  }

  return {
    scheme,
    alreadyNumbered: numberedFiles.length,
    renames,
  };
}

export function registerFileOperationsHandlers(): void {
  // Delete a project folder and all its contents
  ipcMain.handle('files:deleteProject', async (_event, projectPath: string) => {
    try {
      // Verify the path exists and is a directory
      const stats = await fs.promises.stat(projectPath);
      if (!stats.isDirectory()) {
        return {
          success: false,
          error: 'Path is not a directory',
        };
      }

      // Security check: ensure we're deleting a ProjectXX folder
      const folderName = path.basename(projectPath);
      if (!folderName.match(/^Project\d{2}$/)) {
        return {
          success: false,
          error: 'Invalid project folder name. Only ProjectXX folders can be deleted.',
        };
      }

      // Delete the entire project folder recursively
      await fs.promises.rm(projectPath, { recursive: true, force: true });

      return { success: true };
    } catch (error) {
      console.error('Error deleting project:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Delete a sample file
  ipcMain.handle('files:deleteSample', async (_event, samplePath: string) => {
    try {
      // Verify the path exists and is a file
      const stats = await fs.promises.stat(samplePath);
      if (!stats.isFile()) {
        return {
          success: false,
          error: 'Path is not a file',
        };
      }

      // Security check: ensure we're deleting a .wav file
      if (!samplePath.toLowerCase().endsWith('.wav')) {
        return {
          success: false,
          error: 'Only .wav files can be deleted',
        };
      }

      // Delete the sample file
      await fs.promises.unlink(samplePath);

      return { success: true };
    } catch (error) {
      console.error('Error deleting sample:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Delete multiple samples at once
  ipcMain.handle('files:deleteSamples', async (_event, samplePaths: string[]) => {
    const results: Array<{ path: string; success: boolean; error?: string }> = [];

    for (const samplePath of samplePaths) {
      try {
        // Verify the path exists and is a file
        const stats = await fs.promises.stat(samplePath);
        if (!stats.isFile()) {
          results.push({
            path: samplePath,
            success: false,
            error: 'Path is not a file',
          });
          continue;
        }

        // Security check: ensure we're deleting a .wav file
        if (!samplePath.toLowerCase().endsWith('.wav')) {
          results.push({
            path: samplePath,
            success: false,
            error: 'Only .wav files can be deleted',
          });
          continue;
        }

        // Delete the sample file
        await fs.promises.unlink(samplePath);
        results.push({ path: samplePath, success: true });
      } catch (error) {
        console.error(`Error deleting sample ${samplePath}:`, error);
        results.push({
          path: samplePath,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return {
      success: successCount > 0,
      count: successCount,
      total: results.length,
      results,
    };
  });

  // Rename a sample file
  ipcMain.handle('files:renameSample', async (_event, samplePath: string, newName: string) => {
    try {
      // Verify the path exists and is a file
      const stats = await fs.promises.stat(samplePath);
      if (!stats.isFile()) {
        return {
          success: false,
          error: 'Path is not a file',
        };
      }

      // Security check: ensure we're renaming a .wav file
      if (!samplePath.toLowerCase().endsWith('.wav')) {
        return {
          success: false,
          error: 'Only .wav files can be renamed',
        };
      }

      // Validate new filename
      const trimmedName = newName.trim();
      if (!trimmedName) {
        return {
          success: false,
          error: 'Filename cannot be empty',
        };
      }

      // Ensure new filename ends with .wav
      let finalName = trimmedName;
      if (!finalName.toLowerCase().endsWith('.wav')) {
        finalName += '.wav';
      }

      // Check for invalid characters in filename
      const invalidChars = /[<>:"|?*]/;
      if (invalidChars.test(finalName)) {
        return {
          success: false,
          error: 'Filename contains invalid characters',
        };
      }

      // Construct new path
      const directory = path.dirname(samplePath);
      const newPath = path.join(directory, finalName);

      // Normalize paths for comparison (handles forward/back slash differences)
      const normalizedOldPath = path.normalize(samplePath);
      const normalizedNewPath = path.normalize(newPath);

      // If renaming to same name, return success immediately (no-op)
      if (normalizedNewPath === normalizedOldPath) {
        return {
          success: true,
          newPath: normalizedNewPath.replace(/\\/g, '/'),
          newName: finalName,
        };
      }

      // Check if file already exists at new path
      try {
        await fs.promises.access(newPath);
        return {
          success: false,
          error: 'A file with this name already exists',
        };
      } catch {
        // File doesn't exist, which is what we want
      }

      // Perform the rename
      await fs.promises.rename(normalizedOldPath, normalizedNewPath);

      return {
        success: true,
        newPath: normalizedNewPath.replace(/\\/g, '/'),
        newName: finalName,
      };
    } catch (error) {
      console.error('Error renaming sample:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Preview what files would be renamed when adding number prefixes
  ipcMain.handle('files:previewNumberPrefixes', async (_event, folderPath: string) => {
    try {
      // Verify folder exists
      const stats = await fs.promises.stat(folderPath);
      if (!stats.isDirectory()) {
        return { success: false, error: 'Path is not a directory' };
      }

      const plan = await buildNumberingPlan(folderPath);

      // Check which presets reference samples that are being renamed
      const renamedNames = new Set(plan.renames.map((r) => r.oldName));
      const mgpFiles = (await fs.promises.readdir(folderPath)).filter((f) =>
        f.toLowerCase().endsWith('.mgp')
      );
      const presetWarnings: string[] = [];
      for (const mgpFile of mgpFiles) {
        try {
          const samples = await extractSamplesFromPreset(path.join(folderPath, mgpFile));
          if (samples.some((s) => renamedNames.has(s))) {
            presetWarnings.push(path.basename(mgpFile, '.mgp'));
          }
        } catch {
          // Skip unreadable preset files
        }
      }

      return {
        success: true,
        scheme: {
          pattern: plan.scheme.pattern,
          digits: plan.scheme.digits,
          separator: plan.scheme.separator,
        },
        alreadyNumbered: plan.alreadyNumbered,
        toRename: plan.renames,
        presetWarnings,
      };
    } catch (error) {
      console.error('Error previewing number prefixes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Apply number prefixes to samples in a folder (renumbers all starting from 1)
  ipcMain.handle('files:applyNumberPrefixes', async (_event, folderPath: string) => {
    try {
      const plan = await buildNumberingPlan(folderPath);

      if (plan.renames.length === 0) {
        return {
          success: true,
          renamed: [],
          message: 'All files already have correct number prefixes',
        };
      }

      // Use two-pass rename to avoid conflicts:
      // 1. Rename all files to temporary names
      // 2. Rename from temporary to final names
      const tempPrefix = `__temp_rename_${Date.now()}_`;
      const renamed: Array<{ oldName: string; newName: string }> = [];
      const errors: Array<{ oldName: string; error: string }> = [];

      // Pass 1: Rename to temporary names
      const tempMappings: Array<{ tempName: string; finalName: string; originalName: string }> = [];

      for (const { oldName, newName } of plan.renames) {
        const tempName = `${tempPrefix}${oldName}`;
        const oldPath = path.join(folderPath, oldName);
        const tempPath = path.join(folderPath, tempName);

        try {
          await fs.promises.rename(oldPath, tempPath);
          tempMappings.push({ tempName, finalName: newName, originalName: oldName });
        } catch (err) {
          errors.push({
            oldName,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      // Pass 2: Rename from temporary to final names
      for (const { tempName, finalName, originalName } of tempMappings) {
        const tempPath = path.join(folderPath, tempName);
        const finalPath = path.join(folderPath, finalName);

        try {
          await fs.promises.rename(tempPath, finalPath);
          renamed.push({ oldName: originalName, newName: finalName });
        } catch (err) {
          // Try to restore original name on failure
          try {
            await fs.promises.rename(tempPath, path.join(folderPath, originalName));
          } catch {
            // Ignore restore failure
          }
          errors.push({
            oldName: originalName,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      return {
        success: renamed.length > 0,
        renamed,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Error applying number prefixes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}
