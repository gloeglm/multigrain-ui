import React, { useEffect, useState } from 'react';
import { WavFile } from '../../shared/types';

interface SampleInfoProps {
  sample: WavFile;
  onRenameComplete?: (newPath: string) => void;
}

export const SampleInfo: React.FC<SampleInfoProps> = ({ sample, onRenameComplete }) => {
  const [description, setDescription] = useState<string>('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [newName, setNewName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  // Reset editing state when sample changes
  useEffect(() => {
    setIsEditingName(false);
    setNewName('');
    setIsEditingDescription(false);
  }, [sample.path]);

  // Load description when sample changes
  useEffect(() => {
    const loadDescription = async () => {
      try {
        const meta = await window.electronAPI.readAudioMetadata(sample.path);
        setDescription(meta.description || '');
      } catch (error) {
        console.error('Error loading description:', error);
      }
    };

    loadDescription();
  }, [sample.path]);

  const handleSaveDescription = async () => {
    setIsSavingDescription(true);
    try {
      const result = await window.electronAPI.writeAudioMetadata(sample.path, description);
      if (!result.success) {
        console.error('Failed to save description:', result.error);
        alert(`Failed to save description: ${result.error}`);
      }
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Error saving description:', error);
      alert('Failed to save description');
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleStartRename = () => {
    // Strip .wav extension for editing
    const nameWithoutExt = sample.name.replace(/\.wav$/i, '');
    setNewName(nameWithoutExt);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return; // Prevent empty names

    setIsSavingName(true);
    try {
      const result = await window.electronAPI.renameSample(sample.path, newName);
      if (result.success && result.newPath) {
        setIsEditingName(false);
        setIsSavingName(false);
        onRenameComplete?.(result.newPath);
      } else {
        alert(`Failed to rename sample: ${result.error}`);
        setIsSavingName(false);
      }
    } catch (error) {
      console.error('Error renaming sample:', error);
      alert('Failed to rename sample');
      setIsSavingName(false);
    }
  };

  const handleCancelRename = () => {
    setNewName('');
    setIsEditingName(false);
  };

  return (
    <div className="space-y-4">
      {/* Sample Info */}
      <div className="bg-white rounded border-2 border-panel-dark p-4">
        <div className="mb-3">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Sample name"
                className="flex-1 px-3 py-1.5 text-lg font-medium border-2 border-panel-dark rounded focus:border-label-blue focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelRename();
                }}
              />
              <button
                onClick={handleSaveName}
                disabled={isSavingName}
                className="px-3 py-1.5 bg-label-blue hover:bg-button-dark disabled:bg-button-gray text-white rounded transition-colors"
              >
                {isSavingName ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelRename}
                disabled={isSavingName}
                className="px-3 py-1.5 bg-button-gray hover:bg-button-dark disabled:bg-panel text-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-label-black" data-testid="sample-name">{sample.name}</h3>
              <button
                onClick={handleStartRename}
                data-testid="rename-sample-button"
                className="text-xs px-3 py-1 bg-button-dark hover:bg-knob-ring text-white rounded transition-colors"
              >
                ✎
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded border-2 border-panel-dark p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-label-blue">Description</h4>
          {!isEditingDescription ? (
            <button
              onClick={() => setIsEditingDescription(true)}
              data-testid="edit-description-button"
              className="text-xs px-3 py-1 bg-button-dark hover:bg-knob-ring text-white rounded transition-colors"
            >
              ✎
            </button>
          ) : (
            <button
              onClick={handleSaveDescription}
              disabled={isSavingDescription}
              data-testid="save-description-button"
              className="text-xs px-3 py-1 bg-label-blue hover:bg-button-dark disabled:bg-button-gray text-white rounded transition-colors"
            >
              {isSavingDescription ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
        {isEditingDescription ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            data-testid="description-textarea"
            className="w-full h-24 px-3 py-2 border-2 border-panel-dark rounded resize-none focus:border-label-blue focus:outline-none text-sm"
          />
        ) : (
          <p className="text-sm text-label-black whitespace-pre-wrap" data-testid="description-text">
            {description || <span className="text-label-gray italic">No description</span>}
          </p>
        )}
      </div>
    </div>
  );
};
