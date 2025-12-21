import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioWaveformProps {
  samplePath: string;
  autoPlay?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ samplePath, autoPlay = false }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);

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

    // Load audio file
    const loadAudio = async () => {
      try {
        const buffer = await window.electronAPI.readFile(samplePath);
        // Convert Buffer to ArrayBuffer for Blob
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

    // Cleanup
    return () => {
      if (wavesurfer) {
        wavesurfer.stop();
        wavesurfer.destroy();
      }
      setIsReady(false);
      setIsPlaying(false);
    };
  }, [samplePath]);

  // Auto-play when ready and autoPlay is enabled (only once)
  useEffect(() => {
    if (isReady && autoPlay && wavesurferRef.current) {
      wavesurferRef.current.play();
    }
  }, [isReady, autoPlay]); // Don't include isPlaying to prevent auto-play after finish

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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
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
            disabled={isLoading}
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
    </div>
  );
};
