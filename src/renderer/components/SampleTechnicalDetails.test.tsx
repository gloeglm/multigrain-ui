import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SampleTechnicalDetails } from './SampleTechnicalDetails';
import { createMockSample } from '../../test/helpers';

describe('SampleTechnicalDetails Component', () => {
  const defaultSample = createMockSample({
    name: 'kick.wav',
    path: '/test/Project01/kick.wav',
    size: 204800, // 200 KB
  });

  const defaultMetadata = {
    sampleRate: 48000,
    bitDepth: 16,
    channels: 2,
    description: '',
    title: '',
    artist: '',
    duration: 2.0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(window.electronAPI.readAudioMetadata).mockResolvedValue(defaultMetadata);
  });

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      render(<SampleTechnicalDetails sample={defaultSample} />);
      expect(screen.getByTestId('metadata-loading')).toBeInTheDocument();
    });

    it('displays "Loading..." text initially', () => {
      render(<SampleTechnicalDetails sample={defaultSample} />);
      expect(screen.getByTestId('metadata-loading')).toHaveTextContent('Loading...');
    });

    it('calls readAudioMetadata with the sample path', async () => {
      render(<SampleTechnicalDetails sample={defaultSample} />);
      await waitFor(() => {
        expect(window.electronAPI.readAudioMetadata).toHaveBeenCalledWith(defaultSample.path);
      });
    });
  });

  describe('Metadata Display', () => {
    it('renders sample rate after loading', async () => {
      render(<SampleTechnicalDetails sample={defaultSample} />);
      await waitFor(() => {
        expect(screen.getByTestId('sample-rate')).toHaveTextContent('48000 Hz');
      });
    });

    it('renders bit depth after loading', async () => {
      render(<SampleTechnicalDetails sample={defaultSample} />);
      await waitFor(() => {
        expect(screen.getByTestId('bit-depth')).toHaveTextContent('16 bit');
      });
    });

    it('renders channel count after loading', async () => {
      render(<SampleTechnicalDetails sample={defaultSample} />);
      await waitFor(() => {
        expect(screen.getByTestId('channels')).toHaveTextContent('2');
      });
    });

    it('renders file size in KB', async () => {
      render(<SampleTechnicalDetails sample={defaultSample} />);
      await waitFor(() => {
        expect(screen.getByTestId('file-size')).toHaveTextContent('200.0 KB');
      });
    });

    it('renders file path', async () => {
      render(<SampleTechnicalDetails sample={defaultSample} />);
      await waitFor(() => {
        expect(screen.getByTestId('file-path')).toHaveTextContent('/test/Project01/kick.wav');
      });
    });

    it('hides loading indicator after metadata loads', async () => {
      render(<SampleTechnicalDetails sample={defaultSample} />);
      await waitFor(() => {
        expect(screen.queryByTestId('metadata-loading')).not.toBeInTheDocument();
      });
    });

    it('renders "Technical Details" heading', async () => {
      render(<SampleTechnicalDetails sample={defaultSample} />);
      expect(screen.getByText('Technical Details')).toBeInTheDocument();
    });
  });

  describe('Different Metadata Values', () => {
    it('displays mono channel correctly', async () => {
      vi.mocked(window.electronAPI.readAudioMetadata).mockResolvedValue({
        ...defaultMetadata,
        channels: 1,
      });

      render(<SampleTechnicalDetails sample={defaultSample} />);
      await waitFor(() => {
        expect(screen.getByTestId('channels')).toHaveTextContent('1');
      });
    });

    it('displays non-standard sample rate', async () => {
      vi.mocked(window.electronAPI.readAudioMetadata).mockResolvedValue({
        ...defaultMetadata,
        sampleRate: 44100,
      });

      render(<SampleTechnicalDetails sample={defaultSample} />);
      await waitFor(() => {
        expect(screen.getByTestId('sample-rate')).toHaveTextContent('44100 Hz');
      });
    });

    it('displays 24-bit depth', async () => {
      vi.mocked(window.electronAPI.readAudioMetadata).mockResolvedValue({
        ...defaultMetadata,
        bitDepth: 24,
      });

      render(<SampleTechnicalDetails sample={defaultSample} />);
      await waitFor(() => {
        expect(screen.getByTestId('bit-depth')).toHaveTextContent('24 bit');
      });
    });

    it('calculates file size with one decimal place', async () => {
      const sample = createMockSample({ size: 1500 }); // 1.5 KB
      render(<SampleTechnicalDetails sample={sample} />);
      await waitFor(() => {
        expect(screen.getByTestId('file-size')).toHaveTextContent('1.5 KB');
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when readAudioMetadata fails', async () => {
      vi.mocked(window.electronAPI.readAudioMetadata).mockRejectedValue(
        new Error('Failed to read metadata')
      );

      render(<SampleTechnicalDetails sample={defaultSample} />);

      await waitFor(() => {
        expect(screen.getByTestId('metadata-error')).toBeInTheDocument();
      });
    });

    it('displays "Error loading metadata" message on failure', async () => {
      vi.mocked(window.electronAPI.readAudioMetadata).mockRejectedValue(
        new Error('Failed to read metadata')
      );

      render(<SampleTechnicalDetails sample={defaultSample} />);

      await waitFor(() => {
        expect(screen.getByTestId('metadata-error')).toHaveTextContent('Error loading metadata');
      });
    });

    it('does not show metadata fields on error', async () => {
      vi.mocked(window.electronAPI.readAudioMetadata).mockRejectedValue(new Error('Read error'));

      render(<SampleTechnicalDetails sample={defaultSample} />);

      await waitFor(() => {
        expect(screen.getByTestId('metadata-error')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('sample-rate')).not.toBeInTheDocument();
      expect(screen.queryByTestId('bit-depth')).not.toBeInTheDocument();
    });

    it('hides loading state on error', async () => {
      vi.mocked(window.electronAPI.readAudioMetadata).mockRejectedValue(new Error('Read error'));

      render(<SampleTechnicalDetails sample={defaultSample} />);

      await waitFor(() => {
        expect(screen.queryByTestId('metadata-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sample Changes', () => {
    it('reloads metadata when sample path changes', async () => {
      const { rerender } = render(<SampleTechnicalDetails sample={defaultSample} />);

      await waitFor(() => {
        expect(window.electronAPI.readAudioMetadata).toHaveBeenCalledWith(defaultSample.path);
      });

      const newSample = createMockSample({
        name: 'snare.wav',
        path: '/test/Project01/snare.wav',
        size: 102400,
      });

      rerender(<SampleTechnicalDetails sample={newSample} />);

      await waitFor(() => {
        expect(window.electronAPI.readAudioMetadata).toHaveBeenCalledWith(newSample.path);
      });

      expect(window.electronAPI.readAudioMetadata).toHaveBeenCalledTimes(2);
    });

    it('displays updated file path when sample changes', async () => {
      const { rerender } = render(<SampleTechnicalDetails sample={defaultSample} />);

      await waitFor(() => {
        expect(screen.getByTestId('file-path')).toHaveTextContent('/test/Project01/kick.wav');
      });

      const newSample = createMockSample({
        name: 'snare.wav',
        path: '/test/Project01/snare.wav',
        size: 102400,
      });

      rerender(<SampleTechnicalDetails sample={newSample} />);

      await waitFor(() => {
        expect(screen.getByTestId('file-path')).toHaveTextContent('/test/Project01/snare.wav');
      });
    });

    it('displays updated file size when sample changes', async () => {
      const { rerender } = render(<SampleTechnicalDetails sample={defaultSample} />);

      await waitFor(() => {
        expect(screen.getByTestId('file-size')).toHaveTextContent('200.0 KB');
      });

      const newSample = createMockSample({
        name: 'snare.wav',
        path: '/test/Project01/snare.wav',
        size: 51200, // 50 KB
      });

      rerender(<SampleTechnicalDetails sample={newSample} />);

      await waitFor(() => {
        expect(screen.getByTestId('file-size')).toHaveTextContent('50.0 KB');
      });
    });
  });
});
