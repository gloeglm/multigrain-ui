import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioWaveform } from './AudioWaveform';

// Mock wavesurfer.js - factory cannot reference outer scope variables when hoisted
vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn(),
  },
}));

import WaveSurfer from 'wavesurfer.js';

// Module-level helpers set up in beforeEach for each test
let triggerEvent: (event: string, ...args: unknown[]) => void = () => {};
let mockWaveSurfer: {
  on: ReturnType<typeof vi.fn>;
  loadBlob: ReturnType<typeof vi.fn>;
  playPause: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  getDuration: ReturnType<typeof vi.fn>;
  getCurrentTime: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
};

describe('AudioWaveform Component', () => {
  const samplePath = '/test/Project01/sample.wav';

  beforeEach(() => {
    vi.clearAllMocks();

    const eventListeners: Record<string, ((...args: unknown[]) => void)[]> = {};

    mockWaveSurfer = {
      on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        if (!eventListeners[event]) eventListeners[event] = [];
        eventListeners[event].push(cb);
      }),
      loadBlob: vi.fn(),
      playPause: vi.fn(),
      stop: vi.fn(),
      getDuration: vi.fn().mockReturnValue(5.0),
      getCurrentTime: vi.fn().mockReturnValue(0),
      play: vi.fn(),
      destroy: vi.fn(),
    };

    triggerEvent = (event: string, ...args: unknown[]) => {
      eventListeners[event]?.forEach((cb) => cb(...args));
    };

    vi.mocked(WaveSurfer.create).mockReturnValue(mockWaveSurfer as any);

    vi.mocked(window.electronAPI.readFile).mockResolvedValue(Buffer.from([]) as any);
  });

  describe('Initial Rendering', () => {
    it('shows loading indicator initially', () => {
      render(<AudioWaveform samplePath={samplePath} />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('renders play/pause button disabled while loading', () => {
      render(<AudioWaveform samplePath={samplePath} />);
      expect(screen.getByTestId('play-pause-button')).toBeDisabled();
    });

    it('renders stop button disabled while loading', () => {
      render(<AudioWaveform samplePath={samplePath} />);
      expect(screen.getByTestId('stop-button')).toBeDisabled();
    });

    it('shows initial time as 0:00 / 0:00', () => {
      render(<AudioWaveform samplePath={samplePath} />);
      expect(screen.getByTestId('time-display')).toHaveTextContent('0:00 / 0:00');
    });

    it('shows play icon initially', () => {
      render(<AudioWaveform samplePath={samplePath} />);
      expect(screen.getByTestId('play-pause-button')).toHaveTextContent('▶');
    });

    it('creates WaveSurfer instance on mount', () => {
      render(<AudioWaveform samplePath={samplePath} />);
      expect(WaveSurfer.create).toHaveBeenCalledOnce();
    });

    it('reads audio file on mount', async () => {
      render(<AudioWaveform samplePath={samplePath} />);
      await waitFor(() => {
        expect(window.electronAPI.readFile).toHaveBeenCalledWith(samplePath);
      });
    });
  });

  describe('After Ready Event', () => {
    it('hides loading indicator after ready', async () => {
      render(<AudioWaveform samplePath={samplePath} />);

      await act(async () => {
        triggerEvent('ready');
      });

      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    it('enables play/pause button after ready', async () => {
      render(<AudioWaveform samplePath={samplePath} />);

      await act(async () => {
        triggerEvent('ready');
      });

      expect(screen.getByTestId('play-pause-button')).not.toBeDisabled();
    });

    it('enables stop button after ready', async () => {
      render(<AudioWaveform samplePath={samplePath} />);

      await act(async () => {
        triggerEvent('ready');
      });

      expect(screen.getByTestId('stop-button')).not.toBeDisabled();
    });

    it('displays duration after ready', async () => {
      mockWaveSurfer.getDuration.mockReturnValue(65.0); // 1:05
      render(<AudioWaveform samplePath={samplePath} />);

      await act(async () => {
        triggerEvent('ready');
      });

      expect(screen.getByTestId('time-display')).toHaveTextContent('0:00 / 1:05');
    });
  });

  describe('Playback Controls', () => {
    it('calls playPause when play button clicked', async () => {
      const user = userEvent.setup();
      render(<AudioWaveform samplePath={samplePath} />);

      await act(async () => {
        triggerEvent('ready');
      });

      await user.click(screen.getByTestId('play-pause-button'));
      expect(mockWaveSurfer.playPause).toHaveBeenCalled();
    });

    it('calls stop when stop button clicked', async () => {
      const user = userEvent.setup();
      render(<AudioWaveform samplePath={samplePath} />);

      await act(async () => {
        triggerEvent('ready');
      });

      await user.click(screen.getByTestId('stop-button'));
      expect(mockWaveSurfer.stop).toHaveBeenCalled();
    });

    it('shows pause icon when play event fires', async () => {
      render(<AudioWaveform samplePath={samplePath} />);

      await act(async () => {
        triggerEvent('ready');
        triggerEvent('play');
      });

      expect(screen.getByTestId('play-pause-button')).toHaveTextContent('⏸');
    });

    it('shows play icon when pause event fires', async () => {
      render(<AudioWaveform samplePath={samplePath} />);

      await act(async () => {
        triggerEvent('ready');
        triggerEvent('play');
        triggerEvent('pause');
      });

      expect(screen.getByTestId('play-pause-button')).toHaveTextContent('▶');
    });

    it('shows play icon after finish event', async () => {
      render(<AudioWaveform samplePath={samplePath} />);

      await act(async () => {
        triggerEvent('ready');
        triggerEvent('play');
        triggerEvent('finish');
      });

      expect(screen.getByTestId('play-pause-button')).toHaveTextContent('▶');
    });

    it('resets current time to 0:00 after stop', async () => {
      const user = userEvent.setup();
      render(<AudioWaveform samplePath={samplePath} />);

      await act(async () => {
        triggerEvent('ready');
        triggerEvent('play');
      });

      await user.click(screen.getByTestId('stop-button'));
      expect(screen.getByTestId('time-display')).toHaveTextContent('0:00 /');
    });
  });

  describe('Auto-Play', () => {
    it('calls play() when autoPlay=true and ready fires', async () => {
      render(<AudioWaveform samplePath={samplePath} autoPlay={true} />);

      await act(async () => {
        triggerEvent('ready');
      });

      expect(mockWaveSurfer.play).toHaveBeenCalled();
    });

    it('does not call play() when autoPlay=false and ready fires', async () => {
      render(<AudioWaveform samplePath={samplePath} autoPlay={false} />);

      await act(async () => {
        triggerEvent('ready');
      });

      expect(mockWaveSurfer.play).not.toHaveBeenCalled();
    });

    it('does not call play() when autoPlay not specified', async () => {
      render(<AudioWaveform samplePath={samplePath} />);

      await act(async () => {
        triggerEvent('ready');
      });

      expect(mockWaveSurfer.play).not.toHaveBeenCalled();
    });
  });

  describe('Sample Path Changes', () => {
    it('creates new WaveSurfer instance when samplePath changes', async () => {
      const { rerender } = render(<AudioWaveform samplePath={samplePath} />);

      rerender(<AudioWaveform samplePath="/test/Project01/other.wav" />);

      await waitFor(() => {
        expect(WaveSurfer.create).toHaveBeenCalledTimes(2);
      });
    });

    it('destroys previous WaveSurfer instance when samplePath changes', async () => {
      const { rerender } = render(<AudioWaveform samplePath={samplePath} />);

      rerender(<AudioWaveform samplePath="/test/Project01/other.wav" />);

      await waitFor(() => {
        expect(mockWaveSurfer.destroy).toHaveBeenCalled();
      });
    });

    it('resets to loading state when samplePath changes', () => {
      const { rerender } = render(<AudioWaveform samplePath={samplePath} />);
      rerender(<AudioWaveform samplePath="/test/Project01/other.wav" />);
      expect(screen.getByTestId('play-pause-button')).toBeDisabled();
    });
  });

  describe('Cleanup', () => {
    it('destroys WaveSurfer instance on unmount', () => {
      const { unmount } = render(<AudioWaveform samplePath={samplePath} />);
      unmount();
      expect(mockWaveSurfer.destroy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('hides loading indicator when readFile fails', async () => {
      vi.mocked(window.electronAPI.readFile).mockRejectedValue(new Error('File not found'));

      render(<AudioWaveform samplePath={samplePath} />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
    });

    it('never calls loadBlob when readFile fails', async () => {
      vi.mocked(window.electronAPI.readFile).mockRejectedValue(new Error('File not found'));

      render(<AudioWaveform samplePath={samplePath} />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });

      expect(mockWaveSurfer.loadBlob).not.toHaveBeenCalled();
    });
  });
});
