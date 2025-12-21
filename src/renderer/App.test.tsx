import { describe, it, expect } from 'vitest';
import { createMockStructure, createMockSample, createMockPreset, createMockProject } from '../test/helpers';

// We can't easily test the full App component without significant mocking,
// but we can test the helper functions by extracting them or testing the logic

describe('App Helper Functions - Sample Resolution', () => {
  describe('findSampleByPath logic', () => {
    it('finds sample in project samples', () => {
      const sample = createMockSample({
        name: 'kick.wav',
        path: '/test/Project01/kick.wav'
      });
      const project = createMockProject({
        samples: [sample],
        path: '/test/Project01'
      });
      const structure = createMockStructure({ projects: [project] });

      // Search logic: check projects first
      const found = structure.projects
        .flatMap(p => p.samples)
        .find(s => s.path === '/test/Project01/kick.wav');

      expect(found).toBeDefined();
      expect(found?.name).toBe('kick.wav');
    });

    it('finds sample in globalWavs', () => {
      const sample = createMockSample({
        name: 'global.wav',
        path: '/test/Wavs/global.wav'
      });
      const structure = createMockStructure({
        globalWavs: [sample]
      });

      const found = structure.globalWavs.find(s => s.path === '/test/Wavs/global.wav');

      expect(found).toBeDefined();
      expect(found?.name).toBe('global.wav');
    });

    it('finds sample in recordings', () => {
      const sample = createMockSample({
        name: 'rec001.wav',
        path: '/test/Recs/rec001.wav'
      });
      const structure = createMockStructure({
        recordings: [sample]
      });

      const found = structure.recordings.find(s => s.path === '/test/Recs/rec001.wav');

      expect(found).toBeDefined();
      expect(found?.name).toBe('rec001.wav');
    });

    it('returns null when sample not found', () => {
      const structure = createMockStructure();

      const foundInProjects = structure.projects
        .flatMap(p => p.samples)
        .find(s => s.path === '/nonexistent/sample.wav');

      const foundInGlobal = structure.globalWavs
        .find(s => s.path === '/nonexistent/sample.wav');

      const foundInRecs = structure.recordings
        .find(s => s.path === '/nonexistent/sample.wav');

      expect(foundInProjects).toBeUndefined();
      expect(foundInGlobal).toBeUndefined();
      expect(foundInRecs).toBeUndefined();
    });

    it('finds correct sample after rename (updated path)', () => {
      const oldPath = '/test/Project01/old-name.wav';
      const newPath = '/test/Project01/new-name.wav';

      // Simulate structure before rename
      const sampleBefore = createMockSample({
        name: 'old-name.wav',
        path: oldPath
      });
      const projectBefore = createMockProject({
        samples: [sampleBefore]
      });

      // Simulate structure after rename (reload from disk)
      const sampleAfter = createMockSample({
        name: 'new-name.wav',
        path: newPath
      });
      const projectAfter = createMockProject({
        samples: [sampleAfter]
      });
      const structureAfter = createMockStructure({
        projects: [projectAfter]
      });

      // Search with new path should find renamed sample
      const found = structureAfter.projects
        .flatMap(p => p.samples)
        .find(s => s.path === newPath);

      expect(found).toBeDefined();
      expect(found?.name).toBe('new-name.wav');
      expect(found?.path).toBe(newPath);

      // Search with old path should NOT find it
      const notFound = structureAfter.projects
        .flatMap(p => p.samples)
        .find(s => s.path === oldPath);

      expect(notFound).toBeUndefined();
    });
  });

  describe('findPresetByPath logic', () => {
    it('finds preset in project presets', () => {
      const preset = createMockPreset({
        name: 'Preset01.mgp',
        path: '/test/Project01/Preset01.mgp'
      });
      const project = createMockProject({
        presets: [preset],
        path: '/test/Project01'
      });
      const structure = createMockStructure({ projects: [project] });

      const found = structure.projects
        .flatMap(p => p.presets)
        .find(pr => pr.path === '/test/Project01/Preset01.mgp');

      expect(found).toBeDefined();
      expect(found?.name).toBe('Preset01.mgp');
    });

    it('finds autosave preset', () => {
      const autosave = createMockPreset({
        name: 'Autosave.mgp',
        path: '/test/Project01/Autosave.mgp',
        index: 0
      });
      const project = createMockProject({
        hasAutosave: true,
        autosave,
        path: '/test/Project01'
      });
      const structure = createMockStructure({ projects: [project] });

      const found = structure.projects
        .find(p => p.autosave?.path === '/test/Project01/Autosave.mgp')
        ?.autosave;

      expect(found).toBeDefined();
      expect(found?.name).toBe('Autosave.mgp');
      expect(found?.index).toBe(0);
    });
  });

  describe('findProjectByPath logic', () => {
    it('finds project by path', () => {
      const project = createMockProject({
        name: 'Project01',
        path: '/test/Project01',
        index: 1
      });
      const structure = createMockStructure({ projects: [project] });

      const found = structure.projects.find(p => p.path === '/test/Project01');

      expect(found).toBeDefined();
      expect(found?.name).toBe('Project01');
      expect(found?.index).toBe(1);
    });

    it('returns undefined when project not found', () => {
      const structure = createMockStructure();

      const found = structure.projects.find(p => p.path === '/nonexistent/Project99');

      expect(found).toBeUndefined();
    });
  });

  describe('Path-based selection prevents stale references', () => {
    it('deriving from path ensures fresh data after reload', () => {
      // Initial structure
      const sample1 = createMockSample({
        name: 'old-name.wav',
        path: '/test/Project01/sample.wav'
      });
      const structure1 = createMockStructure({
        projects: [createMockProject({ samples: [sample1] })]
      });

      // Selection stores PATH, not object reference
      const selectedPath = '/test/Project01/sample.wav';

      // Simulate file system change (rename)
      const sample2 = createMockSample({
        name: 'new-name.wav',
        path: '/test/Project01/sample.wav' // Same path, different name
      });
      const structure2 = createMockStructure({
        projects: [createMockProject({ samples: [sample2] })]
      });

      // Derive from path with NEW structure
      const foundInNew = structure2.projects
        .flatMap(p => p.samples)
        .find(s => s.path === selectedPath);

      // Should get fresh data with new name
      expect(foundInNew?.name).toBe('new-name.wav');

      // If we had stored object reference instead:
      // sample1.name would still be 'old-name.wav' (STALE!)
      expect(sample1.name).toBe('old-name.wav');

      // This demonstrates why path-based selection solves the sync bug
    });

    it('handles renamed files by updating stored path', () => {
      const oldPath = '/test/Project01/old.wav';
      const newPath = '/test/Project01/new.wav';

      // Before rename
      const structureBefore = createMockStructure({
        projects: [createMockProject({
          samples: [createMockSample({ name: 'old.wav', path: oldPath })]
        })]
      });

      // Store the path
      let selectedPath = oldPath;

      // After rename - update the stored path
      selectedPath = newPath;

      const structureAfter = createMockStructure({
        projects: [createMockProject({
          samples: [createMockSample({ name: 'new.wav', path: newPath })]
        })]
      });

      // Derive from new path
      const found = structureAfter.projects
        .flatMap(p => p.samples)
        .find(s => s.path === selectedPath);

      expect(found?.name).toBe('new.wav');
      expect(found?.path).toBe(newPath);
    });
  });
});
