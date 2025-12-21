import React, { useState } from 'react';
import { MultigainStructure, Project, WavFile, Preset } from '../../shared/types';
import { ImportDialog } from './ImportDialog';
import { CreateProjectDialog } from './CreateProjectDialog';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import { formatProjectDisplayName } from '../../shared/constants';

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
          <span className="w-4 flex items-center justify-center">
            <span
              className={`border-solid border-label-gray transition-transform ${
                isOpen
                  ? 'border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px]'
                  : 'border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px]'
              }`}
            />
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
  onContextMenu?: (e: React.MouseEvent, project: Project) => void;
  triggerRename?: boolean;
  onCancelRename?: () => void;
}> = ({ project, onSelectSample, onSelectPreset, onSelectProject, selectedSample, selectedPreset, selectedProject, onProjectNameChange, onContextMenu, triggerRename, onCancelRename }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customName, setCustomName] = useState(project.customName || '');
  const [isSaving, setIsSaving] = useState(false);

  // Trigger edit mode from parent
  React.useEffect(() => {
    if (triggerRename) {
      setIsEditing(true);
    }
  }, [triggerRename]);

  const displayName = formatProjectDisplayName(project.index, project.name, project.customName);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await window.electronAPI.writeProjectMetadata(project.path, customName);
      if (result.success) {
        setIsEditing(false);
        onCancelRename?.(); // Clear trigger state in parent
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
    onCancelRename?.(); // Clear trigger state in parent
  };

  const isSelected = selectedProject?.path === project.path;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-panel-dark cursor-pointer ${
          isSelected ? 'bg-label-blue bg-opacity-10 border-l-2 border-label-blue' : ''
        }`}
        onClick={() => {
          if (!isEditing) {
            setIsOpen(!isOpen);
            // Select project to show autosave
            onSelectProject?.(project);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isEditing) {
            onContextMenu?.(e, project);
          }
        }}
      >
        <span className="w-4 flex items-center justify-center">
          <span
            className={`border-solid border-label-gray transition-transform ${
              isOpen
                ? 'border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px]'
                : 'border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px]'
            }`}
          />
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
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              disabled={isSaving}
              className="text-xs px-2 py-0.5 bg-label-blue hover:bg-button-dark disabled:bg-button-gray text-white rounded"
              title="Save"
            >
              ✓
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
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
            </span>
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
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [wavsExpanded, setWavsExpanded] = useState(false);

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

  const handleCreateProject = async (projectNumber: number, customName?: string) => {
    const result = await window.electronAPI.createProject(structure.rootPath, projectNumber, customName);
    if (!result.success) {
      throw new Error(result.error || 'Failed to create project');
    }
    // Reload structure after successful creation
    onImportComplete?.();
  };

  const handleProjectContextMenu = (e: React.MouseEvent, project: Project) => {
    const items: ContextMenuItem[] = [
      {
        label: 'Import Samples',
        icon: '📥',
        onClick: () => handleImportClick(project.path),
      },
      {
        label: 'Rename Project',
        icon: '✎',
        onClick: () => {
          setProjectToRename(project);
        },
      },
    ];

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items,
    });
  };

  const handleProjectsFolderContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const items: ContextMenuItem[] = [
      {
        label: 'Create New Project',
        icon: '➕',
        onClick: () => setCreateProjectDialogOpen(true),
      },
    ];

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items,
    });
  };

  const handleWavsFolderContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const items: ContextMenuItem[] = [
      {
        label: 'Import Samples',
        icon: '📥',
        onClick: () => handleImportClick(structure.rootPath + '/Wavs'),
      },
    ];

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items,
    });
  };

  // Pass existing projects to CreateProjectDialog
  const existingProjects = structure.projects;

  return (
    <div className="text-sm">
      <TreeNode label="Multigrain" icon="💾" defaultOpen>
        {/* Projects */}
        <div className="select-none">
          <div
            className="flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-panel-dark"
            onContextMenu={handleProjectsFolderContextMenu}
          >
            <span className="w-4 flex items-center justify-center">
              <span className="border-solid border-label-gray border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px]" />
            </span>
            <span>📂</span>
            <span className="flex-1 truncate text-label-black">Projects</span>
            <span className="text-xs text-label-gray bg-panel-dark px-1.5 py-0.5 rounded flex-shrink-0">
              {structure.projects.length}
            </span>
          </div>
          <div className="ml-4 border-l border-panel-dark pl-2">
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
                onContextMenu={handleProjectContextMenu}
                triggerRename={projectToRename?.path === project.path}
                onCancelRename={() => setProjectToRename(null)}
              />
            ))}
          </div>
        </div>

        {/* Global Wavs */}
        <div className="select-none">
          <div
            className="flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-panel-dark"
            onClick={() => setWavsExpanded(!wavsExpanded)}
            onContextMenu={handleWavsFolderContextMenu}
          >
            <span className="w-4 flex items-center justify-center">
              <span
                className={`border-solid border-label-gray transition-transform ${
                  wavsExpanded
                    ? 'border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px]'
                    : 'border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px]'
                }`}
              />
            </span>
            <span>🎶</span>
            <span className="flex-1 truncate text-label-black">Wavs</span>
            <span className="text-xs text-label-gray bg-panel-dark px-1.5 py-0.5 rounded flex-shrink-0">
              {structure.globalWavs.length}
            </span>
          </div>
          {wavsExpanded && (
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
          )}
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

      {/* Create Project Dialog */}
      <CreateProjectDialog
        isOpen={createProjectDialogOpen}
        existingProjects={existingProjects}
        onClose={() => setCreateProjectDialogOpen(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
