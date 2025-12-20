import React, { useState } from 'react';
import { MultigainStructure, Project, WavFile } from '../../shared/types';

interface FileTreeProps {
  structure: MultigainStructure;
  onSelectSample?: (sample: WavFile) => void;
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
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-gray-700 ${
          isSelected ? 'bg-gray-700' : ''
        }`}
        onClick={() => {
          if (hasChildren) setIsOpen(!isOpen);
          onClick?.();
        }}
      >
        {hasChildren ? (
          <span className="text-gray-500 w-4 text-center">
            {isOpen ? '▼' : '▶'}
          </span>
        ) : (
          <span className="w-4" />
        )}
        <span>{icon}</span>
        <span className="flex-1 truncate">{label}</span>
        {count !== undefined && (
          <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
            {count}
          </span>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="ml-4 border-l border-gray-700 pl-2">{children}</div>
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
      className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-gray-700 ml-6 ${
        isSelected ? 'bg-grain-600 bg-opacity-30' : ''
      }`}
      onClick={() => onSelect?.(sample)}
    >
      <span className="text-grain-400">♪</span>
      <span className="flex-1 truncate text-sm">{sample.name}</span>
      <span className="text-xs text-gray-500">{sizeKB} KB</span>
    </div>
  );
};

const ProjectNode: React.FC<{
  project: Project;
  onSelectSample?: (sample: WavFile) => void;
  selectedSample?: WavFile | null;
}> = ({ project, onSelectSample, selectedSample }) => {
  return (
    <TreeNode
      label={project.name}
      icon="📁"
      count={project.samples.length}
    >
      {project.presets.length > 0 && (
        <TreeNode label="Presets" icon="📋" count={project.presets.length}>
          {project.presets.map((preset) => (
            <div
              key={preset.path}
              className="flex items-center gap-2 py-1 px-2 ml-6 text-sm text-gray-400"
            >
              <span>📄</span>
              <span>{preset.name}</span>
            </div>
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
    </TreeNode>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ structure, onSelectSample }) => {
  const [selectedSample, setSelectedSample] = useState<WavFile | null>(null);

  const handleSelectSample = (sample: WavFile) => {
    setSelectedSample(sample);
    onSelectSample?.(sample);
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
              selectedSample={selectedSample}
            />
          ))}
        </TreeNode>

        {/* Global Wavs */}
        <TreeNode
          label="Wavs"
          icon="🎶"
          count={structure.globalWavs.length}
        >
          {structure.globalWavs.map((sample) => (
            <SampleNode
              key={sample.path}
              sample={sample}
              onSelect={handleSelectSample}
              isSelected={selectedSample?.path === sample.path}
            />
          ))}
        </TreeNode>

        {/* Recordings */}
        <TreeNode
          label="Recs"
          icon="🎤"
          count={structure.recordings.length}
        >
          {structure.recordings.length === 0 ? (
            <div className="text-gray-500 text-xs ml-6 py-1">No recordings</div>
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
    </div>
  );
};
