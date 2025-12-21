import { ipcMain } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';

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
}
