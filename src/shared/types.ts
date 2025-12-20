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

export interface Project {
  name: string;
  path: string;
  index: number; // 1-48
  presets: Preset[];
  samples: WavFile[];
  hasAutosave: boolean;
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
