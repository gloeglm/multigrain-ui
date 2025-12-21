import React, { useState } from 'react';

interface CreateProjectDialogProps {
  isOpen: boolean;
  existingProjects: number[]; // Array of existing project numbers (1-48)
  onClose: () => void;
  onCreateProject: (projectNumber: number, customName?: string) => Promise<void>;
}

const BANK_NAMES = ['X', 'Y', 'Z', 'XX', 'YY', 'ZZ'];

export function CreateProjectDialog({
  isOpen,
  existingProjects,
  onClose,
  onCreateProject,
}: CreateProjectDialogProps) {
  const [selectedBank, setSelectedBank] = useState(1);
  const [selectedPosition, setSelectedPosition] = useState(1);
  const [customName, setCustomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Calculate project number from bank and position
  // Bank 1-6, Position 1-8
  // Project number = (Bank - 1) * 8 + Position
  const projectNumber = (selectedBank - 1) * 8 + selectedPosition;

  const projectExists = existingProjects.includes(projectNumber);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await onCreateProject(projectNumber, customName || undefined);
      onClose();
      // Reset form
      setSelectedBank(1);
      setSelectedPosition(1);
      setCustomName('');
    } catch (error) {
      console.error('Failed to create project:', error);
      alert(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-panel-light rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-panel-dark flex items-center justify-between">
          <h2 className="text-xl font-semibold text-label-black">Create New Project</h2>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="text-label-gray hover:text-label-black disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Bank Selection */}
          <div>
            <label className="block text-sm font-medium text-label-black mb-2">
              Bank
            </label>
            <div className="grid grid-cols-6 gap-2">
              {BANK_NAMES.map((bankName, index) => {
                const bankNumber = index + 1;
                return (
                  <button
                    key={bankNumber}
                    onClick={() => setSelectedBank(bankNumber)}
                    className={`py-2 rounded font-medium transition-colors ${
                      selectedBank === bankNumber
                        ? 'bg-label-blue text-white'
                        : 'bg-panel-dark text-label-black hover:bg-button-gray'
                    }`}
                  >
                    {bankName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Position Selection */}
          <div>
            <label className="block text-sm font-medium text-label-black mb-2">
              Position in Bank (1-8)
            </label>
            <div className="grid grid-cols-8 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((position) => {
                const projNum = (selectedBank - 1) * 8 + position;
                const exists = existingProjects.includes(projNum);
                return (
                  <button
                    key={position}
                    onClick={() => setSelectedPosition(position)}
                    disabled={exists}
                    className={`py-2 rounded font-medium transition-colors ${
                      selectedPosition === position && selectedBank === selectedBank
                        ? 'bg-label-blue text-white'
                        : exists
                        ? 'bg-button-gray text-label-gray cursor-not-allowed opacity-50'
                        : 'bg-panel-dark text-label-black hover:bg-button-gray'
                    }`}
                    title={exists ? `Project${String(projNum).padStart(2, '0')} already exists` : ''}
                  >
                    {position}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project Number Display */}
          <div
            className={`p-3 rounded ${
              projectExists
                ? 'bg-button-red bg-opacity-20 border border-button-red'
                : 'bg-label-blue bg-opacity-10 border border-label-blue'
            }`}
          >
            <p className="text-sm font-medium">
              {projectExists ? '⚠ Project Already Exists' : '✓ Available'}
            </p>
            <p className="text-lg font-bold mt-1">
              Project{String(projectNumber).padStart(2, '0')}
            </p>
            <p className="text-xs text-label-gray mt-1">
              Bank {BANK_NAMES[selectedBank - 1]}, Position {selectedPosition}
            </p>
          </div>

          {/* Custom Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-label-black mb-2">
              Custom Name (Optional)
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g., Drum Samples"
              className="w-full px-3 py-2 border border-panel-dark rounded focus:border-label-blue focus:outline-none"
              disabled={isCreating}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-panel-dark flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-4 py-2 bg-button-gray hover:bg-panel-dark text-label-black rounded disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || projectExists}
            className="px-4 py-2 bg-label-blue hover:bg-knob-ring disabled:bg-button-gray disabled:cursor-not-allowed text-white rounded"
          >
            {isCreating ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
