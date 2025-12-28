// File system entry types
export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export interface FileStats {
  size: number;
  isDirectory: boolean;
  mtime: Date;
}

// Multigrain-specific types
export interface WavFile {
  name: string;
  path: string;
  size: number;
}

export interface Preset {
  name: string;
  path: string;
  index: number; // 1-48
}

export interface PresetWithSamples extends Preset {
  samples: string[]; // Sample filenames referenced in this preset
}

export interface Project {
  name: string;
  path: string;
  index: number; // 1-48
  presets: Preset[];
  samples: WavFile[];
  hasAutosave: boolean;
  autosave?: Preset; // Autosave.mgp preset (current project state)
  customName?: string; // User-defined custom name from metadata file
}

export interface MultigainStructure {
  rootPath: string;
  isValid: boolean;
  projects: Project[];
  globalWavs: WavFile[];
  recordings: WavFile[];
  hasSettings: boolean;
  errors: string[];
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  structure?: MultigainStructure;
}

// Tree selection types - unified selection state for file tree and right panel
// Stores paths instead of object references to avoid stale data after reloads
export type TreeSelection =
  | { type: 'overview' }
  | { type: 'sample'; samplePath: string }
  | { type: 'preset'; presetPath: string; projectPath?: string }
  | { type: 'project'; projectPath: string };

// PDF Export types
export interface OverviewData {
  rootPath: string;
  totalProjects: number;
  projects: Array<{
    index: number;
    bankPosition: string; // "X / 1"
    name: string;
    customName?: string;
    sampleCount: number;
    presetCount: number;
  }>;
}

export interface ProjectExportData {
  project: {
    index: number;
    bankPosition: string;
    name: string;
    customName?: string;
  };
  samples: Array<{
    name: string;
    description?: string;
    usedByPresets: string[]; // Preset names referencing this sample
  }>;
  presets: Array<{
    name: string;
    index: number;
    isAutosave: boolean;
    samples: Array<{
      slotNumber: number; // 1-8
      name: string;
      location: 'PROJECT' | 'WAVS' | 'RECS' | 'NOT_FOUND';
    }>;
  }>;
}

// Import types
export * from './types/import';
