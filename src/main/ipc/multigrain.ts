import { ipcMain } from 'electron';
import { validateMultigrainStructure, findMultigrainFolder } from '../utils/multigrain';

export function registerMultigrainHandlers(): void {
  ipcMain.handle('multigrain:validate', async (_event, rootPath: string) => {
    return await validateMultigrainStructure(rootPath);
  });

  ipcMain.handle('multigrain:findFolder', async (_event, searchPath: string) => {
    return await findMultigrainFolder(searchPath);
  });
}
