import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { WavFile } from '../../shared/types';

interface AudioPlayerProps {
  sample: WavFile;
  autoPlay?: boolean;
  onRenameComplete?: (newPath: string) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ sample, autoPlay = false, onRenameComplete }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);
  const [description, setDescription] = useState<string>('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [newName, setNewName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [metadata, setMetadata] = useState<{
    sampleRate: number;
    bitDepth: number;
    channels: number;
  } | null>(null);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Create WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#2e5c8a',
      progressColor: '#c41e3a',
      cursorColor: '#000000',
      barWidth: 2,
      barGap: 1,
      height: 128,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurferRef.current = wavesurfer;

    // Load audio file - load the file as arraybuffer
    const loadAudio = async () => {
      try {
        const buffer = await window.electronAPI.readFile(sample.path);
        const blob = new Blob([buffer], { type: 'audio/wav' });
        wavesurfer.loadBlob(blob);
      } catch (error) {
        console.error('Error loading audio file:', error);
        setIsLoading(false);
      }
    };

    loadAudio();

    // Event listeners
    wavesurfer.on('ready', () => {
      setIsLoading(false);
      setDuration(wavesurfer.getDuration());
      setIsReady(true);
    });

    wavesurfer.on('audioprocess', () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
    });

    wavesurfer.on('play', () => {
      setIsPlaying(true);
    });

    wavesurfer.on('pause', () => {
      setIsPlaying(false);
    });

    // Cleanup - explicitly stop playback before destroying
    return () => {
      if (wavesurfer) {
        wavesurfer.stop();
        wavesurfer.destroy();
      }
      setIsReady(false);
      setIsPlaying(false);
    };
  }, [sample.path]);

  // Reset editing state when sample changes
  useEffect(() => {
    setIsEditingName(false);
    setNewName('');
    setIsEditingDescription(false);
  }, [sample.path]);

  // Load metadata when sample changes
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const meta = await window.electronAPI.readAudioMetadata(sample.path);
        setDescription(meta.description);
        setMetadata({
          sampleRate: meta.sampleRate,
          bitDepth: meta.bitDepth,
          channels: meta.channels,
        });
      } catch (error) {
        console.error('Error loading metadata:', error);
      }
    };

    loadMetadata();
  }, [sample.path]);

  // Auto-play when ready and autoPlay is enabled
  useEffect(() => {
    if (isReady && autoPlay && wavesurferRef.current && !isPlaying) {
      wavesurferRef.current.play();
    }
  }, [isReady, autoPlay]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleStop = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.stop();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              <h3 className="text-lg font-medium text-label-black">{sample.name}</h3>
              <button
                onClick={handleStartRename}
                className="text-xs px-3 py-1 bg-button-dark hover:bg-knob-ring text-white rounded transition-colors"
              >
                Rename
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-label-gray">Size:</span>
            <span className="ml-2 text-label-black">{(sample.size / 1024).toFixed(1)} KB</span>
          </div>
          <div>
            <span className="text-label-gray">Duration:</span>
            <span className="ml-2 text-label-black">
              {isLoading ? '...' : formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Waveform */}
      <div className="bg-white rounded border-2 border-panel-dark p-4">
        <div ref={waveformRef} className="rounded overflow-hidden bg-panel-light" />
        {isLoading && (
          <div className="text-center py-4 text-label-gray text-sm">Loading waveform...</div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white rounded border-2 border-panel-dark p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className="w-16 h-16 rounded-full bg-button-dark hover:bg-knob-ring disabled:bg-button-gray disabled:cursor-not-allowed text-white font-bold text-xl transition-colors"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={handleStop}
            disabled={isLoading || !isPlaying}
            className="w-12 h-12 rounded-full bg-button-gray hover:bg-button-dark disabled:bg-panel disabled:cursor-not-allowed text-white font-bold transition-colors"
          >
            ⏹
          </button>
          <div className="flex-1">
            <div className="text-label-blue font-mono text-lg">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded border-2 border-panel-dark p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-label-blue">Description</h4>
          {!isEditingDescription ? (
            <button
              onClick={() => setIsEditingDescription(true)}
              className="text-xs px-3 py-1 bg-button-dark hover:bg-knob-ring text-white rounded transition-colors"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSaveDescription}
                disabled={isSavingDescription}
                className="text-xs px-3 py-1 bg-label-blue hover:bg-button-dark disabled:bg-button-gray text-white rounded transition-colors"
              >
                {isSavingDescription ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditingDescription(false);
                  // Reset to original value
                  window.electronAPI.readAudioMetadata(sample.path).then(meta => {
                    setDescription(meta.description);
                  });
                }}
                disabled={isSavingDescription}
                className="text-xs px-3 py-1 bg-button-gray hover:bg-button-dark disabled:bg-panel text-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        {isEditingDescription ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a short description for this sample..."
            className="w-full min-h-[80px] p-2 text-sm border-2 border-panel-dark rounded focus:border-label-blue focus:outline-none resize-y"
          />
        ) : (
          <div className="text-sm text-label-gray min-h-[80px] p-2 whitespace-pre-wrap">
            {description || <span className="italic text-label-gray opacity-60">No description</span>}
          </div>
        )}
      </div>

      {/* Technical Details */}
      <div className="bg-white rounded border-2 border-panel-dark p-4">
        <h4 className="text-sm font-medium text-label-blue mb-2">Technical Details</h4>
        <div className="space-y-2 text-sm">
          {metadata && (
            <div className="grid grid-cols-3 gap-3 pb-2 border-b border-panel-dark">
              <div>
                <span className="text-label-gray text-xs">Sample Rate:</span>
                <div className="text-label-black font-medium">{metadata.sampleRate} Hz</div>
              </div>
              <div>
                <span className="text-label-gray text-xs">Bit Depth:</span>
                <div className="text-label-black font-medium">{metadata.bitDepth} bit</div>
              </div>
              <div>
                <span className="text-label-gray text-xs">Channels:</span>
                <div className="text-label-black font-medium">{metadata.channels === 1 ? 'Mono' : 'Stereo'}</div>
              </div>
            </div>
          )}
          <div>
            <span className="text-label-gray text-xs font-medium">Path:</span>
            <div className="font-mono text-label-black text-xs break-all mt-1">{sample.path}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
