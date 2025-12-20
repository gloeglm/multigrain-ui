// Multigrain audio specifications
export const AUDIO_SPECS = {
  FORMAT: 'wav',
  SAMPLE_RATE: 48000,
  BIT_DEPTH: 16,
  CHANNELS: 2, // Stereo
  MAX_DURATION_SECONDS: 32,
} as const;

// Storage limits
export const STORAGE_LIMITS = {
  MAX_PROJECTS: 48, // 6 banks x 8 projects
  PRESETS_PER_PROJECT: 48, // 6 banks x 8 presets
  SOUNDS_PER_PRESET: 8,
  SAMPLES_PER_PROJECT: 128,
  SAMPLES_IN_WAVS: 128,
  SAMPLES_IN_RECS: 1024,
} as const;

// Folder names
export const FOLDER_NAMES = {
  ROOT: 'Multigrain',
  RECS: 'Recs',
  WAVS: 'Wavs',
  SETTINGS_FILE: 'Settings.mgs',
  AUTOSAVE_FILE: 'Autosave.mgp',
} as const;

// File extensions
export const FILE_EXTENSIONS = {
  AUDIO: '.wav',
  PROJECT_SETTINGS: '.mgp',
  GLOBAL_SETTINGS: '.mgs',
} as const;

// Generate project folder names (Project01 - Project48)
export const getProjectFolderName = (index: number): string => {
  if (index < 1 || index > STORAGE_LIMITS.MAX_PROJECTS) {
    throw new Error(`Project index must be between 1 and ${STORAGE_LIMITS.MAX_PROJECTS}`);
  }
  return `Project${index.toString().padStart(2, '0')}`;
};

// Generate preset file names (Preset01.mgp - Preset48.mgp)
export const getPresetFileName = (index: number): string => {
  if (index < 1 || index > STORAGE_LIMITS.PRESETS_PER_PROJECT) {
    throw new Error(`Preset index must be between 1 and ${STORAGE_LIMITS.PRESETS_PER_PROJECT}`);
  }
  return `Preset${index.toString().padStart(2, '0')}${FILE_EXTENSIONS.PROJECT_SETTINGS}`;
};
