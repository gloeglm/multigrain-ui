import { ipcMain, dialog } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

export function registerFileSystemHandlers(): void {
  // Directory selection dialog
  ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  // Read directory contents
  ipcMain.handle('fs:readDirectory', async (_event, dirPath: string) => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(dirPath, entry.name),
    }));
  });

  // Read file
  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    return await fs.readFile(filePath);
  });

  // Write file
  ipcMain.handle('fs:writeFile', async (_event, filePath: string, data: Buffer) => {
    await fs.writeFile(filePath, data);
  });

  // Delete file
  ipcMain.handle('fs:deleteFile', async (_event, filePath: string) => {
    await fs.unlink(filePath);
  });

  // Move file
  ipcMain.handle('fs:moveFile', async (_event, src: string, dest: string) => {
    await fs.rename(src, dest);
  });

  // Copy file
  ipcMain.handle('fs:copyFile', async (_event, src: string, dest: string) => {
    await fs.copyFile(src, dest);
  });

  // Get file stats
  ipcMain.handle('fs:getFileStats', async (_event, filePath: string) => {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      isDirectory: stats.isDirectory(),
      mtime: stats.mtime,
    };
  });
}
