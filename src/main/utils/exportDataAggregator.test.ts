import { describe, it, expect, beforeEach, vi } from 'vitest';
import { vol } from 'memfs';
import { aggregateOverviewData, aggregateProjectData } from './exportDataAggregator';
import {
  createMockStructure,
  createMockProject,
  createMockSample,
  createMockPreset,
} from '../../test/helpers';

// Mock fs with memfs
vi.mock('node:fs/promises', () => ({
  default: vol.promises,
  ...vol.promises,
}));

// Mock music-metadata to avoid actual file parsing
vi.mock('music-metadata', () => ({
  parseFile: vi.fn().mockResolvedValue({
    common: {},
    native: {},
  }),
}));

// Mock presetParser
vi.mock('./presetParser', () => ({
  extractSamplesFromPreset: vi.fn(),
}));

import { extractSamplesFromPreset } from './presetParser';

describe('Export Data Aggregator', () => {
  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  describe('aggregateOverviewData', () => {
    it('should create overview data for all projects', async () => {
      const projects = [
        createMockProject({
          index: 1,
          name: 'Project01',
          customName: 'My Project',
          samples: [createMockSample()],
          presets: [createMockPreset(), createMockPreset()],
        }),
        createMockProject({
          index: 2,
          name: 'Project02',
          samples: [createMockSample(), createMockSample()],
          presets: [createMockPreset()],
        }),
      ];

      const structure = createMockStructure({
        rootPath: '/test/multigrain',
        projects,
      });

      const result = await aggregateOverviewData(structure);

      expect(result.rootPath).toBe('/test/multigrain');
      expect(result.totalProjects).toBe(2);
      expect(result.projects).toHaveLength(2);

      // Check first project
      expect(result.projects[0].index).toBe(1);
      expect(result.projects[0].name).toBe('Project01');
      expect(result.projects[0].customName).toBe('My Project');
      expect(result.projects[0].bankPosition).toBe('X / 1');
      expect(result.projects[0].sampleCount).toBe(1);
      expect(result.projects[0].presetCount).toBe(2);

      // Check second project
      expect(result.projects[1].index).toBe(2);
      expect(result.projects[1].bankPosition).toBe('X / 2');
      expect(result.projects[1].sampleCount).toBe(2);
      expect(result.projects[1].presetCount).toBe(1);
    });

    it('should handle empty project list', async () => {
      const structure = createMockStructure({
        projects: [],
      });

      const result = await aggregateOverviewData(structure);

      expect(result.totalProjects).toBe(0);
      expect(result.projects).toEqual([]);
    });

    it('should calculate correct bank positions', async () => {
      const projects = [
        createMockProject({ index: 1 }), // X/1
        createMockProject({ index: 8 }), // X/8
        createMockProject({ index: 9 }), // Y/1
        createMockProject({ index: 16 }), // Y/8
        createMockProject({ index: 17 }), // Z/1
        createMockProject({ index: 48 }), // ZZ/8
      ];

      const structure = createMockStructure({ projects });

      const result = await aggregateOverviewData(structure);

      expect(result.projects[0].bankPosition).toBe('X / 1');
      expect(result.projects[1].bankPosition).toBe('X / 8');
      expect(result.projects[2].bankPosition).toBe('Y / 1');
      expect(result.projects[3].bankPosition).toBe('Y / 8');
      expect(result.projects[4].bankPosition).toBe('Z / 1');
      expect(result.projects[5].bankPosition).toBe('ZZ / 8');
    });
  });

  describe('aggregateProjectData', () => {
    it('should build sample usage map correctly', async () => {
      const project = createMockProject({
        index: 1,
        samples: [createMockSample({ name: 'kick.wav' }), createMockSample({ name: 'snare.wav' })],
        presets: [
          createMockPreset({ name: 'Preset01.mgp', path: '/test/preset1.mgp' }),
          createMockPreset({ name: 'Preset02.mgp', path: '/test/preset2.mgp' }),
        ],
      });

      const structure = createMockStructure({ projects: [project] });

      // Mock preset extraction
      vi.mocked(extractSamplesFromPreset).mockImplementation(async (path: string) => {
        if (path === '/test/preset1.mgp') {
          return ['kick.wav', 'snare.wav', '', '', '', '', '', ''];
        }
        if (path === '/test/preset2.mgp') {
          return ['kick.wav', '', '', '', '', '', '', ''];
        }
        return [];
      });

      const result = await aggregateProjectData(project, structure);

      // kick.wav should be used by both presets
      const kickSample = result.samples.find((s) => s.name === 'kick.wav');
      expect(kickSample).toBeDefined();
      expect(kickSample!.usedByPresets).toContain('Preset01.mgp');
      expect(kickSample!.usedByPresets).toContain('Preset02.mgp');

      // snare.wav should be used by only one preset
      const snareSample = result.samples.find((s) => s.name === 'snare.wav');
      expect(snareSample).toBeDefined();
      expect(snareSample!.usedByPresets).toEqual(['Preset01.mgp']);
    });

    it('should filter out empty preset slots', async () => {
      const project = createMockProject({
        index: 1,
        samples: [createMockSample({ name: 'kick.wav' })],
        presets: [createMockPreset({ name: 'Preset01.mgp', path: '/test/preset1.mgp' })],
      });

      const structure = createMockStructure({ projects: [project] });

      // Mock preset with empty slots
      vi.mocked(extractSamplesFromPreset).mockResolvedValue([
        'kick.wav',
        '', // Empty slot
        '', // Empty slot
        '', // Empty slot
        '', // Empty slot
        '', // Empty slot
        '', // Empty slot
        '', // Empty slot
      ]);

      const result = await aggregateProjectData(project, structure);

      // Should only have kick.wav, no empty samples
      expect(result.samples).toHaveLength(1);
      expect(result.samples[0].name).toBe('kick.wav');
      expect(result.samples[0].usedByPresets).toEqual(['Preset01.mgp']);
    });

    it('should include autosave preset if present', async () => {
      const project = createMockProject({
        index: 1,
        samples: [createMockSample({ name: 'kick.wav' })],
        presets: [createMockPreset({ name: 'Preset01.mgp', path: '/test/preset1.mgp' })],
        hasAutosave: true,
        autosave: createMockPreset({ name: 'Autosave', path: '/test/autosave.mgp', index: 0 }),
      });

      const structure = createMockStructure({ projects: [project] });

      // Mock preset extraction
      vi.mocked(extractSamplesFromPreset).mockImplementation(async (path: string) => {
        if (path === '/test/autosave.mgp') {
          return ['kick.wav', '', '', '', '', '', '', ''];
        }
        if (path === '/test/preset1.mgp') {
          return ['kick.wav', '', '', '', '', '', '', ''];
        }
        return [];
      });

      const result = await aggregateProjectData(project, structure);

      // Should have autosave and preset01
      expect(result.presets).toHaveLength(2);
      expect(result.presets[0].name).toBe('Autosave');
      expect(result.presets[0].isAutosave).toBe(true);
      expect(result.presets[1].name).toBe('Preset01.mgp');

      // kick.wav should be used by both
      const kickSample = result.samples.find((s) => s.name === 'kick.wav');
      expect(kickSample!.usedByPresets).toContain('Autosave');
      expect(kickSample!.usedByPresets).toContain('Preset01.mgp');
    });

    it('should resolve sample locations with correct priority (PROJECT > WAVS > RECS)', async () => {
      const project = createMockProject({
        index: 1,
        samples: [createMockSample({ name: 'kick.wav', path: '/test/Project01/kick.wav' })],
        presets: [createMockPreset({ name: 'Preset01.mgp', path: '/test/preset1.mgp' })],
      });

      const structure = createMockStructure({
        projects: [project],
        globalWavs: [createMockSample({ name: 'global.wav', path: '/test/Wavs/global.wav' })],
        recordings: [createMockSample({ name: 'rec001.wav', path: '/test/Recs/rec001.wav' })],
      });

      // Mock preset references samples from different locations
      vi.mocked(extractSamplesFromPreset).mockResolvedValue([
        'kick.wav', // In PROJECT
        'global.wav', // In WAVS
        'rec001.wav', // In RECS
        'missing.wav', // NOT_FOUND
        '',
        '',
        '',
        '',
      ]);

      const result = await aggregateProjectData(project, structure);

      // Check preset sample locations
      const preset = result.presets[0];
      expect(preset.samples[0].name).toBe('kick.wav');
      expect(preset.samples[0].location).toBe('PROJECT');

      expect(preset.samples[1].name).toBe('global.wav');
      expect(preset.samples[1].location).toBe('WAVS');

      expect(preset.samples[2].name).toBe('rec001.wav');
      expect(preset.samples[2].location).toBe('RECS');

      expect(preset.samples[3].name).toBe('missing.wav');
      expect(preset.samples[3].location).toBe('NOT_FOUND');
    });

    it('should sort samples by usage count then alphabetically', async () => {
      const project = createMockProject({
        index: 1,
        samples: [
          createMockSample({ name: 'alpha.wav' }),
          createMockSample({ name: 'beta.wav' }),
          createMockSample({ name: 'gamma.wav' }),
        ],
        presets: [
          createMockPreset({ name: 'Preset01.mgp', path: '/test/preset1.mgp' }),
          createMockPreset({ name: 'Preset02.mgp', path: '/test/preset2.mgp' }),
          createMockPreset({ name: 'Preset03.mgp', path: '/test/preset3.mgp' }),
        ],
      });

      const structure = createMockStructure({ projects: [project] });

      // Mock presets: beta used 3 times, gamma used 2 times, alpha used 1 time
      vi.mocked(extractSamplesFromPreset).mockImplementation(async (path: string) => {
        if (path === '/test/preset1.mgp') {
          return ['alpha.wav', 'beta.wav', 'gamma.wav', '', '', '', '', ''];
        }
        if (path === '/test/preset2.mgp') {
          return ['beta.wav', 'gamma.wav', '', '', '', '', '', ''];
        }
        if (path === '/test/preset3.mgp') {
          return ['beta.wav', '', '', '', '', '', '', ''];
        }
        return [];
      });

      const result = await aggregateProjectData(project, structure);

      // Should be sorted by usage count: beta (3), gamma (2), alpha (1)
      expect(result.samples[0].name).toBe('beta.wav');
      expect(result.samples[0].usedByPresets).toHaveLength(3);

      expect(result.samples[1].name).toBe('gamma.wav');
      expect(result.samples[1].usedByPresets).toHaveLength(2);

      expect(result.samples[2].name).toBe('alpha.wav');
      expect(result.samples[2].usedByPresets).toHaveLength(1);
    });

    it('should handle preset read errors gracefully', async () => {
      const project = createMockProject({
        index: 1,
        samples: [createMockSample({ name: 'kick.wav' })],
        presets: [createMockPreset({ name: 'Preset01.mgp', path: '/test/preset1.mgp' })],
      });

      const structure = createMockStructure({ projects: [project] });

      // Mock preset extraction to throw error
      vi.mocked(extractSamplesFromPreset).mockRejectedValue(new Error('Failed to read preset'));

      const result = await aggregateProjectData(project, structure);

      // Should still return data, but preset will have empty samples
      expect(result.presets).toHaveLength(1);
      expect(result.presets[0].samples.every((s) => s.name === '')).toBe(true);
    });

    it('should include samples from presets even if not in project folder', async () => {
      const project = createMockProject({
        index: 1,
        samples: [createMockSample({ name: 'kick.wav' })],
        presets: [createMockPreset({ name: 'Preset01.mgp', path: '/test/preset1.mgp' })],
      });

      const structure = createMockStructure({
        projects: [project],
        globalWavs: [createMockSample({ name: 'global.wav' })],
      });

      // Preset references a sample from WAVS folder
      vi.mocked(extractSamplesFromPreset).mockResolvedValue([
        'kick.wav',
        'global.wav', // Not in project folder
        '',
        '',
        '',
        '',
        '',
        '',
      ]);

      const result = await aggregateProjectData(project, structure);

      // Should include both kick.wav and global.wav
      expect(result.samples).toHaveLength(2);
      expect(result.samples.map((s) => s.name)).toContain('kick.wav');
      expect(result.samples.map((s) => s.name)).toContain('global.wav');
    });
  });
});
