import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  readDirectory: (path: string) => ipcRenderer.invoke('fs:readDirectory', path),
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path: string, data: Buffer) => ipcRenderer.invoke('fs:writeFile', path, data),
  deleteFile: (path: string) => ipcRenderer.invoke('fs:deleteFile', path),
  moveFile: (src: string, dest: string) => ipcRenderer.invoke('fs:moveFile', src, dest),
  copyFile: (src: string, dest: string) => ipcRenderer.invoke('fs:copyFile', src, dest),
  getFileStats: (path: string) => ipcRenderer.invoke('fs:getFileStats', path),

  // Drive detection
  listDrives: () => ipcRenderer.invoke('drives:list'),

  // Audio operations
  convertAudio: (inputPath: string, outputPath: string) =>
    ipcRenderer.invoke('audio:convert', inputPath, outputPath),
});

export type ElectronAPI = {
  selectDirectory: () => Promise<string | null>;
  readDirectory: (path: string) => Promise<string[]>;
  readFile: (path: string) => Promise<Buffer>;
  writeFile: (path: string, data: Buffer) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  moveFile: (src: string, dest: string) => Promise<void>;
  copyFile: (src: string, dest: string) => Promise<void>;
  getFileStats: (path: string) => Promise<{
    size: number;
    isDirectory: boolean;
    mtime: Date;
  }>;
  listDrives: () => Promise<string[]>;
  convertAudio: (inputPath: string, outputPath: string) => Promise<void>;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
