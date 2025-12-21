import React, { useState } from 'react';
import { useMultigrain } from './hooks/useMultigrain';
import { FileTree } from './components/FileTree';
import { SampleView } from './components/SampleView';
import { PresetViewer } from './components/PresetViewer';
import { ConfirmDialog } from './components/ConfirmDialog';
import { TreeSelection } from '../shared/types';
import { FACTORY_PROJECT_NAMES, formatProjectDisplayName } from '../shared/constants';

const App: React.FC = () => {
  const { structure, isLoading, error, selectAndValidate, reloadStructure } = useMultigrain();
  const [selection, setSelection] = useState<TreeSelection>({ type: 'overview' });
  const [showFactoryNamesConfirm, setShowFactoryNamesConfirm] = useState(false);
  const [autoPlay, setAutoPlay] = useState<boolean>(() => {
    // Load auto-play preference from localStorage, default to true
    const saved = localStorage.getItem('multigrain-autoplay');
    return saved ? JSON.parse(saved) : true;
  });

  // Helper function to find sample by path in current structure
  const findSampleByPath = (path: string) => {
    if (!structure) return null;
    // Check in all projects
    for (const project of structure.projects) {
      const sample = project.samples.find((s) => s.path === path);
      if (sample) return sample;
    }
    // Check in global wavs
    const globalSample = structure.globalWavs.find((s) => s.path === path);
    if (globalSample) return globalSample;
    // Check in recordings
    const recording = structure.recordings.find((s) => s.path === path);
    if (recording) return recording;
    return null;
  };

  // Helper function to find preset by path
  const findPresetByPath = (path: string) => {
    if (!structure) return null;
    for (const project of structure.projects) {
      const preset = project.presets.find((p) => p.path === path);
      if (preset) return preset;
      if (project.autosave?.path === path) return project.autosave;
    }
    return null;
  };

  // Helper function to find project by path
  const findProjectByPath = (path: string) => {
    if (!structure) return null;
    return structure.projects.find((p) => p.path === path) || null;
  };

  // Save auto-play preference when it changes
  React.useEffect(() => {
    localStorage.setItem('multigrain-autoplay', JSON.stringify(autoPlay));
  }, [autoPlay]);

  const handleLoadFactoryNamesClick = () => {
    setShowFactoryNamesConfirm(true);
  };

  const handleLoadFactoryNamesConfirm = async () => {
    setShowFactoryNamesConfirm(false);

    if (!structure) return;

    const updates = structure.projects
      .filter((project) => FACTORY_PROJECT_NAMES[project.index])
      .map((project) => ({
        projectPath: project.path,
        customName: FACTORY_PROJECT_NAMES[project.index],
      }));

    if (updates.length === 0) {
      alert('No factory projects found on this SD card.');
      return;
    }

    try {
      const result = await window.electronAPI.batchWriteProjectMetadata(updates);
      if (result.success) {
        alert(`Successfully loaded ${result.count} factory project names.`);
        reloadStructure();
      } else {
        alert(`Failed to load factory names: ${result.error}`);
      }
    } catch (error) {
      console.error('Error loading factory names:', error);
      alert('Failed to load factory names');
    }
  };

  return (
    <div className="h-screen bg-white text-label-black flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-panel-light border-b-2 border-panel-dark px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-label-black">Multigrain Sample Manager</h1>
        <div className="flex items-center gap-4">
          {/* Auto-play toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoPlay}
              onChange={(e) => setAutoPlay(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all ${
                autoPlay
                  ? 'bg-label-blue text-white shadow-sm'
                  : 'bg-white border-2 border-panel-dark text-label-gray hover:bg-panel-light'
              }`}
              title={
                autoPlay
                  ? 'Auto-play enabled - Click to disable'
                  : 'Auto-play disabled - Click to enable'
              }
            >
              <span className="text-base">{autoPlay ? '▶' : '⏸'}</span>
              <span>Auto-play</span>
            </div>
          </label>

          {structure && (
            <button
              onClick={handleLoadFactoryNamesClick}
              className="bg-label-blue hover:bg-button-dark text-white px-4 py-2 rounded transition-colors text-sm font-medium"
              title="Load factory project names from Intellijel"
            >
              Load Factory Names
            </button>
          )}

          <button
            onClick={selectAndValidate}
            disabled={isLoading}
            className="bg-button-dark hover:bg-knob-ring disabled:bg-button-gray disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors text-sm font-medium"
          >
            {isLoading ? 'Loading...' : structure ? 'Change Location' : 'Select SD Card'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Tree */}
        <aside className="w-[480px] bg-panel-light border-r-2 border-panel-dark flex flex-col">
          {error && (
            <div className="p-4 bg-button-red bg-opacity-20 border-b border-button-red text-button-red text-sm flex-shrink-0">
              {error}
            </div>
          )}

          {structure ? (
            <>
              {/* Fixed path display */}
              <div
                className="flex-shrink-0 text-xs text-label-gray px-4 py-2 border-b border-panel-dark truncate"
                title={structure.rootPath}
              >
                {structure.rootPath}
              </div>
              {/* Scrollable tree */}
              <div className="flex-1 overflow-y-auto p-2">
                <FileTree
                  structure={structure}
                  selection={selection}
                  onSelectionChange={setSelection}
                  onProjectNameChange={reloadStructure}
                  onImportComplete={reloadStructure}
                  onSampleRenamed={(newPath) => {
                    setSelection({ type: 'sample', samplePath: newPath });
                    reloadStructure();
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-label-gray">
              <div>
                <div className="text-4xl mb-4">💾</div>
                <p className="mb-2 text-label-black">No SD card selected</p>
                <p className="text-xs">
                  Click &quot;Select SD Card&quot; to browse your Multigrain samples
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* Main panel - Preview/Details */}
        <section className="flex-1 p-6 overflow-y-auto bg-white">
          {selection.type === 'sample' ? (
            (() => {
              const sample = findSampleByPath(selection.samplePath);
              if (!sample) {
                return (
                  <div className="flex items-center justify-center h-full text-label-gray">
                    <p>Sample not found</p>
                  </div>
                );
              }
              return (
                <div className="max-w-3xl mx-auto">
                  <SampleView
                    key={selection.samplePath}
                    sample={sample}
                    autoPlay={autoPlay}
                    onRenameComplete={(newPath) => {
                      setSelection({ type: 'sample', samplePath: newPath });
                      reloadStructure();
                    }}
                  />
                </div>
              );
            })()
          ) : selection.type === 'preset' && structure ? (
            (() => {
              const preset = findPresetByPath(selection.presetPath);
              const project = selection.projectPath
                ? findProjectByPath(selection.projectPath)
                : undefined;
              if (!preset) {
                return (
                  <div className="flex items-center justify-center h-full text-label-gray">
                    <p>Preset not found</p>
                  </div>
                );
              }
              return (
                <div className="max-w-3xl mx-auto">
                  <PresetViewer
                    key={selection.presetPath}
                    preset={preset}
                    structure={structure}
                    onNavigateToSample={(sample) =>
                      setSelection({ type: 'sample', samplePath: sample.path })
                    }
                    selectedProject={project}
                  />
                </div>
              );
            })()
          ) : structure ? (
            <div className="max-w-2xl">
              <h2 className="text-lg font-medium mb-4 text-label-blue">Overview</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded p-4 border-2 border-panel-dark">
                  <div className="text-2xl font-bold text-label-blue">
                    {structure.projects.length}
                  </div>
                  <div className="text-sm text-label-gray">Projects</div>
                </div>
                <div className="bg-white rounded p-4 border-2 border-panel-dark">
                  <div className="text-2xl font-bold text-label-blue">
                    {structure.globalWavs.length}
                  </div>
                  <div className="text-sm text-label-gray">Global Samples</div>
                </div>
                <div className="bg-white rounded p-4 border-2 border-panel-dark">
                  <div className="text-2xl font-bold text-label-blue">
                    {structure.recordings.length}
                  </div>
                  <div className="text-sm text-label-gray">Recordings</div>
                </div>
              </div>

              <h3 className="text-md font-medium mb-3 text-label-blue">Projects Summary</h3>
              <div className="bg-white rounded border-2 border-panel-dark overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-panel">
                    <tr className="border-b-2 border-panel-dark">
                      <th className="text-left px-4 py-3 text-label-black font-medium">Project</th>
                      <th className="text-right px-4 py-3 text-label-black font-medium">Samples</th>
                      <th className="text-right px-4 py-3 text-label-black font-medium">Presets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structure.projects.map((project) => (
                      <tr
                        key={project.path}
                        className="border-b border-panel-dark last:border-0 hover:bg-panel-light"
                      >
                        <td className="px-4 py-2 text-label-black">
                          {formatProjectDisplayName(
                            project.index,
                            project.name,
                            project.customName
                          )}
                        </td>
                        <td className="text-right px-4 py-2 text-label-gray">
                          {project.samples.length}
                        </td>
                        <td className="text-right px-4 py-2 text-label-gray">
                          {project.presets.length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-label-gray">
              <div className="text-center">
                <div className="text-6xl mb-4">🎛️</div>
                <h2 className="text-xl mb-2 text-label-black">
                  Welcome to Multigrain Sample Manager
                </h2>
                <p className="text-sm">Select your SD card location to get started</p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Status bar */}
      <footer className="flex-shrink-0 bg-panel border-t-2 border-panel-dark px-4 py-2 text-xs text-label-gray flex justify-between">
        <span>
          {structure
            ? `${structure.projects.reduce((sum, p) => sum + p.samples.length, 0) + structure.globalWavs.length} total samples`
            : 'No card loaded'}
        </span>
        <span className="text-label-blue">
          {structure?.hasSettings ? '✓ Settings.mgs found' : ''}
        </span>
      </footer>

      {/* Factory Names Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showFactoryNamesConfirm}
        title="Load Factory Project Names"
        message={`This feature is intended for SD cards with the original factory project structure. It will overwrite any custom names you have set.\n\nNote: This may not work correctly if you have already modified the project structure (deleted, moved, or renumbered projects).\n\nDo you want to continue?`}
        confirmLabel="Load Factory Names"
        cancelLabel="Cancel"
        onConfirm={handleLoadFactoryNamesConfirm}
        onCancel={() => setShowFactoryNamesConfirm(false)}
      />
    </div>
  );
};

export default App;
