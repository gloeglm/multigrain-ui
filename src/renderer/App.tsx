import React, { useState } from 'react';
import { useMultigrain } from './hooks/useMultigrain';
import { FileTree } from './components/FileTree';
import { AudioPlayer } from './components/AudioPlayer';
import { PresetViewer } from './components/PresetViewer';
import { WavFile, Preset, Project } from '../shared/types';
import { FACTORY_PROJECT_NAMES } from '../shared/constants';

const App: React.FC = () => {
  const { structure, isLoading, error, selectAndValidate, reloadStructure } = useMultigrain();
  const [selectedSample, setSelectedSample] = useState<WavFile | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [autoPlay, setAutoPlay] = useState<boolean>(() => {
    // Load auto-play preference from localStorage, default to true
    const saved = localStorage.getItem('multigrain-autoplay');
    return saved ? JSON.parse(saved) : true;
  });

  // Save auto-play preference when it changes
  React.useEffect(() => {
    localStorage.setItem('multigrain-autoplay', JSON.stringify(autoPlay));
  }, [autoPlay]);

  const handleSelectSample = (sample: WavFile) => {
    setSelectedSample(sample);
    setSelectedPreset(null); // Clear preset selection
    setSelectedProject(null); // Clear project selection
  };

  const handleSelectPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    setSelectedSample(null); // Clear sample selection
    setSelectedProject(null); // Clear project selection
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setSelectedSample(null); // Clear sample selection
    // Show the autosave preset if available, otherwise clear preset selection
    if (project.autosave) {
      setSelectedPreset(project.autosave);
    } else {
      setSelectedPreset(null);
    }
  };

  const handleLoadFactoryNames = async () => {
    if (!structure) return;

    if (!confirm('Load factory project names? This will overwrite any custom names you have set.')) {
      return;
    }

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
        <h1 className="text-xl font-semibold text-label-black">
          Multigrain Sample Manager
        </h1>
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
              title={autoPlay ? 'Auto-play enabled - Click to disable' : 'Auto-play disabled - Click to enable'}
            >
              <span className="text-base">{autoPlay ? '▶' : '⏸'}</span>
              <span>Auto-play</span>
            </div>
          </label>

          {structure && (
            <button
              onClick={handleLoadFactoryNames}
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
              <div className="flex-shrink-0 text-xs text-label-gray px-4 py-2 border-b border-panel-dark truncate" title={structure.rootPath}>
                {structure.rootPath}
              </div>
              {/* Scrollable tree */}
              <div className="flex-1 overflow-y-auto p-2">
                <FileTree
                  structure={structure}
                  onSelectSample={handleSelectSample}
                  onSelectPreset={handleSelectPreset}
                  onSelectProject={handleSelectProject}
                  onProjectNameChange={reloadStructure}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-label-gray">
              <div>
                <div className="text-4xl mb-4">💾</div>
                <p className="mb-2 text-label-black">No SD card selected</p>
                <p className="text-xs">Click "Select SD Card" to browse your Multigrain samples</p>
              </div>
            </div>
          )}
        </aside>

        {/* Main panel - Preview/Details */}
        <section className="flex-1 p-6 overflow-y-auto bg-white">
          {selectedSample ? (
            <div className="max-w-3xl mx-auto">
              <AudioPlayer key={selectedSample.path} sample={selectedSample} autoPlay={autoPlay} />
            </div>
          ) : selectedPreset && structure ? (
            <div className="max-w-3xl mx-auto">
              <PresetViewer
                key={selectedPreset.path}
                preset={selectedPreset}
                structure={structure}
                onNavigateToSample={handleSelectSample}
                selectedProject={selectedProject}
              />
            </div>
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
                      <tr key={project.path} className="border-b border-panel-dark last:border-0 hover:bg-panel-light">
                        <td className="px-4 py-2 text-label-black">
                          {project.customName || project.name}
                          {project.customName && (
                            <span className="text-xs text-label-gray ml-1">({project.name})</span>
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
                <h2 className="text-xl mb-2 text-label-black">Welcome to Multigrain Sample Manager</h2>
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
    </div>
  );
};

export default App;
