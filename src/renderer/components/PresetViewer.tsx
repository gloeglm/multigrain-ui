import React, { useEffect, useState } from 'react';
import { Preset, MultigainStructure, WavFile, Project } from '../../shared/types';
import { formatProjectDisplayName } from '../../shared/constants';

interface PresetViewerProps {
  preset: Preset;
  structure: MultigainStructure;
  onNavigateToSample?: (sample: WavFile) => void;
  selectedProject?: Project | null;
}

interface ResolvedSample {
  name: string;
  location: 'PROJECT' | 'WAVS' | 'RECS' | 'NOT_FOUND';
  sample?: WavFile;
}

export const PresetViewer: React.FC<PresetViewerProps> = ({ preset, structure, onNavigateToSample, selectedProject }) => {
  const [resolvedSamples, setResolvedSamples] = useState<ResolvedSample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Find which project this preset belongs to
  const currentProject = structure.projects.find(p => preset.path.startsWith(p.path));

  // Check if this is the Autosave preset
  const isAutosave = preset.index === 0 && preset.name === 'Autosave';

  // Resolve sample locations with priority: PROJECT > WAVS > RECS
  const resolveSampleLocation = (sampleName: string): ResolvedSample => {
    // 1. Check current project folder first
    if (currentProject) {
      const projectSample = currentProject.samples.find(s => s.name === sampleName);
      if (projectSample) {
        return { name: sampleName, location: 'PROJECT', sample: projectSample };
      }
    }

    // 2. Check global WAVS folder
    const wavsSample = structure.globalWavs.find(s => s.name === sampleName);
    if (wavsSample) {
      return { name: sampleName, location: 'WAVS', sample: wavsSample };
    }

    // 3. Check RECS folder
    const recsSample = structure.recordings.find(s => s.name === sampleName);
    if (recsSample) {
      return { name: sampleName, location: 'RECS', sample: recsSample };
    }

    // Not found in any location
    return { name: sampleName, location: 'NOT_FOUND' };
  };

  useEffect(() => {
    const loadSamples = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await window.electronAPI.readPresetSamples(preset.path);
        if (result.success && result.samples) {
          const resolved = result.samples.map(resolveSampleLocation);
          setResolvedSamples(resolved);
        } else {
          setError(result.error || 'Failed to load preset samples');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadSamples();
  }, [preset.path, structure]);

  return (
    <div className="space-y-4">
      {/* Preset Info */}
      <div className="bg-white rounded border-2 border-panel-dark p-4">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-lg font-medium text-label-black">{preset.name}</h3>
          {isAutosave && (
            <span className="px-2 py-1 text-xs font-medium bg-green-600 text-white rounded">
              Current State
            </span>
          )}
        </div>
        <div className="text-sm text-label-gray">
          {isAutosave ? (
            <>
              Autosave for{' '}
              <span className="font-medium text-label-black">
                {selectedProject
                  ? formatProjectDisplayName(
                      selectedProject.index,
                      selectedProject.name,
                      selectedProject.customName
                    )
                  : currentProject
                  ? formatProjectDisplayName(
                      currentProject.index,
                      currentProject.name,
                      currentProject.customName
                    )
                  : 'Unknown Project'}
              </span>
            </>
          ) : (
            <>
              <span className="font-medium">Preset {preset.index}</span> of 48
            </>
          )}
        </div>
        {isAutosave && (
          <div className="mt-2 text-xs text-label-gray italic">
            This preset is automatically loaded when you select this project on the Multigrain module
          </div>
        )}
      </div>

      {/* Samples List */}
      <div className="bg-white rounded border-2 border-panel-dark p-4">
        <h4 className="text-sm font-medium text-label-blue mb-3">
          Referenced Samples (8 Sounds)
        </h4>

        {isLoading && (
          <div className="text-center py-8 text-label-gray text-sm">
            Loading preset data...
          </div>
        )}

        {error && (
          <div className="text-center py-4 text-button-red text-sm">
            Error: {error}
          </div>
        )}

        {!isLoading && !error && resolvedSamples.length > 0 && (
          <div className="space-y-2">
            {resolvedSamples.map((resolved, index) => {
              const isClickable = resolved.location !== 'NOT_FOUND';
              const locationColors = {
                PROJECT: 'bg-label-blue text-white',
                WAVS: 'bg-green-600 text-white',
                RECS: 'bg-purple-600 text-white',
                NOT_FOUND: 'bg-button-red text-white',
              };
              const locationLabels = {
                PROJECT: currentProject ? currentProject.name : 'PROJECT',
                WAVS: 'WAVS',
                RECS: 'RECS',
                NOT_FOUND: 'NOT FOUND',
              };

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-2 rounded border border-panel-dark ${
                    isClickable
                      ? 'hover:bg-panel-light cursor-pointer hover:border-label-blue'
                      : 'bg-button-red bg-opacity-10'
                  }`}
                  onClick={() => {
                    if (isClickable && resolved.sample) {
                      onNavigateToSample?.(resolved.sample);
                    }
                  }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-label-blue text-white flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-label-black truncate font-mono">
                      {resolved.name}
                    </div>
                    <div className="text-xs text-label-gray">
                      Sound {index + 1}
                      {isClickable && ' • Click to navigate'}
                    </div>
                  </div>
                  <div
                    className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
                      locationColors[resolved.location]
                    }`}
                  >
                    {locationLabels[resolved.location]}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && !error && resolvedSamples.length === 0 && (
          <div className="text-center py-8 text-label-gray text-sm italic">
            No samples found in this preset
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-panel-light rounded border-2 border-panel-dark p-4">
        <div className="text-xs text-label-gray space-y-1">
          <p>
            <span className="font-medium text-label-black">Resolution Priority:</span> Samples are
            searched in order: PROJECT → WAVS → RECS
          </p>
          <p className="flex items-center gap-2 flex-wrap mt-2">
            <span className="px-2 py-0.5 rounded bg-label-blue text-white">PROJECT</span>
            <span className="px-2 py-0.5 rounded bg-green-600 text-white">WAVS</span>
            <span className="px-2 py-0.5 rounded bg-purple-600 text-white">RECS</span>
            <span className="px-2 py-0.5 rounded bg-button-red text-white">NOT FOUND</span>
          </p>
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-white rounded border-2 border-panel-dark p-4">
        <h4 className="text-sm font-medium text-label-blue mb-2">Technical Details</h4>
        <div className="space-y-1 text-xs">
          <div>
            <span className="text-label-gray">File:</span>
            <div className="font-mono text-label-black break-all mt-1">{preset.path}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
