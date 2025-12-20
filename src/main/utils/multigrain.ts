import fs from 'node:fs/promises';
import path from 'node:path';
import {
  MultigainStructure,
  ValidationResult,
  Project,
  Preset,
  WavFile,
  FileEntry,
} from '../../shared/types';
import { FOLDER_NAMES, FILE_EXTENSIONS, STORAGE_LIMITS } from '../../shared/constants';

// Files to ignore (macOS metadata, etc.)
const IGNORED_PATTERNS = ['.DS_Store', '._', '.Spotlight', '.fseventsd', '__MACOSX'];

function shouldIgnore(name: string): boolean {
  return IGNORED_PATTERNS.some((pattern) => name.startsWith(pattern));
}

async function getDirectoryEntries(dirPath: string): Promise<FileEntry[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => !shouldIgnore(entry.name))
      .map((entry) => ({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isDirectory: entry.isDirectory(),
      }));
  } catch {
    return [];
  }
}

async function getWavFiles(dirPath: string): Promise<WavFile[]> {
  const entries = await getDirectoryEntries(dirPath);
  const wavFiles: WavFile[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory && entry.name.toLowerCase().endsWith(FILE_EXTENSIONS.AUDIO)) {
      try {
        const stats = await fs.stat(entry.path);
        wavFiles.push({
          name: entry.name,
          path: entry.path,
          size: stats.size,
        });
      } catch {
        // Skip files we can't stat
      }
    }
  }

  return wavFiles.sort((a, b) => a.name.localeCompare(b.name));
}

async function parseProject(projectPath: string, projectName: string): Promise<Project | null> {
  // Extract project index from name (e.g., "Project01" -> 1)
  const match = projectName.match(/^Project(\d{2})$/);
  if (!match) return null;

  const index = parseInt(match[1], 10);
  if (index < 1 || index > STORAGE_LIMITS.MAX_PROJECTS) return null;

  const entries = await getDirectoryEntries(projectPath);

  // Find presets
  const presets: Preset[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory && entry.name.match(/^Preset\d{2}\.mgp$/i)) {
      const presetMatch = entry.name.match(/^Preset(\d{2})\.mgp$/i);
      if (presetMatch) {
        presets.push({
          name: entry.name,
          path: entry.path,
          index: parseInt(presetMatch[1], 10),
        });
      }
    }
  }

  // Find WAV samples
  const samples = await getWavFiles(projectPath);

  // Check for autosave and create preset object if it exists
  const autosaveEntry = entries.find(
    (e) => !e.isDirectory && e.name.toLowerCase() === FOLDER_NAMES.AUTOSAVE_FILE.toLowerCase()
  );
  const hasAutosave = !!autosaveEntry;
  const autosave: Preset | undefined = autosaveEntry
    ? {
        name: 'Autosave',
        path: path.join(projectPath, autosaveEntry.name),
        index: 0, // Special index for autosave
      }
    : undefined;

  // Load custom name from metadata file
  let customName: string | undefined;
  try {
    const metadataPath = path.join(projectPath, '.project-metadata.json');
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    customName = metadata.customName || undefined;
  } catch {
    // Metadata file doesn't exist or is invalid, that's okay
  }

  return {
    name: projectName,
    path: projectPath,
    index,
    presets: presets.sort((a, b) => a.index - b.index),
    samples,
    hasAutosave,
    autosave,
    customName,
  };
}

export async function validateMultigrainStructure(rootPath: string): Promise<ValidationResult> {
  const errors: string[] = [];

  // Check if path exists
  try {
    const stats = await fs.stat(rootPath);
    if (!stats.isDirectory()) {
      return { isValid: false, errors: ['Selected path is not a directory'] };
    }
  } catch {
    return { isValid: false, errors: ['Cannot access the selected path'] };
  }

  // Check if this is a Multigrain root or if we need to look for the Multigrain folder
  let multigrainPath = rootPath;
  const entries = await getDirectoryEntries(rootPath);
  const hasMultigrainFolder = entries.some(
    (e) => e.isDirectory && e.name === FOLDER_NAMES.ROOT
  );

  if (hasMultigrainFolder) {
    multigrainPath = path.join(rootPath, FOLDER_NAMES.ROOT);
  }

  // Get contents of Multigrain folder
  const multigrainEntries = await getDirectoryEntries(multigrainPath);

  // Check for Settings.mgs
  const hasSettings = multigrainEntries.some(
    (e) => !e.isDirectory && e.name === FOLDER_NAMES.SETTINGS_FILE
  );

  // Parse projects
  const projects: Project[] = [];
  for (const entry of multigrainEntries) {
    if (entry.isDirectory && entry.name.match(/^Project\d{2}$/)) {
      const project = await parseProject(entry.path, entry.name);
      if (project) {
        projects.push(project);
      }
    }
  }
  projects.sort((a, b) => a.index - b.index);

  // Get global WAVs
  const wavsPath = path.join(multigrainPath, FOLDER_NAMES.WAVS);
  const globalWavs = await getWavFiles(wavsPath);

  // Get recordings
  const recsPath = path.join(multigrainPath, FOLDER_NAMES.RECS);
  const recordings = await getWavFiles(recsPath);

  // Validation checks
  if (!hasSettings) {
    errors.push('Missing Settings.mgs file');
  }

  if (projects.length === 0) {
    errors.push('No valid project folders found');
  }

  const structure: MultigainStructure = {
    rootPath: multigrainPath,
    isValid: errors.length === 0,
    projects,
    globalWavs,
    recordings,
    hasSettings,
    errors,
  };

  return {
    isValid: errors.length === 0,
    errors,
    structure,
  };
}

export async function findMultigrainFolder(searchPath: string): Promise<string | null> {
  const entries = await getDirectoryEntries(searchPath);

  // Check if current folder is named Multigrain
  if (path.basename(searchPath) === FOLDER_NAMES.ROOT) {
    return searchPath;
  }

  // Look for Multigrain folder in current directory
  const multigrainEntry = entries.find(
    (e) => e.isDirectory && e.name === FOLDER_NAMES.ROOT
  );

  if (multigrainEntry) {
    return multigrainEntry.path;
  }

  return null;
}
