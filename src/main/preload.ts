import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  showSaveDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => ipcRenderer.invoke('dialog:showSaveDialog', options),
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
  validateMultigrain: (rootPath: string) => ipcRenderer.invoke('multigrain:validate', rootPath),
  findMultigrainFolder: (searchPath: string) =>
    ipcRenderer.invoke('multigrain:findFolder', searchPath),

  // Audio operations
  convertAudio: (inputPath: string, outputPath: string) =>
    ipcRenderer.invoke('audio:convert', inputPath, outputPath),
  readAudioMetadata: (filePath: string) => ipcRenderer.invoke('audio:readMetadata', filePath),
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
  readPresetSamples: (filePath: string) => ipcRenderer.invoke('preset:readSamples', filePath),

  // Import operations
  selectImportFiles: () => ipcRenderer.invoke('import:selectFiles'),
  validateImportFiles: (files: string[], targetPath: string) =>
    ipcRenderer.invoke('import:validateFiles', { files, targetPath }),
  executeImport: (files: string[], targetPath: string) =>
    ipcRenderer.invoke('import:executeBatch', { files, targetPath }),
  onImportProgress: (
    callback: (progress: import('../shared/types/import').ImportProgress) => void
  ) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: unknown) =>
      callback(progress as import('../shared/types/import').ImportProgress);
    ipcRenderer.on('import:progress', handler);
    return () => ipcRenderer.removeListener('import:progress', handler);
  },

  // File operations (delete)
  deleteProject: (projectPath: string) => ipcRenderer.invoke('files:deleteProject', projectPath),
  deleteSample: (samplePath: string) => ipcRenderer.invoke('files:deleteSample', samplePath),
  deleteSamples: (samplePaths: string[]) => ipcRenderer.invoke('files:deleteSamples', samplePaths),

  // File operations (rename)
  renameSample: (samplePath: string, newName: string) =>
    ipcRenderer.invoke('files:renameSample', samplePath, newName),

  // PDF export operations
  exportOverviewPdf: (structure: import('../shared/types').MultigainStructure) =>
    ipcRenderer.invoke('pdf:exportOverview', structure),
  exportProjectPdf: (
    project: import('../shared/types').Project,
    structure: import('../shared/types').MultigainStructure
  ) => ipcRenderer.invoke('pdf:exportProject', project, structure),
  exportAllProjectsPdf: (structure: import('../shared/types').MultigainStructure) =>
    ipcRenderer.invoke('pdf:exportAllProjects', structure),
});

export type ElectronAPI = {
  selectDirectory: () => Promise<string | null>;
  showSaveDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<{
    canceled: boolean;
    filePath?: string;
  }>;
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
  writeAudioMetadata: (
    filePath: string,
    description: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  readProjectMetadata: (projectPath: string) => Promise<{
    customName: string;
  }>;
  writeProjectMetadata: (
    projectPath: string,
    customName: string
  ) => Promise<{
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
  createProject: (
    rootPath: string,
    projectNumber: number,
    customName?: string
  ) => Promise<{
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
  validateImportFiles: (
    files: string[],
    targetPath: string
  ) => Promise<{
    analyses: import('../shared/types/import').AudioAnalysis[];
    storageInfo: {
      currentCount: number;
      limit: number;
      availableSlots: number;
      wouldExceed: boolean;
    };
  }>;
  executeImport: (
    files: string[],
    targetPath: string
  ) => Promise<import('../shared/types/import').ImportResult>;
  onImportProgress: (
    callback: (progress: import('../shared/types/import').ImportProgress) => void
  ) => () => void;
  deleteProject: (projectPath: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  deleteSample: (samplePath: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  deleteSamples: (samplePaths: string[]) => Promise<{
    success: boolean;
    count?: number;
    total?: number;
    results?: Array<{ path: string; success: boolean; error?: string }>;
  }>;
  renameSample: (
    samplePath: string,
    newName: string
  ) => Promise<{
    success: boolean;
    newPath?: string;
    newName?: string;
    error?: string;
  }>;
  exportOverviewPdf: (structure: import('../shared/types').MultigainStructure) => Promise<{
    success: boolean;
    tempFilePath?: string;
    suggestedFilename?: string;
    error?: string;
  }>;
  exportProjectPdf: (
    project: import('../shared/types').Project,
    structure: import('../shared/types').MultigainStructure
  ) => Promise<{
    success: boolean;
    tempFilePath?: string;
    suggestedFilename?: string;
    error?: string;
  }>;
  exportAllProjectsPdf: (structure: import('../shared/types').MultigainStructure) => Promise<{
    success: boolean;
    count?: number;
    total?: number;
    failed?: Array<{ project: string; success: boolean; error?: string }>;
    outputDir?: string;
    canceled?: boolean;
    error?: string;
  }>;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
