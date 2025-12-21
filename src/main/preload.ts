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

  // Multigrain operations
  validateMultigrain: (rootPath: string) =>
    ipcRenderer.invoke('multigrain:validate', rootPath),
  findMultigrainFolder: (searchPath: string) =>
    ipcRenderer.invoke('multigrain:findFolder', searchPath),

  // Audio operations
  convertAudio: (inputPath: string, outputPath: string) =>
    ipcRenderer.invoke('audio:convert', inputPath, outputPath),
  readAudioMetadata: (filePath: string) =>
    ipcRenderer.invoke('audio:readMetadata', filePath),
  writeAudioMetadata: (filePath: string, description: string) =>
    ipcRenderer.invoke('audio:writeMetadata', filePath, description),

  // Project metadata operations
  readProjectMetadata: (projectPath: string) =>
    ipcRenderer.invoke('project:readMetadata', projectPath),
  writeProjectMetadata: (projectPath: string, customName: string) =>
    ipcRenderer.invoke('project:writeMetadata', projectPath, customName),
  batchWriteProjectMetadata: (updates: Array<{ projectPath: string; customName: string }>) =>
    ipcRenderer.invoke('project:batchWriteMetadata', updates),

  // Project operations
  createProject: (rootPath: string, projectNumber: number, customName?: string) =>
    ipcRenderer.invoke('project:create', rootPath, projectNumber, customName),

  // Preset operations
  readPresetSamples: (filePath: string) =>
    ipcRenderer.invoke('preset:readSamples', filePath),

  // Import operations
  selectImportFiles: () => ipcRenderer.invoke('import:selectFiles'),
  validateImportFiles: (files: string[], targetPath: string) =>
    ipcRenderer.invoke('import:validateFiles', { files, targetPath }),
  executeImport: (files: string[], targetPath: string) =>
    ipcRenderer.invoke('import:executeBatch', { files, targetPath }),
  onImportProgress: (callback: (progress: any) => void) => {
    const handler = (_: any, progress: any) => callback(progress);
    ipcRenderer.on('import:progress', handler);
    return () => ipcRenderer.removeListener('import:progress', handler);
  },
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
  validateMultigrain: (rootPath: string) => Promise<import('../shared/types').ValidationResult>;
  findMultigrainFolder: (searchPath: string) => Promise<string | null>;
  convertAudio: (inputPath: string, outputPath: string) => Promise<void>;
  readAudioMetadata: (filePath: string) => Promise<{
    description: string;
    title: string;
    artist: string;
    duration: number;
    sampleRate: number;
    bitDepth: number;
    channels: number;
  }>;
  writeAudioMetadata: (filePath: string, description: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  readProjectMetadata: (projectPath: string) => Promise<{
    customName: string;
  }>;
  writeProjectMetadata: (projectPath: string, customName: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  batchWriteProjectMetadata: (
    updates: Array<{ projectPath: string; customName: string }>
  ) => Promise<{
    success: boolean;
    count?: number;
    error?: string;
  }>;
  createProject: (rootPath: string, projectNumber: number, customName?: string) => Promise<{
    success: boolean;
    projectPath?: string;
    projectName?: string;
    error?: string;
  }>;
  readPresetSamples: (filePath: string) => Promise<{
    success: boolean;
    samples?: string[];
    error?: string;
  }>;
  selectImportFiles: () => Promise<string[] | null>;
  validateImportFiles: (files: string[], targetPath: string) => Promise<{
    analyses: import('../shared/types/import').AudioAnalysis[];
    storageInfo: {
      currentCount: number;
      limit: number;
      availableSlots: number;
      wouldExceed: boolean;
    };
  }>;
  executeImport: (files: string[], targetPath: string) => Promise<import('../shared/types/import').ImportResult>;
  onImportProgress: (callback: (progress: import('../shared/types/import').ImportProgress) => void) => () => void;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
