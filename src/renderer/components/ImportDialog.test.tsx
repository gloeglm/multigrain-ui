import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportDialog } from './ImportDialog';
import type { AudioAnalysis, ImportProgress, ImportResult } from '@shared/types/import';

describe('ImportDialog Component', () => {
  const mockOnClose = vi.fn();
  const mockOnImportComplete = vi.fn();
  const targetPath = '/test/Multigrain/Project01';

  // Mock data
  const mockAnalyses: AudioAnalysis[] = [
    {
      path: '/source/kick.wav',
      filename: 'kick.wav',
      isValid: true,
      needsConversion: false,
      willBeTrimmed: false,
      issues: [],
      metadata: {
        duration: 2.5,
        sampleRate: 48000,
        bitDepth: 16,
        channels: 2,
        format: 'WAV',
      },
    },
    {
      path: '/source/snare.wav',
      filename: 'snare.wav',
      isValid: true,
      needsConversion: true,
      willBeTrimmed: false,
      issues: [
        {
          type: 'sampleRate',
          message: 'Sample rate is 44100 Hz, will be converted to 48000 Hz',
          severity: 'warning',
        },
      ],
      metadata: {
        duration: 1.2,
        sampleRate: 44100,
        bitDepth: 16,
        channels: 2,
        format: 'WAV',
      },
    },
  ];

  const mockImportResult: ImportResult = {
    success: true,
    imported: 2,
    failed: 0,
    trimmed: [],
    renamed: [],
    errors: [],
  };

  let mockProgressCleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock selectImportFiles - returns selected files
    vi.mocked(window.electronAPI.selectImportFiles).mockResolvedValue([
      '/source/kick.wav',
      '/source/snare.wav',
    ]);

    // Mock validateImportFiles - returns analysis results
    vi.mocked(window.electronAPI.validateImportFiles).mockResolvedValue({
      analyses: mockAnalyses,
      storageInfo: {
        currentCount: 5,
        limit: 128,
        availableSlots: 123,
        wouldExceed: false,
      },
    });

    // Mock executeImport - returns success result
    vi.mocked(window.electronAPI.executeImport).mockResolvedValue(mockImportResult);

    // Mock onImportProgress - returns cleanup function
    mockProgressCleanup = vi.fn();
    vi.mocked(window.electronAPI.onImportProgress).mockReturnValue(mockProgressCleanup);
  });

  afterEach(() => {
    mockProgressCleanup = undefined;
  });

  describe('Dialog Visibility', () => {
    it('does not render when isOpen is false', () => {
      render(
        <ImportDialog
          isOpen={false}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      expect(screen.queryByText(/Import Samples to/)).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', async () => {
      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Import Samples to Project01/)).toBeInTheDocument();
      });
    });
  });

  describe('File Selection Stage', () => {
    it('automatically triggers file selection when opened', async () => {
      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(window.electronAPI.selectImportFiles).toHaveBeenCalled();
      });
    });

    it('closes dialog if no files are selected', async () => {
      vi.mocked(window.electronAPI.selectImportFiles).mockResolvedValue([]);

      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('closes dialog if file selection is cancelled', async () => {
      vi.mocked(window.electronAPI.selectImportFiles).mockResolvedValue(null as any);

      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Validation Stage', () => {
    it('displays file validation results', async () => {
      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('kick.wav')).toBeInTheDocument();
        expect(screen.getByText('snare.wav')).toBeInTheDocument();
      });

      expect(screen.getByText('2 file(s) ready to import')).toBeInTheDocument();
    });

    it('displays storage information', async () => {
      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Storage: 5\/128 samples/)).toBeInTheDocument();
        expect(screen.getByText(/123 slot\(s\) available/)).toBeInTheDocument();
      });
    });

    it('shows warning when storage limit would be exceeded', async () => {
      vi.mocked(window.electronAPI.validateImportFiles).mockResolvedValue({
        analyses: mockAnalyses,
        storageInfo: {
          currentCount: 127,
          limit: 128,
          availableSlots: 1,
          wouldExceed: true,
        },
      });

      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Warning: Not all files can be imported due to storage limit/)
        ).toBeInTheDocument();
      });
    });

    it('displays conversion warnings for files that need conversion', async () => {
      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Sample rate is 44100 Hz, will be converted to 48000 Hz/)
        ).toBeInTheDocument();
      });
    });

    it('allows canceling during validation stage', async () => {
      const user = userEvent.setup();

      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('starts import when Import button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Import 2 File(s)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Import 2 File(s)'));

      expect(window.electronAPI.executeImport).toHaveBeenCalledWith(
        ['/source/kick.wav', '/source/snare.wav'],
        targetPath
      );
    });

    it('disables Import button when no valid files', async () => {
      vi.mocked(window.electronAPI.validateImportFiles).mockResolvedValue({
        analyses: [
          {
            ...mockAnalyses[0],
            isValid: false,
            issues: [
              {
                type: 'format',
                message: 'Unsupported format',
                severity: 'error',
              },
            ],
          },
        ],
        storageInfo: {
          currentCount: 5,
          limit: 128,
          availableSlots: 123,
          wouldExceed: false,
        },
      });

      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        const importButton = screen.getByText('Import 0 File(s)');
        expect(importButton).toBeDisabled();
      });
    });
  });

  describe('Progress Stage', () => {
    it('displays progress information during import', async () => {
      const user = userEvent.setup();
      let progressCallback: ((progress: ImportProgress) => void) | undefined;
      let resolveImport: ((value: ImportResult) => void) | undefined;

      // Make executeImport return a promise we can control
      const importPromise = new Promise<ImportResult>((resolve) => {
        resolveImport = resolve;
      });
      vi.mocked(window.electronAPI.executeImport).mockReturnValue(importPromise);

      vi.mocked(window.electronAPI.onImportProgress).mockImplementation((callback) => {
        progressCallback = callback;
        return vi.fn();
      });

      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Import 2 File(s)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Import 2 File(s)'));

      // Wait for progress stage to be active
      await waitFor(() => {
        expect(window.electronAPI.onImportProgress).toHaveBeenCalled();
      });

      // Simulate progress update
      progressCallback?.({
        currentFile: 'kick.wav',
        currentIndex: 0,
        totalFiles: 2,
        percent: 50,
        stage: 'converting',
      });

      await waitFor(() => {
        expect(screen.getByText('Converting...')).toBeInTheDocument();
        expect(screen.getByText('kick.wav')).toBeInTheDocument();
        expect(screen.getByText('1 of 2')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
      });

      // Complete the import to avoid hanging
      resolveImport?.(mockImportResult);

      await waitFor(() => {
        expect(screen.getByText('✓ Import Complete')).toBeInTheDocument();
      });
    });
  });

  describe('Results Stage', () => {
    it('displays success result', async () => {
      const user = userEvent.setup();

      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Import 2 File(s)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Import 2 File(s)'));

      await waitFor(() => {
        expect(screen.getByText('✓ Import Complete')).toBeInTheDocument();
        expect(screen.getByText(/2 file\(s\) imported successfully/)).toBeInTheDocument();
      });
    });

    it('displays error result', async () => {
      const user = userEvent.setup();

      vi.mocked(window.electronAPI.executeImport).mockResolvedValue({
        success: false,
        imported: 1,
        failed: 1,
        trimmed: [],
        renamed: [],
        errors: [
          {
            file: 'snare.wav',
            error: 'Failed to convert file',
          },
        ],
      });

      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Import 2 File(s)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Import 2 File(s)'));

      await waitFor(() => {
        expect(screen.getByText('⚠ Import Completed with Errors')).toBeInTheDocument();
        expect(
          screen.getByText(/1 file\(s\) imported successfully, 1 file\(s\) failed/)
        ).toBeInTheDocument();
      });
    });

    it('calls onImportComplete when closing after successful import', async () => {
      const user = userEvent.setup();

      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Import 2 File(s)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Import 2 File(s)'));

      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Close'));

      expect(mockOnImportComplete).toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onClose when closing after failed import with no successful imports', async () => {
      const user = userEvent.setup();

      vi.mocked(window.electronAPI.executeImport).mockResolvedValue({
        success: false,
        imported: 0,
        failed: 2,
        trimmed: [],
        renamed: [],
        errors: [
          {
            file: 'All files',
            error: 'Failed to import',
          },
        ],
      });

      render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Import 2 File(s)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Import 2 File(s)'));

      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Close'));

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnImportComplete).not.toHaveBeenCalled();
    });
  });

  describe('State Reset on Reopen (Bug Fix)', () => {
    it('resets to file selection stage when dialog is reopened after completing import', async () => {
      const user = userEvent.setup();

      // First render - open the dialog
      const { rerender } = render(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      // Wait for validation stage
      await waitFor(() => {
        expect(screen.getByText('Import 2 File(s)')).toBeInTheDocument();
      });

      // Start import
      await user.click(screen.getByText('Import 2 File(s)'));

      // Wait for results stage
      await waitFor(() => {
        expect(screen.getByText('✓ Import Complete')).toBeInTheDocument();
      });

      // Close dialog
      rerender(
        <ImportDialog
          isOpen={false}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      // Verify dialog is closed
      expect(screen.queryByText('✓ Import Complete')).not.toBeInTheDocument();

      // Clear the mock calls from first import
      vi.clearAllMocks();

      // Mock new files for second import
      vi.mocked(window.electronAPI.selectImportFiles).mockResolvedValue(['/source/hat.wav']);

      vi.mocked(window.electronAPI.validateImportFiles).mockResolvedValue({
        analyses: [
          {
            path: '/source/hat.wav',
            filename: 'hat.wav',
            isValid: true,
            needsConversion: false,
            willBeTrimmed: false,
            issues: [],
            metadata: {
              duration: 1.0,
              sampleRate: 48000,
              bitDepth: 16,
              channels: 2,
              format: 'WAV',
            },
          },
        ],
        storageInfo: {
          currentCount: 7, // Updated count after previous import
          limit: 128,
          availableSlots: 121,
          wouldExceed: false,
        },
      });

      // Reopen dialog
      rerender(
        <ImportDialog
          isOpen={true}
          targetPath={targetPath}
          onClose={mockOnClose}
          onImportComplete={mockOnImportComplete}
        />
      );

      // CRITICAL: Verify that selectImportFiles is called again
      // This proves the dialog reset to 'selecting' stage instead of
      // staying in 'results' stage
      await waitFor(() => {
        expect(window.electronAPI.selectImportFiles).toHaveBeenCalled();
      });

      // Verify we're seeing the new file selection results
      await waitFor(() => {
        expect(screen.getByText('hat.wav')).toBeInTheDocument();
        expect(screen.getByText('Import 1 File(s)')).toBeInTheDocument();
      });

      // Verify we're NOT seeing the old success message
      expect(screen.queryByText('✓ Import Complete')).not.toBeInTheDocument();
      expect(screen.queryByText(/2 file\(s\) imported successfully/)).not.toBeInTheDocument();
    });
  });
});
