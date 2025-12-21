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
}
