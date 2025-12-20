import React from 'react';
import { useMultigrain } from './hooks/useMultigrain';
import { FileTree } from './components/FileTree';
import { WavFile } from '../shared/types';

const App: React.FC = () => {
  const { structure, isLoading, error, selectAndValidate } = useMultigrain();

  const handleSelectSample = (sample: WavFile) => {
    console.log('Selected sample:', sample);
    // TODO: Implement audio preview
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-grain-400">
          Multigrain Sample Manager
        </h1>
        <button
          onClick={selectAndValidate}
          disabled={isLoading}
          className="bg-grain-600 hover:bg-grain-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors text-sm"
        >
          {isLoading ? 'Loading...' : structure ? 'Change Location' : 'Select SD Card'}
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Tree */}
        <aside className="w-80 bg-gray-850 border-r border-gray-700 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-900 bg-opacity-30 border-b border-red-800 text-red-300 text-sm">
              {error}
            </div>
          )}

          {structure ? (
            <div className="p-2">
              <div className="text-xs text-gray-500 px-2 py-1 mb-2 truncate" title={structure.rootPath}>
                {structure.rootPath}
              </div>
              <FileTree structure={structure} onSelectSample={handleSelectSample} />
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-4">💾</div>
              <p className="mb-2">No SD card selected</p>
              <p className="text-xs">Click "Select SD Card" to browse your Multigrain samples</p>
            </div>
          )}
        </aside>

        {/* Main panel - Preview/Details */}
        <section className="flex-1 p-6 overflow-y-auto">
          {structure ? (
            <div className="max-w-2xl">
              <h2 className="text-lg font-medium mb-4">Overview</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-grain-400">
                    {structure.projects.length}
                  </div>
                  <div className="text-sm text-gray-400">Projects</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-grain-400">
                    {structure.globalWavs.length}
                  </div>
                  <div className="text-sm text-gray-400">Global Samples</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-grain-400">
                    {structure.recordings.length}
                  </div>
                  <div className="text-sm text-gray-400">Recordings</div>
                </div>
              </div>

              <h3 className="text-md font-medium mb-3">Projects Summary</h3>
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-750">
                    <tr className="border-b border-gray-700">
                      <th className="text-left px-4 py-2 text-gray-400">Project</th>
                      <th className="text-right px-4 py-2 text-gray-400">Samples</th>
                      <th className="text-right px-4 py-2 text-gray-400">Presets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structure.projects.map((project) => (
                      <tr key={project.path} className="border-b border-gray-700 last:border-0">
                        <td className="px-4 py-2">{project.name}</td>
                        <td className="text-right px-4 py-2 text-gray-400">
                          {project.samples.length}
                        </td>
                        <td className="text-right px-4 py-2 text-gray-400">
                          {project.presets.length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">🎛️</div>
                <h2 className="text-xl mb-2">Welcome to Multigrain Sample Manager</h2>
                <p className="text-sm">Select your SD card location to get started</p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Status bar */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-1 text-xs text-gray-500 flex justify-between">
        <span>
          {structure
            ? `${structure.projects.reduce((sum, p) => sum + p.samples.length, 0) + structure.globalWavs.length} total samples`
            : 'No card loaded'}
        </span>
        <span>
          {structure?.hasSettings ? '✓ Settings.mgs found' : ''}
        </span>
      </footer>
    </div>
  );
};

export default App;
