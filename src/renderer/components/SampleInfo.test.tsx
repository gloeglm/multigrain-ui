import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SampleInfo } from './SampleInfo';
import { createMockSample } from '../../test/helpers';
import { ErrorDialogProvider } from '../contexts/ErrorDialogContext';

// Helper to render with ErrorDialogProvider
const renderWithProvider = (component: React.ReactElement) => {
  return render(<ErrorDialogProvider>{component}</ErrorDialogProvider>);
};

describe('SampleInfo Component', () => {
  const mockOnRenameComplete = vi.fn();
  const defaultSample = createMockSample({
    name: 'test-sample.wav',
    path: '/test/Project01/test-sample.wav',
    size: 1024000, // 1000 KB
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock readAudioMetadata to return metadata with description
    vi.mocked(window.electronAPI.readAudioMetadata).mockResolvedValue({
      description: 'Test description',
      title: '',
      artist: '',
      duration: 2.5,
      sampleRate: 48000,
      bitDepth: 16,
      channels: 2,
    });

    // Mock writeAudioMetadata to return success/error result
    vi.mocked(window.electronAPI.writeAudioMetadata).mockResolvedValue({
      success: true,
    });

    // Mock renameSample to return success result
    vi.mocked(window.electronAPI.renameSample).mockResolvedValue({
      success: true,
      newName: 'renamed.wav',
      newPath: '/test/Project01/renamed.wav',
    });
  });

  describe('Basic Rendering', () => {
    it('renders sample name', async () => {
      renderWithProvider(<SampleInfo sample={defaultSample} />);
      expect(screen.getByTestId('sample-name')).toHaveTextContent('test-sample.wav');

      // Wait for async metadata loading to complete
      await waitFor(() => {
        expect(window.electronAPI.readAudioMetadata).toHaveBeenCalled();
      });
    });

    it('shows rename button', async () => {
      renderWithProvider(<SampleInfo sample={defaultSample} />);
      expect(screen.getByTestId('rename-sample-button')).toBeInTheDocument();

      // Wait for async metadata loading to complete
      await waitFor(() => {
        expect(window.electronAPI.readAudioMetadata).toHaveBeenCalled();
      });
    });

    it('shows edit description button', async () => {
      renderWithProvider(<SampleInfo sample={defaultSample} />);
      expect(screen.getByTestId('edit-description-button')).toBeInTheDocument();

      // Wait for async metadata loading to complete
      await waitFor(() => {
        expect(window.electronAPI.readAudioMetadata).toHaveBeenCalled();
      });
    });
  });

  describe('Description Loading', () => {
    it('loads and displays description', async () => {
      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await waitFor(() => {
        expect(window.electronAPI.readAudioMetadata).toHaveBeenCalledWith(defaultSample.path);
      });

      await waitFor(() => {
        expect(screen.getByText('Test description')).toBeInTheDocument();
      });
    });

    it('displays "No description" when description is empty', async () => {
      vi.mocked(window.electronAPI.readAudioMetadata).mockResolvedValue({
        description: '',
        title: '',
        artist: '',
        duration: 0,
        sampleRate: 48000,
        bitDepth: 16,
        channels: 2,
      });

      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await waitFor(() => {
        expect(screen.getByText(/No description/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sample Rename', () => {
    it('enters edit mode when rename button clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await user.click(screen.getByTestId('rename-sample-button'));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('test-sample'); // Extension stripped
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('strips .wav extension when entering edit mode', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await user.click(screen.getByTestId('rename-sample-button'));

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('test-sample');
    });

    it('allows editing the filename', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await user.click(screen.getByTestId('rename-sample-button'));
      const input = screen.getByRole('textbox');

      await user.clear(input);
      await user.type(input, 'new-name');

      expect(input).toHaveValue('new-name');
    });

    it('saves renamed file when save button clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <SampleInfo sample={defaultSample} onRenameComplete={mockOnRenameComplete} />
      );

      await user.click(screen.getByTestId('rename-sample-button'));
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'renamed');

      await user.click(screen.getByText('Save'));

      expect(window.electronAPI.renameSample).toHaveBeenCalledWith(
        '/test/Project01/test-sample.wav',
        'renamed'
      );

      await waitFor(() => {
        expect(mockOnRenameComplete).toHaveBeenCalledWith('/test/Project01/renamed.wav');
      });
    });

    it('saves on Enter key press', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <SampleInfo sample={defaultSample} onRenameComplete={mockOnRenameComplete} />
      );

      await user.click(screen.getByTestId('rename-sample-button'));
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'renamed{Enter}');

      expect(window.electronAPI.renameSample).toHaveBeenCalledWith(
        '/test/Project01/test-sample.wav',
        'renamed'
      );

      await waitFor(() => {
        expect(mockOnRenameComplete).toHaveBeenCalled();
      });
    });

    it('cancels edit mode when cancel button clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await user.click(screen.getByTestId('rename-sample-button'));
      await user.clear(screen.getByRole('textbox'));
      await user.type(screen.getByRole('textbox'), 'changed-name');

      await user.click(screen.getByText('Cancel'));

      // Should exit edit mode and not call rename
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByTestId('rename-sample-button')).toBeInTheDocument();
      expect(window.electronAPI.renameSample).not.toHaveBeenCalled();
    });

    it('cancels on Escape key press', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await user.click(screen.getByTestId('rename-sample-button'));
      await user.clear(screen.getByRole('textbox'));
      await user.type(screen.getByRole('textbox'), 'changed-name{Escape}');

      // Should exit edit mode and not call rename
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(window.electronAPI.renameSample).not.toHaveBeenCalled();
    });

    it('shows error message when rename fails', async () => {
      const user = userEvent.setup();
      vi.mocked(window.electronAPI.renameSample).mockResolvedValue({
        success: false,
        error: 'File already exists',
      });

      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await user.click(screen.getByTestId('rename-sample-button'));
      await user.clear(screen.getByRole('textbox'));
      await user.type(screen.getByRole('textbox'), 'existing');
      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Rename Failed')).toBeInTheDocument();
        expect(screen.getByText('Failed to rename sample.')).toBeInTheDocument();
      });
    });

    it('shows "Saving..." state during rename', async () => {
      const user = userEvent.setup();
      vi.mocked(window.electronAPI.renameSample).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  newName: 'renamed.wav',
                  newPath: '/test/renamed.wav',
                }),
              100
            )
          )
      );

      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await user.click(screen.getByTestId('rename-sample-button'));
      await user.clear(screen.getByRole('textbox'));
      await user.type(screen.getByRole('textbox'), 'renamed');
      await user.click(screen.getByText('Save'));

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('prevents empty filename submission', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await user.click(screen.getByTestId('rename-sample-button'));
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.click(screen.getByText('Save'));

      // Should not call rename with empty string
      expect(window.electronAPI.renameSample).not.toHaveBeenCalled();
    });
  });

  describe('Description Editing', () => {
    it('shows edit button for description', async () => {
      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await waitFor(() => {
        expect(screen.getByText('Description')).toBeInTheDocument();
      });

      expect(screen.getByTestId('edit-description-button')).toBeInTheDocument();
    });

    it('enters edit mode for description', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await waitFor(() => {
        expect(screen.getByTestId('description-text')).toHaveTextContent('Test description');
      });

      await user.click(screen.getByTestId('edit-description-button'));

      expect(screen.getByTestId('description-textarea')).toBeInTheDocument();
    });

    it('allows editing description', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await waitFor(() => {
        expect(screen.getByTestId('description-text')).toHaveTextContent('Test description');
      });

      await user.click(screen.getByTestId('edit-description-button'));

      const textarea = screen.getByTestId('description-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Updated description');

      expect(textarea).toHaveValue('Updated description');
    });

    it('saves description when save clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await waitFor(() => {
        expect(screen.getByTestId('description-text')).toHaveTextContent('Test description');
      });

      await user.click(screen.getByTestId('edit-description-button'));

      const textarea = screen.getByTestId('description-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Updated description');

      await user.click(screen.getByTestId('save-description-button'));

      await waitFor(() => {
        expect(window.electronAPI.writeAudioMetadata).toHaveBeenCalledWith(
          defaultSample.path,
          'Updated description'
        );
      });
    });

    it('shows error when description save fails', async () => {
      const user = userEvent.setup();
      vi.mocked(window.electronAPI.writeAudioMetadata).mockResolvedValue({
        success: false,
        error: 'Write failed',
      });

      renderWithProvider(<SampleInfo sample={defaultSample} />);

      await waitFor(() => {
        expect(screen.getByTestId('description-text')).toHaveTextContent('Test description');
      });

      await user.click(screen.getByTestId('edit-description-button'));

      const textarea = screen.getByTestId('description-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Updated');

      await user.click(screen.getByTestId('save-description-button'));

      await waitFor(() => {
        expect(screen.getByText('Save Failed')).toBeInTheDocument();
        expect(screen.getByText('Failed to save description.')).toBeInTheDocument();
      });
    });
  });

  describe('Component Updates', () => {
    it('updates display when sample prop changes', async () => {
      const { rerender } = renderWithProvider(<SampleInfo sample={defaultSample} />);

      expect(screen.getByText('test-sample.wav')).toBeInTheDocument();

      // Wait for initial metadata load
      await waitFor(() => {
        expect(window.electronAPI.readAudioMetadata).toHaveBeenCalledWith(defaultSample.path);
      });

      const newSample = createMockSample({
        name: 'different-sample.wav',
        path: '/test/Project01/different-sample.wav',
      });

      rerender(
        <ErrorDialogProvider>
          <SampleInfo sample={newSample} />
        </ErrorDialogProvider>
      );

      expect(screen.getByText('different-sample.wav')).toBeInTheDocument();
      expect(screen.queryByText('test-sample.wav')).not.toBeInTheDocument();

      // Wait for new metadata load to complete
      await waitFor(() => {
        expect(window.electronAPI.readAudioMetadata).toHaveBeenCalledWith(newSample.path);
      });
    });

    it('resets edit mode when sample changes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithProvider(<SampleInfo sample={defaultSample} />);

      // Wait for initial metadata load
      await waitFor(() => {
        expect(window.electronAPI.readAudioMetadata).toHaveBeenCalledWith(defaultSample.path);
      });

      // Enter edit mode
      await user.click(screen.getByTestId('rename-sample-button'));
      expect(screen.getByRole('textbox')).toBeInTheDocument();

      // Change sample
      const newSample = createMockSample({
        name: 'different-sample.wav',
        path: '/test/Project01/different-sample.wav',
      });
      rerender(
        <ErrorDialogProvider>
          <SampleInfo sample={newSample} />
        </ErrorDialogProvider>
      );

      // Edit mode should be reset
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByTestId('rename-sample-button')).toBeInTheDocument();

      // Wait for new metadata load to complete
      await waitFor(() => {
        expect(window.electronAPI.readAudioMetadata).toHaveBeenCalledWith(newSample.path);
      });
    });

    it('reloads metadata when sample changes', async () => {
      const { rerender } = renderWithProvider(<SampleInfo sample={defaultSample} />);

      await waitFor(() => {
        expect(window.electronAPI.readAudioMetadata).toHaveBeenCalledWith(defaultSample.path);
      });

      const newSample = createMockSample({
        name: 'different-sample.wav',
        path: '/test/Project02/different-sample.wav',
      });

      rerender(
        <ErrorDialogProvider>
          <SampleInfo sample={newSample} />
        </ErrorDialogProvider>
      );

      await waitFor(() => {
        expect(window.electronAPI.readAudioMetadata).toHaveBeenCalledWith(newSample.path);
      });

      expect(window.electronAPI.readAudioMetadata).toHaveBeenCalledTimes(2);
    });
  });
});
