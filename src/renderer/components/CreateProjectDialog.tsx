import React, { useState } from 'react';
import { Project } from '../../shared/types';
import { formatProjectDisplayName } from '../../shared/constants';

interface CreateProjectDialogProps {
  isOpen: boolean;
  existingProjects: Project[]; // Array of existing projects
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
  // Find first available slot
  const findFirstAvailableSlot = (): { bank: number; position: number } => {
    for (let bank = 1; bank <= 6; bank++) {
      for (let position = 1; position <= 8; position++) {
        const projNum = (bank - 1) * 8 + position;
        if (!existingProjects.find((p) => p.index === projNum)) {
          return { bank, position };
        }
      }
    }
    // Fallback to 1,1 if all slots are full
    return { bank: 1, position: 1 };
  };

  const firstAvailable = findFirstAvailableSlot();
  const [selectedBank, setSelectedBank] = useState(firstAvailable.bank);
  const [selectedPosition, setSelectedPosition] = useState(firstAvailable.position);
  const [customName, setCustomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Find first available position in a specific bank
  const findFirstAvailablePositionInBank = (bankNumber: number): number | null => {
    for (let pos = 1; pos <= 8; pos++) {
      const projNum = (bankNumber - 1) * 8 + pos;
      if (!existingProjects.find((p) => p.index === projNum)) {
        return pos;
      }
    }
    return null;
  };

  // When bank changes, ensure selected position is available
  React.useEffect(() => {
    const projNum = (selectedBank - 1) * 8 + selectedPosition;
    const isCurrentPositionOccupied = !!existingProjects.find((p) => p.index === projNum);

    if (isCurrentPositionOccupied) {
      const firstAvailablePos = findFirstAvailablePositionInBank(selectedBank);
      if (firstAvailablePos !== null) {
        setSelectedPosition(firstAvailablePos);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBank]);

  // Calculate project number from bank and position
  // Bank 1-6, Position 1-8
  // Project number = (Bank - 1) * 8 + Position
  const projectNumber = (selectedBank - 1) * 8 + selectedPosition;

  // Check if a bank has any available positions
  const isBankAvailable = (bankNumber: number) => {
    for (let pos = 1; pos <= 8; pos++) {
      const projNum = (bankNumber - 1) * 8 + pos;
      if (!existingProjects.find((p) => p.index === projNum)) {
        return true;
      }
    }
    return false;
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await onCreateProject(projectNumber, customName || undefined);
      onClose();
      // Reset form to first available slot
      const newFirstAvailable = findFirstAvailableSlot();
      setSelectedBank(newFirstAvailable.bank);
      setSelectedPosition(newFirstAvailable.position);
      setCustomName('');
    } catch (error) {
      console.error('Failed to create project:', error);
      alert(
        `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
            <label className="block text-sm font-medium text-label-black mb-2">Bank</label>
            <div className="grid grid-cols-6 gap-2">
              {BANK_NAMES.map((bankName, index) => {
                const bankNumber = index + 1;
                const isAvailable = isBankAvailable(bankNumber);
                return (
                  <button
                    key={bankNumber}
                    onClick={() => setSelectedBank(bankNumber)}
                    disabled={!isAvailable}
                    className={`py-2 rounded font-medium transition-colors ${
                      selectedBank === bankNumber
                        ? 'bg-label-blue text-white'
                        : isAvailable
                          ? 'bg-panel-dark text-label-black hover:bg-button-gray'
                          : 'bg-button-gray text-label-gray cursor-not-allowed opacity-50'
                    }`}
                    title={!isAvailable ? 'Bank full' : ''}
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
                const existingProj = existingProjects.find((p) => p.index === projNum);
                const exists = !!existingProj;
                const tooltipText =
                  exists && existingProj
                    ? formatProjectDisplayName(
                        existingProj.index,
                        existingProj.name,
                        existingProj.customName
                      )
                    : '';
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
                    title={exists ? `${tooltipText} already exists` : ''}
                  >
                    {position}
                  </button>
                );
              })}
            </div>
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
            disabled={isCreating}
            className="px-4 py-2 bg-label-blue hover:bg-knob-ring disabled:bg-button-gray disabled:cursor-not-allowed text-white rounded"
          >
            {isCreating ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
