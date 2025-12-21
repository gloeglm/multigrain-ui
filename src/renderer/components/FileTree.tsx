import React, { useState } from 'react';
import { MultigainStructure, Project, WavFile, Preset } from '../../shared/types';
import { ImportDialog } from './ImportDialog';

interface FileTreeProps {
  structure: MultigainStructure;
  onSelectSample?: (sample: WavFile) => void;
  onSelectPreset?: (preset: Preset) => void;
  onSelectProject?: (project: Project) => void;
  onProjectNameChange?: () => void;
  onImportComplete?: () => void;
}

interface TreeNodeProps {
  label: string;
  icon: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
  onClick?: () => void;
  isSelected?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  label,
  icon,
  children,
  defaultOpen = false,
  count,
  onClick,
  isSelected,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-panel-dark ${
          isSelected ? 'bg-panel-dark' : ''
        }`}
        onClick={() => {
          if (hasChildren) setIsOpen(!isOpen);
          onClick?.();
        }}
      >
        {hasChildren ? (
          <span className="text-label-gray w-4 text-center">
            {isOpen ? '▼' : '▶'}
          </span>
        ) : (
          <span className="w-4" />
        )}
        <span>{icon}</span>
        <span className="flex-1 truncate text-label-black">{label}</span>
        {count !== undefined && (
          <span className="text-xs text-label-gray bg-panel-dark px-1.5 py-0.5 rounded">
            {count}
          </span>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="ml-4 border-l border-panel-dark pl-2">{children}</div>
      )}
    </div>
  );
};

interface SampleNodeProps {
  sample: WavFile;
  onSelect?: (sample: WavFile) => void;
  isSelected?: boolean;
}

const SampleNode: React.FC<SampleNodeProps> = ({ sample, onSelect, isSelected }) => {
  const sizeKB = Math.round(sample.size / 1024);

  return (
    <div
      className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-panel-dark ml-6 ${
        isSelected ? 'bg-button-red bg-opacity-20 border-l-2 border-button-red' : ''
      }`}
      onClick={() => onSelect?.(sample)}
    >
      <span className="text-label-blue">♪</span>
      <span className="flex-1 truncate text-sm text-label-black">{sample.name}</span>
      <span className="text-xs text-label-gray">{sizeKB} KB</span>
    </div>
  );
};

interface PresetNodeProps {
  preset: Preset;
  onSelect?: (preset: Preset) => void;
  isSelected?: boolean;
}

