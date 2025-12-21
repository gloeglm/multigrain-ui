import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock localStorage if not available or incomplete
if (typeof global.localStorage === 'undefined' || !global.localStorage.clear) {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      },
    };
  })();

  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

// Mock Electron APIs globally
global.window = global.window || ({} as any);
global.window.electronAPI = {
  // File system operations
  selectDirectory: vi.fn(),
  readDirectory: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  deleteFile: vi.fn(),
  moveFile: vi.fn(),
  copyFile: vi.fn(),
  getFileStats: vi.fn(),

  // Drive detection
  listDrives: vi.fn(),

  // Multigrain operations
  validateMultigrain: vi.fn(),
  findMultigrainFolder: vi.fn(),

  // Audio operations
  convertAudio: vi.fn(),
  readAudioMetadata: vi.fn(),
  writeAudioMetadata: vi.fn(),

  // Project metadata operations
  readProjectMetadata: vi.fn(),
  writeProjectMetadata: vi.fn(),
  batchWriteProjectMetadata: vi.fn(),

  // Project operations
  createProject: vi.fn(),

  // Preset operations
  readPresetSamples: vi.fn(),

  // Import operations
  selectImportFiles: vi.fn(),
  validateImportFiles: vi.fn(),
  executeImport: vi.fn(),
  onImportProgress: vi.fn(),

  // File operations (delete)
  deleteProject: vi.fn(),
  deleteSample: vi.fn(),
  deleteSamples: vi.fn(),

  // File operations (rename)
  renameSample: vi.fn(),
} as any;
