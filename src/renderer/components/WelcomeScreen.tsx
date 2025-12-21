import React from 'react';

interface WelcomeScreenProps {
  onSelectCard: () => void;
  error?: string;
  previousPath?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectCard,
  error,
  previousPath,
}) => {
  return (
    <div className="h-full w-full bg-white flex items-center justify-center px-12 py-8">
      <div className="max-w-5xl w-full">
        {/* Error message if location not accessible */}
        {error && (
          <div className="mb-6 p-3 bg-button-red bg-opacity-10 border border-button-red rounded text-center">
            <p className="text-xs text-button-red mb-1">
              <strong>⚠️ Previous location not accessible:</strong>{' '}
              {previousPath && <span className="font-mono">{previousPath}</span>}
            </p>
            <p className="text-xs text-label-gray">Please select your SD card location below</p>
          </div>
        )}

        {/* Hero section */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎛️</div>
          <h1 className="text-2xl font-bold text-label-black mb-2">
            Welcome to Multigrain Sample Manager
          </h1>
          <p className="text-sm text-label-gray mb-4">
            Manage and organize your Intellijel Multigrain sample library with ease
          </p>
          <button
            onClick={onSelectCard}
            className="bg-label-blue hover:bg-button-dark text-white px-6 py-2 rounded-lg transition-colors text-sm font-medium shadow-md"
          >
            Select Your SD Card
          </button>
        </div>

        {/* Features and Getting Started in two columns */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left column - Features */}
          <div>
            <h2 className="text-base font-semibold text-label-blue mb-3">Features</h2>
            <div className="space-y-3">
              <div className="bg-panel-light rounded-lg p-4 border-2 border-panel-dark">
                <div className="flex items-start gap-3">
                  <div className="text-xl">🎵</div>
                  <div>
                    <h3 className="text-sm font-semibold text-label-black mb-1">
                      Browse & Preview
                    </h3>
                    <p className="text-xs text-label-gray">
                      Navigate projects, view waveforms, and play samples
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-panel-light rounded-lg p-4 border-2 border-panel-dark">
                <div className="flex items-start gap-3">
                  <div className="text-xl">📁</div>
                  <div>
                    <h3 className="text-sm font-semibold text-label-black mb-1">
                      Import & Convert
                    </h3>
                    <p className="text-xs text-label-gray">
                      Auto-convert files to 48kHz, 16-bit, stereo format
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-panel-light rounded-lg p-4 border-2 border-panel-dark">
                <div className="flex items-start gap-3">
                  <div className="text-xl">✏️</div>
                  <div>
                    <h3 className="text-sm font-semibold text-label-black mb-1">
                      Organize Projects
                    </h3>
                    <p className="text-xs text-label-gray">
                      Rename samples, add descriptions, customize names
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-panel-light rounded-lg p-4 border-2 border-panel-dark">
                <div className="flex items-start gap-3">
                  <div className="text-xl">🎚️</div>
                  <div>
                    <h3 className="text-sm font-semibold text-label-black mb-1">View Presets</h3>
                    <p className="text-xs text-label-gray">
                      Inspect presets and jump to referenced samples
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Getting Started */}
          <div>
            <h2 className="text-base font-semibold text-label-blue mb-3 flex items-center gap-2">
              <span>🚀</span>
              <span>Getting Started</span>
            </h2>
            <div className="bg-white border-2 border-label-blue rounded-lg p-4 mb-4">
              <ol className="space-y-2.5 text-xs text-label-gray">
                <li className="flex gap-2">
                  <span className="font-bold text-label-blue">1.</span>
                  <span>
                    Click <strong>&quot;Select Your SD Card&quot;</strong> and navigate to your
                    Multigrain folder
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-label-blue">2.</span>
                  <span>Browse projects in the tree - click samples to preview them</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-label-blue">3.</span>
                  <span>Right-click projects or Wavs folder to import, rename, or delete</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-label-blue">4.</span>
                  <span>
                    Use <strong>Load Factory Names</strong> to populate project names with factory
                    labels
                  </span>
                </li>
              </ol>
            </div>

            {/* Auto-conversion info */}
            <div className="p-3 bg-panel-light rounded border border-panel-dark">
              <p className="text-xs text-label-gray">
                <strong>💡 Tip:</strong> When you import samples, they&apos;ll be automatically
                converted to the correct format for Multigrain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
