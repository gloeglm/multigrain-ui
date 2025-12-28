/**
 * Data Aggregation for PDF Export
 * Prepares data structures for overview and project reference sheets
 */

import { parseFile } from 'music-metadata';
import {
  MultigainStructure,
  Project,
  OverviewData,
  ProjectExportData,
  WavFile,
} from '@shared/types';
import { getProjectBankInfo } from '@shared/constants';
import { extractSamplesFromPreset } from './presetParser';

// Sample resolution result
interface ResolvedSample {
  name: string;
  location: 'PROJECT' | 'WAVS' | 'RECS' | 'NOT_FOUND';
  sample?: WavFile;
}

/**
 * Aggregate overview data for all projects on the SD card
 */
export async function aggregateOverviewData(structure: MultigainStructure): Promise<OverviewData> {
  const projectsData = structure.projects.map((project) => {
    const { bank, position } = getProjectBankInfo(project.index);
    const bankPosition = `${bank} / ${position}`;

    return {
      index: project.index,
      bankPosition,
      name: project.name,
      customName: project.customName,
      sampleCount: project.samples.length,
      presetCount: project.presets.length,
    };
  });

  return {
    rootPath: structure.rootPath,
    totalProjects: structure.projects.length,
    projects: projectsData,
  };
}

/**
 * Aggregate detailed project data including samples and presets
 */
export async function aggregateProjectData(
  project: Project,
  structure: MultigainStructure
): Promise<ProjectExportData> {
  const { bank, position } = getProjectBankInfo(project.index);
  const bankPosition = `${bank} / ${position}`;

  // Read all preset samples
  const presetsWithSamples = await Promise.all(
    project.presets.map(async (preset) => {
      try {
        const samples = await extractSamplesFromPreset(preset.path);
        return {
          preset,
          sampleNames: samples,
        };
      } catch (error) {
        console.error(`Error reading preset ${preset.name}:`, error);
        return {
          preset,
          sampleNames: Array(8).fill(''),
        };
      }
    })
  );

  // Add autosave if it exists
  if (project.hasAutosave && project.autosave) {
    try {
      const autosaveSamples = await extractSamplesFromPreset(project.autosave.path);
      presetsWithSamples.unshift({
        preset: project.autosave,
        sampleNames: autosaveSamples,
      });
    } catch (error) {
      console.error('Error reading autosave preset:', error);
      presetsWithSamples.unshift({
        preset: project.autosave,
        sampleNames: Array(8).fill(''),
      });
    }
  }

  // Build reverse mapping: sample name -> presets that use it (filter out empty slots)
  const sampleUsageMap = new Map<string, string[]>();
  for (const { preset, sampleNames } of presetsWithSamples) {
    for (const sampleName of sampleNames) {
      // Skip empty sample slots
      if (!sampleName || sampleName.trim() === '') {
        continue;
      }

      if (!sampleUsageMap.has(sampleName)) {
        sampleUsageMap.set(sampleName, []);
      }
      sampleUsageMap.get(sampleName)!.push(preset.name);
    }
  }

  // Get unique sample names from project folder
  const projectSampleNames = new Set(project.samples.map((s) => s.name));

  // Add samples referenced in presets but might be in WAVS/RECS
  for (const sampleName of sampleUsageMap.keys()) {
    projectSampleNames.add(sampleName);
  }

  // Debug logging
  console.log('Sample usage map:', Array.from(sampleUsageMap.entries()));
  console.log('Project sample names:', Array.from(projectSampleNames));

  // Read descriptions for all samples
  const samplesData = await Promise.all(
    Array.from(projectSampleNames).map(async (sampleName) => {
      const resolved = resolveSampleLocation(sampleName, project, structure);
      let description = '';

      if (resolved.sample) {
        try {
          const metadata = await parseFile(resolved.sample.path);
          const commentObj = metadata.common.comment?.[0];
          let commentText = '';
          if (typeof commentObj === 'string') {
            commentText = commentObj;
          } else if (commentObj && typeof commentObj === 'object' && 'text' in commentObj) {
            commentText = String((commentObj as { text?: string }).text || '');
          }
          const riffComment = metadata.native?.['RIFF']?.find((tag) => tag.id === 'ICMT')?.value;
          description = commentText || riffComment || '';
        } catch {
          // Ignore errors reading metadata
        }
      }

      const usedByPresets = sampleUsageMap.get(sampleName) || [];
      console.log(`Sample "${sampleName}" used by:`, usedByPresets);

      return {
        name: sampleName,
        description: description ? String(description) : undefined,
        usedByPresets,
      };
    })
  );

  // Sort samples: used samples first (by usage count), then alphabetically
  samplesData.sort((a, b) => {
    if (a.usedByPresets.length !== b.usedByPresets.length) {
      return b.usedByPresets.length - a.usedByPresets.length;
    }
    return a.name.localeCompare(b.name);
  });

  // Build preset data with resolved sample locations
  const presetsData = presetsWithSamples.map(({ preset, sampleNames }) => {
    const samples = sampleNames.map((sampleName, index) => {
      const resolved = resolveSampleLocation(sampleName, project, structure);
      return {
        slotNumber: index + 1,
        name: sampleName,
        location: resolved.location,
      };
    });

    return {
      name: preset.name,
      index: preset.index,
      isAutosave: preset.index === 0 && preset.name === 'Autosave',
      samples,
    };
  });

  return {
    project: {
      index: project.index,
      bankPosition,
      name: project.name,
      customName: project.customName,
    },
    samples: samplesData,
    presets: presetsData,
  };
}

/**
 * Resolve sample location with priority: PROJECT > WAVS > RECS
 * Matches logic from PresetViewer.tsx
 */
function resolveSampleLocation(
  sampleName: string,
  currentProject: Project,
  structure: MultigainStructure
): ResolvedSample {
  // 1. Check current project folder first
  const projectSample = currentProject.samples.find((s) => s.name === sampleName);
  if (projectSample) {
    return { name: sampleName, location: 'PROJECT', sample: projectSample };
  }

  // 2. Check global WAVS folder
  const wavsSample = structure.globalWavs.find((s) => s.name === sampleName);
  if (wavsSample) {
    return { name: sampleName, location: 'WAVS', sample: wavsSample };
  }

  // 3. Check RECS folder
  const recsSample = structure.recordings.find((s) => s.name === sampleName);
  if (recsSample) {
    return { name: sampleName, location: 'RECS', sample: recsSample };
  }

  // Not found in any location
  return { name: sampleName, location: 'NOT_FOUND' };
}
