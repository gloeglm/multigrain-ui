import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <h1 className="text-xl font-semibold text-grain-400">
          Multigrain Sample Manager
        </h1>
      </header>
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-medium mb-4">Welcome</h2>
            <p className="text-gray-400 mb-4">
              Connect your SD card to manage samples for your Multigrain Eurorack module.
            </p>
            <button className="bg-grain-600 hover:bg-grain-500 text-white px-4 py-2 rounded-md transition-colors">
              Select SD Card Location
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
