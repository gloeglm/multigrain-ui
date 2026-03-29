import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions';
import { ConfirmDialog } from './ConfirmDialog';

interface AudioWaveformProps {
  samplePath: string;
  autoPlay?: boolean;
  onCropComplete?: () => void;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  samplePath,
  autoPlay = false,
  onCropComplete,
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [showCropConfirm, setShowCropConfirm] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);

  useEffect(() => {
    if (!waveformRef.current) return;

    const regionsPlugin = RegionsPlugin.create();
    regionsRef.current = regionsPlugin;

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
      plugins: [regionsPlugin],
    });

    wavesurferRef.current = wavesurfer;

    // Enable drag-to-select; enforce one region at a time
    regionsPlugin.enableDragSelection({ color: 'rgba(46, 92, 138, 0.2)' });

    regionsPlugin.on('region-created', (region: Region) => {
      // Remove any existing regions before keeping the new one
      regionsPlugin.getRegions().forEach((r: Region) => {
        if (r.id !== region.id) r.remove();
      });
      setSelection({ start: region.start, end: region.end });
      setCropError(null);
    });

    regionsPlugin.on('region-updated', (region: Region) => {
      setSelection({ start: region.start, end: region.end });
      setCropError(null);
    });

    // Load audio file
    const loadAudio = async () => {
      try {
        const buffer = await window.electronAPI.readFile(samplePath);
        const arrayBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        ) as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
        wavesurfer.loadBlob(blob);
      } catch (error) {
        console.error('Error loading audio file:', error);
        setIsLoading(false);
      }
    };

    loadAudio();

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

    return () => {
      wavesurfer.stop();
      wavesurfer.destroy();
      setIsReady(false);
      setIsPlaying(false);
      setSelection(null);
    };
  }, [samplePath, reloadCount]);

  // Auto-play when ready and autoPlay is enabled (only once)
  useEffect(() => {
    if (isReady && autoPlay && wavesurferRef.current) {
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

  const handleClearSelection = () => {
    regionsRef.current?.clearRegions();
    setSelection(null);
    setCropError(null);
  };

  const handleCropConfirm = async () => {
    if (!selection) return;
    setShowCropConfirm(false);
    setIsCropping(true);
    setCropError(null);

    try {
      const result = await window.electronAPI.cropAudio(samplePath, selection.start, selection.end);
      if (result.success) {
        setSelection(null);
        setReloadCount((c) => c + 1);
        onCropComplete?.();
      } else {
        setCropError(result.error ?? 'Crop failed');
      }
    } catch (error) {
      setCropError(error instanceof Error ? error.message : 'Crop failed');
    } finally {
      setIsCropping(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Waveform */}
      <div className="bg-white rounded border-2 border-panel-dark p-4">
        <div ref={waveformRef} className="rounded overflow-hidden bg-panel-light" />
        {isLoading && (
          <div data-testid="loading-indicator" className="text-center py-4 text-label-gray text-sm">
            Loading waveform...
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white rounded border-2 border-panel-dark p-4">
        <div className="flex items-center gap-4">
          <button
            data-testid="play-pause-button"
            onClick={handlePlayPause}
            disabled={isLoading}
            className="w-16 h-16 rounded-full bg-button-dark hover:bg-knob-ring disabled:bg-button-gray disabled:cursor-not-allowed text-white font-bold text-xl transition-colors"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            data-testid="stop-button"
            onClick={handleStop}
            disabled={isLoading}
            className="w-12 h-12 rounded-full bg-button-gray hover:bg-button-dark disabled:bg-panel disabled:cursor-not-allowed text-white font-bold transition-colors"
          >
            ⏹
          </button>
          <div className="flex-1">
            <div data-testid="time-display" className="text-label-blue font-mono text-lg">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
      </div>

      {/* Crop controls — shown when a region is selected */}
      {selection && (
        <div
          data-testid="crop-controls"
          className="bg-white rounded border-2 border-panel-dark p-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <span className="text-sm text-label-gray">Selection: </span>
              <span data-testid="selection-range" className="font-mono text-sm text-label-black">
                {formatTime(selection.start)} – {formatTime(selection.end)}
              </span>
              <span className="ml-2 text-sm text-label-gray">
                ({formatTime(selection.end - selection.start)})
              </span>
            </div>
            <button
              data-testid="clear-selection-button"
              onClick={handleClearSelection}
              disabled={isCropping}
              className="px-3 py-2 rounded text-sm font-medium bg-panel-dark hover:bg-button-gray text-label-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear
            </button>
            <button
              data-testid="crop-button"
              onClick={() => setShowCropConfirm(true)}
              disabled={isCropping}
              className="px-3 py-2 rounded text-sm font-medium bg-button-red hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCropping ? 'Cropping…' : '✂ Crop to selection'}
            </button>
          </div>
          {cropError && (
            <p data-testid="crop-error" className="mt-2 text-sm text-red-600">
              {cropError}
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={showCropConfirm}
        title="Crop sample"
        message={
          selection
            ? `This will permanently trim the file to the selected region (${formatTime(selection.start)} – ${formatTime(selection.end)}).\n\nThis cannot be undone.`
            : ''
        }
        confirmLabel="Crop"
        confirmVariant="danger"
        onConfirm={handleCropConfirm}
        onCancel={() => setShowCropConfirm(false)}
      />
    </div>
  );
};
