import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MultigainStructure, WavFile, Preset, Project } from '../shared/types';

/**
 * Custom render function that can wrap components with providers if needed
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options });
}

/**
 * Create a mock MultigainStructure for testing
 */
export function createMockStructure(overrides?: Partial<MultigainStructure>): MultigainStructure {
  const defaultStructure: MultigainStructure = {
    rootPath: '/test/multigrain',
    isValid: true,
    projects: [],
    globalWavs: [],
    recordings: [],
    hasSettings: true,
    errors: [],
  };

  return { ...defaultStructure, ...overrides };
}

/**
 * Create a mock WavFile for testing
 */
export function createMockSample(overrides?: Partial<WavFile>): WavFile {
  const defaults: WavFile = {
    name: 'test-sample.wav',
    path: '/test/multigrain/Project01/test-sample.wav',
    size: 1024000, // 1MB
  };

  return { ...defaults, ...overrides };
}

/**
 * Create a mock Preset for testing
 */
export function createMockPreset(overrides?: Partial<Preset>): Preset {
  const defaults: Preset = {
    name: 'Preset01.mgp',
    path: '/test/multigrain/Project01/Preset01.mgp',
    index: 1,
  };

  return { ...defaults, ...overrides };
}

/**
 * Create a mock Project for testing
 */
export function createMockProject(overrides?: Partial<Project>): Project {
  const defaults: Project = {
    name: 'Project01',
    path: '/test/multigrain/Project01',
    index: 1,
    presets: [],
    samples: [],
    hasAutosave: false,
  };

  return { ...defaults, ...overrides };
}

/**
 * Create a complete mock structure with projects, samples, and presets
 */
export function createMockStructureWithData(): MultigainStructure {
  const samples = [
    createMockSample({ name: 'kick.wav', path: '/test/multigrain/Project01/kick.wav' }),
    createMockSample({ name: 'snare.wav', path: '/test/multigrain/Project01/snare.wav' }),
  ];

  const presets = [
    createMockPreset({
      name: 'Preset01.mgp',
      path: '/test/multigrain/Project01/Preset01.mgp',
      index: 1,
    }),
  ];

  const project = createMockProject({
    name: 'Project01',
    path: '/test/multigrain/Project01',
    index: 1,
    samples,
    presets,
    hasAutosave: true,
    autosave: createMockPreset({
      name: 'Autosave.mgp',
      path: '/test/multigrain/Project01/Autosave.mgp',
      index: 0,
    }),
  });

  return createMockStructure({
    projects: [project],
    globalWavs: [
      createMockSample({ name: 'global.wav', path: '/test/multigrain/Wavs/global.wav' }),
    ],
    recordings: [
      createMockSample({ name: 'rec001.wav', path: '/test/multigrain/Recs/rec001.wav' }),
    ],
  });
}

/**
 * Wait for a condition to be true with timeout
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 3000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}