const PresetNode: React.FC<PresetNodeProps> = ({ preset, onSelect, isSelected }) => {
  return (
    <div
      className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-panel-dark ml-6 ${
        isSelected ? 'bg-label-blue bg-opacity-20 border-l-2 border-label-blue' : ''
      }`}
      onClick={() => onSelect?.(preset)}
    >
      <span className="text-label-blue">📄</span>
      <span className="flex-1 truncate text-sm text-label-black">{preset.name}</span>
    </div>
  );
};

const ProjectNode: React.FC<{
  project: Project;
  onSelectSample?: (sample: WavFile) => void;
  onSelectPreset?: (preset: Preset) => void;
  onSelectProject?: (project: Project) => void;
  selectedSample?: WavFile | null;
  selectedPreset?: Preset | null;
  selectedProject?: Project | null;
  onProjectNameChange?: () => void;
  onImportClick?: (targetPath: string) => void;
}> = ({ project, onSelectSample, onSelectPreset, onSelectProject, selectedSample, selectedPreset, selectedProject, onProjectNameChange, onImportClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customName, setCustomName] = useState(project.customName || '');
  const [isSaving, setIsSaving] = useState(false);

  const displayName = project.customName || project.name;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await window.electronAPI.writeProjectMetadata(project.path, customName);
      if (result.success) {
        setIsEditing(false);
        onProjectNameChange?.();
      } else {
        alert(`Failed to save project name: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving project name:', error);
      alert('Failed to save project name');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCustomName(project.customName || '');
    setIsEditing(false);
  };

  const isSelected = selectedProject?.path === project.path;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-panel-dark group cursor-pointer ${
          isSelected ? 'bg-label-blue bg-opacity-10 border-l-2 border-label-blue' : ''
        }`}
        onClick={() => {
          if (!isEditing) {
            setIsOpen(!isOpen);
            // Select project to show autosave
            onSelectProject?.(project);
          }
        }}
      >
        <span className="text-label-gray w-4 text-center">
          {isOpen ? '▼' : '▶'}
        </span>
        <span>📁</span>
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={project.name}
              className="flex-1 px-2 py-0.5 text-sm border border-panel-dark rounded focus:border-label-blue focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs px-2 py-0.5 bg-label-blue hover:bg-button-dark disabled:bg-button-gray text-white rounded"
              title="Save"
            >
              ✓
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="text-xs px-2 py-0.5 bg-button-gray hover:bg-button-dark disabled:bg-panel text-white rounded"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 truncate text-label-black">
              {displayName}
              {project.customName && (
                <span className="text-xs text-label-gray ml-1">({project.name})</span>
              )}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onImportClick?.(project.path);
              }}
              className="opacity-0 group-hover:opacity-100 text-xs px-2 py-0.5 bg-label-blue hover:bg-knob-ring text-white rounded transition-opacity flex-shrink-0"
              title="Import samples"
            >
              +
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="opacity-0 group-hover:opacity-100 text-xs px-2 py-0.5 bg-button-dark hover:bg-knob-ring text-white rounded transition-opacity flex-shrink-0"
              title="Edit project name"
            >
              ✎
            </button>
            <span className="text-xs text-label-gray bg-panel-dark px-1.5 py-0.5 rounded flex-shrink-0">
              {project.samples.length}
            </span>
          </>
        )}
      </div>
      {isOpen && (
        <div className="ml-4 border-l border-panel-dark pl-2">
          {project.presets.length > 0 && (
            <TreeNode label="Presets" icon="📋" count={project.presets.length}>
              {project.presets.map((preset) => (
                <PresetNode
                  key={preset.path}
                  preset={preset}
                  onSelect={onSelectPreset}
                  isSelected={selectedPreset?.path === preset.path}
                />
              ))}
            </TreeNode>
          )}
          {project.samples.length > 0 && (
            <TreeNode label="Samples" icon="🎵" count={project.samples.length} defaultOpen>
              {project.samples.map((sample) => (
                <SampleNode
                  key={sample.path}
                  sample={sample}
                  onSelect={onSelectSample}
                  isSelected={selectedSample?.path === sample.path}
                />
              ))}
            </TreeNode>
          )}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ structure, onSelectSample, onSelectPreset, onSelectProject, onProjectNameChange, onImportComplete }) => {
  const [selectedSample, setSelectedSample] = useState<WavFile | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importTarget, setImportTarget] = useState<string>('');

  const handleSelectSample = (sample: WavFile) => {
    setSelectedSample(sample);
    setSelectedPreset(null); // Clear preset selection
    setSelectedProject(null); // Clear project selection
    onSelectSample?.(sample);
  };

  const handleSelectPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    setSelectedSample(null); // Clear sample selection
    setSelectedProject(null); // Clear project selection
    onSelectPreset?.(preset);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setSelectedSample(null); // Clear sample selection
    setSelectedPreset(null); // Clear preset selection
    onSelectProject?.(project);
  };

  const handleImportClick = (targetPath: string) => {
    setImportTarget(targetPath);
    setImportDialogOpen(true);
  };

  const handleImportComplete = () => {
    setImportDialogOpen(false);
    onImportComplete?.();
  };

  return (
    <div className="text-sm">
      <TreeNode label="Multigrain" icon="💾" defaultOpen>
        {/* Projects */}
        <TreeNode
          label="Projects"
          icon="📂"
          count={structure.projects.length}
          defaultOpen
        >
          {structure.projects.map((project) => (
            <ProjectNode
              key={project.path}
              project={project}
              onSelectSample={handleSelectSample}
              onSelectPreset={handleSelectPreset}
              onSelectProject={handleSelectProject}
              selectedSample={selectedSample}
              selectedPreset={selectedPreset}
              selectedProject={selectedProject}
              onProjectNameChange={onProjectNameChange}
              onImportClick={handleImportClick}
            />
          ))}
        </TreeNode>

        {/* Global Wavs */}
        <div className="select-none">
          <div className="flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-panel-dark group">
            <span className="text-label-gray w-4 text-center">▶</span>
            <span>🎶</span>
            <span className="flex-1 truncate text-label-black">Wavs</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Get the Wavs folder path from structure
                const wavsPath = structure.rootPath + '/Wavs';
                handleImportClick(wavsPath);
              }}
              className="opacity-0 group-hover:opacity-100 text-xs px-2 py-0.5 bg-label-blue hover:bg-knob-ring text-white rounded transition-opacity flex-shrink-0"
              title="Import samples"
            >
              +
            </button>
            <span className="text-xs text-label-gray bg-panel-dark px-1.5 py-0.5 rounded flex-shrink-0">
              {structure.globalWavs.length}
            </span>
          </div>
          <div className="ml-4 border-l border-panel-dark pl-2">
            {structure.globalWavs.map((sample) => (
              <SampleNode
                key={sample.path}
                sample={sample}
                onSelect={handleSelectSample}
                isSelected={selectedSample?.path === sample.path}
              />
            ))}
          </div>
        </div>

        {/* Recordings */}
        <TreeNode
          label="Recs"
          icon="🎤"
          count={structure.recordings.length}
        >
          {structure.recordings.length === 0 ? (
            <div className="text-label-gray text-xs ml-6 py-1">No recordings</div>
          ) : (
            structure.recordings.map((sample) => (
              <SampleNode
                key={sample.path}
                sample={sample}
                onSelect={handleSelectSample}
                isSelected={selectedSample?.path === sample.path}
              />
            ))
          )}
        </TreeNode>
      </TreeNode>

      {/* Import Dialog */}
      <ImportDialog
        isOpen={importDialogOpen}
        targetPath={importTarget}
        onClose={() => setImportDialogOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};
