import React, { useState } from 'react';
import { MultigainStructure, Project, WavFile, Preset, TreeSelection } from '../../shared/types';
import { ImportDialog } from './ImportDialog';
import { CreateProjectDialog } from './CreateProjectDialog';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import { ConfirmDialog } from './ConfirmDialog';
import { formatProjectDisplayName } from '../../shared/constants';

interface FileTreeProps {
  structure: MultigainStructure;
  selection: TreeSelection;
  onSelectionChange: (selection: TreeSelection) => void;
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
  alwaysOpen?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  label,
  icon,
  children,
  defaultOpen = false,
  count,
  onClick,
  isSelected,
  alwaysOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasChildren = React.Children.count(children) > 0;
  const isExpanded = alwaysOpen || isOpen;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-panel-dark ${
          isSelected ? 'bg-panel-dark' : ''
        }`}
        onClick={() => {
          if (hasChildren && !alwaysOpen) setIsOpen(!isOpen);
          onClick?.();
        }}
      >
        {hasChildren ? (
          <span className="w-4 flex items-center justify-center">
            <span
              className={`border-solid border-label-gray ${
                alwaysOpen ? '' : 'transition-transform'
              } ${
                isExpanded
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
      {hasChildren && isExpanded && (
        <div className="ml-4 border-l border-panel-dark pl-2">{children}</div>
      )}
    </div>
  );
};

interface SampleNodeProps {
  sample: WavFile;
  onSelect?: (sample: WavFile) => void;
  isSelected?: boolean;
  onContextMenu?: (e: React.MouseEvent, sample: WavFile) => void;
}

const SampleNode: React.FC<SampleNodeProps> = ({ sample, onSelect, isSelected, onContextMenu }) => {
  const sizeKB = Math.round(sample.size / 1024);

  return (
    <div
      className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-panel-dark ml-6 ${
        isSelected ? 'bg-button-red bg-opacity-20 border-l-2 border-button-red' : ''
      }`}
      onClick={() => onSelect?.(sample)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, sample);
      }}
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
                  onContextMenu={handleSampleContextMenu}
                />
              ))}
            </TreeNode>
          )}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ structure, selection, onSelectionChange, onProjectNameChange, onImportComplete }) => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importTarget, setImportTarget] = useState<string>('');
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [wavsExpanded, setWavsExpanded] = useState(false);
  const [projectsFolderExpanded, setProjectsFolderExpanded] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'project' | 'sample';
    item: Project | WavFile;
  } | null>(null);

  const handleSelectSample = (sample: WavFile) => {
    onSelectionChange({ type: 'sample', sample });
  };

  const handleSelectPreset = (preset: Preset, project?: Project) => {
    onSelectionChange({ type: 'preset', preset, project });
  };

  const handleSelectProject = (project: Project) => {
    // When selecting a project, show its autosave if available
    if (project.autosave) {
      onSelectionChange({ type: 'preset', preset: project.autosave, project });
    } else {
      onSelectionChange({ type: 'project', project });
    }
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
      {
        label: 'Delete Project',
        icon: '🗑️',
        onClick: () => {
          setDeleteConfirm({ type: 'project', item: project });
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

  const handleShowOverview = () => {
    onSelectionChange({ type: 'overview' });
  };

  const handleSampleContextMenu = (e: React.MouseEvent, sample: WavFile) => {
    const items: ContextMenuItem[] = [
      {
        label: 'Delete Sample',
        icon: '🗑️',
        onClick: () => {
          setDeleteConfirm({ type: 'sample', item: sample });
        },
      },
    ];

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items,
    });
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      const result = await window.electronAPI.deleteProject(project.path);
      if (result.success) {
        alert(`Project "${formatProjectDisplayName(project.index, project.name, project.customName)}" has been deleted.`);
        onImportComplete?.(); // Reload structure
      } else {
        alert(`Failed to delete project: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDeleteSample = async (sample: WavFile) => {
    try {
      const result = await window.electronAPI.deleteSample(sample.path);
      if (result.success) {
        alert(`Sample "${sample.name}" has been deleted.`);
        onImportComplete?.(); // Reload structure
      } else {
        alert(`Failed to delete sample: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting sample:', error);
      alert('Failed to delete sample');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Pass existing projects to CreateProjectDialog
  const existingProjects = structure.projects;

  // Check what's currently selected for visual feedback
  const isOverviewSelected = selection.type === 'overview';

  return (
    <div className="text-sm">
      <TreeNode
        label="Multigrain"
        icon="💾"
        alwaysOpen
        onClick={handleShowOverview}
      >
        {/* Projects */}
        <div className="select-none">
          <div
            className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-panel-dark ${
              isOverviewSelected ? 'bg-panel-dark' : ''
            }`}
            onClick={handleShowOverview}
            onContextMenu={handleProjectsFolderContextMenu}
          >
            <span className="w-4 flex items-center justify-center">
              <span
                className={`border-solid border-label-gray transition-transform ${
                  projectsFolderExpanded
                    ? 'border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px]'
                    : 'border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px]'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setProjectsFolderExpanded(!projectsFolderExpanded);
                }}
              />
            </span>
            <span>📂</span>
            <span className="flex-1 truncate text-label-black">Projects</span>
            <span className="text-xs text-label-gray bg-panel-dark px-1.5 py-0.5 rounded flex-shrink-0">
              {structure.projects.length}
            </span>
          </div>
          {projectsFolderExpanded && (
            <div className="ml-4 border-l border-panel-dark pl-2">
            {structure.projects.map((project) => (
              <ProjectNode
                key={project.path}
                project={project}
                onSelectSample={handleSelectSample}
                onSelectPreset={handleSelectPreset}
                onSelectProject={handleSelectProject}
                selectedSample={selection.type === 'sample' ? selection.sample : null}
                selectedPreset={selection.type === 'preset' ? selection.preset : null}
                selectedProject={selection.type === 'project' || (selection.type === 'preset' && selection.project) ? (selection.type === 'project' ? selection.project : selection.project) : null}
                onProjectNameChange={onProjectNameChange}
                onContextMenu={handleProjectContextMenu}
                triggerRename={projectToRename?.path === project.path}
                onCancelRename={() => setProjectToRename(null)}
              />
            ))}
            </div>
          )}
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
                  isSelected={selection.type === 'sample' && selection.sample.path === sample.path}
                  onContextMenu={handleSampleContextMenu}
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
                isSelected={selection.type === 'sample' && selection.sample.path === sample.path}
                onContextMenu={handleSampleContextMenu}
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

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          title={deleteConfirm.type === 'project' ? 'Delete Project' : 'Delete Sample'}
          message={
            deleteConfirm.type === 'project'
              ? `Are you sure you want to delete project "${formatProjectDisplayName(
                  (deleteConfirm.item as Project).index,
                  (deleteConfirm.item as Project).name,
                  (deleteConfirm.item as Project).customName
                )}"?\n\nThis will permanently delete the project folder and all its contents including:\n- All presets (up to 48)\n- All samples in the project folder\n- All metadata\n\nThis action cannot be undone.`
              : `Are you sure you want to delete sample "${(deleteConfirm.item as WavFile).name}"?\n\nThis action cannot be undone.`
          }
          confirmLabel={deleteConfirm.type === 'project' ? 'Delete Project' : 'Delete Sample'}
          cancelLabel="Cancel"
          confirmVariant="danger"
          onConfirm={() => {
            if (deleteConfirm.type === 'project') {
              handleDeleteProject(deleteConfirm.item as Project);
            } else {
              handleDeleteSample(deleteConfirm.item as WavFile);
            }
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};
