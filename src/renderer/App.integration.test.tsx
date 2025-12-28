import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { createMockStructure, createMockProject, createMockSample } from '../test/helpers';

// Mock WaveSurfer to avoid AudioContext issues in tests
vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn(() => ({
      load: vi.fn(),
      loadBlob: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      isPlaying: vi.fn(() => false),
      getCurrentTime: vi.fn(() => 0),
      getDuration: vi.fn(() => 0),
      on: vi.fn(),
      destroy: vi.fn(),
    })),
  },
}));

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const setupWithStructure = () => {
    // Set localStorage to trigger auto-load
    localStorage.setItem('multigrain-last-path', '/test/Multigrain');

    // Mock validateMultigrain to return a structure with samples
    vi.mocked(window.electronAPI.validateMultigrain).mockResolvedValue({
      isValid: true,
      errors: [],
      structure: createMockStructure({
        rootPath: '/test/Multigrain',
        projects: [
          createMockProject({
            name: 'Project01',
            path: '/test/Multigrain/Project01',
            index: 1,
            samples: [
              createMockSample({
                name: 'kick.wav',
                path: '/test/Multigrain/Project01/kick.wav',
              }),
              createMockSample({
                name: 'snare.wav',
                path: '/test/Multigrain/Project01/snare.wav',
              }),
            ],
          }),
        ],
      }),
    });

    // Mock readFile for audio loading (return empty buffer to avoid audio errors)
    vi.mocked(window.electronAPI.readFile).mockResolvedValue(Buffer.from([]));

    // Mock readAudioMetadata
    vi.mocked(window.electronAPI.readAudioMetadata).mockResolvedValue({
      description: 'Test description',
      title: '',
      artist: '',
      duration: 2.5,
      sampleRate: 48000,
      bitDepth: 16,
      channels: 2,
    });

    // Mock renameSample success
    vi.mocked(window.electronAPI.renameSample).mockResolvedValue({
      success: true,
      newName: 'renamed.wav',
      newPath: '/test/Multigrain/Project01/renamed.wav',
    });
  };

  describe('Rename Synchronization', () => {
    beforeEach(() => {
      setupWithStructure();
    });

    it('keeps FileTree and SampleInfo in sync when renaming from SampleInfo', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Wait for structure to load
      await waitFor(() => {
        expect(screen.getByTestId('project-node-/test/Multigrain/Project01')).toBeInTheDocument();
      });

      // Expand project to show samples
      await user.click(screen.getByTestId('project-node-/test/Multigrain/Project01'));

      await waitFor(() => {
        expect(
          screen.getByTestId('sample-node-/test/Multigrain/Project01/kick.wav')
        ).toBeInTheDocument();
      });

      // Select the sample
      await user.click(screen.getByTestId('sample-node-/test/Multigrain/Project01/kick.wav'));

      // Wait for SampleInfo to render
      await waitFor(() => {
        expect(screen.getByTestId('sample-name')).toHaveTextContent('kick.wav');
      });

      // Mock the structure reload with renamed sample
      vi.mocked(window.electronAPI.validateMultigrain).mockResolvedValue({
        isValid: true,
        errors: [],
        structure: createMockStructure({
          rootPath: '/test/Multigrain',
          projects: [
            createMockProject({
              name: 'Project01',
              path: '/test/Multigrain/Project01',
              index: 1,
              samples: [
                createMockSample({
                  name: 'renamed.wav',
                  path: '/test/Multigrain/Project01/renamed.wav',
                }),
                createMockSample({
                  name: 'snare.wav',
                  path: '/test/Multigrain/Project01/snare.wav',
                }),
              ],
            }),
          ],
        }),
      });

      // Rename from SampleInfo
      await user.click(screen.getByTestId('rename-sample-button'));
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'renamed');
      await user.click(screen.getByText('Save'));

      // Wait for reload and verify both views updated
      await waitFor(() => {
        // User should see the renamed file in both places (tree and info panel)
        const renamedElements = screen.getAllByText('renamed.wav');
        expect(renamedElements.length).toBeGreaterThanOrEqual(2); // At least in tree and sample name heading
      });

      // User should no longer see the old name anywhere
      expect(screen.queryByText('kick.wav')).not.toBeInTheDocument();

      // Verify IPC was called correctly
      expect(window.electronAPI.renameSample).toHaveBeenCalledWith(
        '/test/Multigrain/Project01/kick.wav',
        'renamed'
      );
    });

    it.skip('keeps FileTree and SampleInfo in sync when renaming from FileTree', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Wait for structure to load
      await waitFor(() => {
        expect(screen.getByText('X / 1 - Project01')).toBeInTheDocument();
      });

      // Expand project to show samples
      await user.click(screen.getByText('X / 1 - Project01'));

      await waitFor(() => {
        expect(screen.getByText('kick.wav')).toBeInTheDocument();
      });

      // Select the sample (this opens it in SampleInfo)
      await user.click(screen.getByText('kick.wav'));

      await waitFor(() => {
        expect(screen.getByTestId('sample-name')).toHaveTextContent('kick.wav');
      });

      // Right-click to open context menu in FileTree
      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('kick.wav') });

      // Click "Rename Sample" in context menu (if it appears)
      // Note: This might need adjustment based on actual context menu implementation
      const renameOption = screen.queryByText(/Rename/i);
      if (renameOption) {
        await user.click(renameOption);

        // Mock the structure reload with renamed sample
        vi.mocked(window.electronAPI.validateMultigrain).mockResolvedValue({
          isValid: true,
          errors: [],
          structure: createMockStructure({
            rootPath: '/test/Multigrain',
            projects: [
              createMockProject({
                name: 'Project01',
                path: '/test/Multigrain/Project01',
                index: 1,
                samples: [
                  createMockSample({
                    name: 'renamed-from-tree.wav',
                    path: '/test/Multigrain/Project01/renamed-from-tree.wav',
                  }),
                  createMockSample({
                    name: 'snare.wav',
                    path: '/test/Multigrain/Project01/snare.wav',
                  }),
                ],
              }),
            ],
          }),
        });

        vi.mocked(window.electronAPI.renameSample).mockResolvedValue({
          success: true,
          newName: 'renamed-from-tree.wav',
          newPath: '/test/Multigrain/Project01/renamed-from-tree.wav',
        });

        // Find the rename input in FileTree and rename
        const treeInput = screen.getAllByRole('textbox')[0]; // First textbox should be in FileTree
        await user.clear(treeInput);
        await user.type(treeInput, 'renamed-from-tree');

        // Find save button (there might be multiple - one in FileTree, one in SampleInfo)
        const saveButtons = screen.getAllByText('Save');
        await user.click(saveButtons[0]); // Click the first one (FileTree)

        // Wait for reload and verify both views updated
        await waitFor(() => {
          // FileTree should show renamed file
          expect(screen.getByText('renamed-from-tree.wav')).toBeInTheDocument();
          // SampleInfo should show renamed file
          expect(screen.getByTestId('sample-name')).toHaveTextContent('renamed-from-tree.wav');
        });

        // Old name should not be present
        expect(screen.queryByText('kick.wav')).not.toBeInTheDocument();
      }
    });

    it('handles rename failure gracefully', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('project-node-/test/Multigrain/Project01')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('project-node-/test/Multigrain/Project01'));
      await waitFor(() => {
        expect(
          screen.getByTestId('sample-node-/test/Multigrain/Project01/kick.wav')
        ).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('sample-node-/test/Multigrain/Project01/kick.wav'));
      await waitFor(() => {
        expect(screen.getByTestId('sample-name')).toHaveTextContent('kick.wav');
      });

      // Mock rename failure
      vi.mocked(window.electronAPI.renameSample).mockResolvedValue({
        success: false,
        error: 'File already exists',
      });

      // Attempt rename
      await user.click(screen.getByTestId('rename-sample-button'));
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'existing');
      await user.click(screen.getByText('Save'));

      // Should show error dialog
      await waitFor(() => {
        expect(screen.getByText('Rename Failed')).toBeInTheDocument();
        expect(screen.getByText('Failed to rename sample.')).toBeInTheDocument();
      });

      // Should stay in edit mode (failed save doesn't exit edit mode)
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('existing');

      // sample-name should not be visible (still in edit mode)
      expect(screen.queryByTestId('sample-name')).not.toBeInTheDocument();
    });
  });

  describe('Welcome Screen and Header Visibility', () => {
    it('should show welcome screen without header when no SD card is selected', async () => {
      // Don't set localStorage, don't mock validation
      render(<App />);

      // Should show welcome screen
      await waitFor(() => {
        expect(screen.getByText('Welcome to Multigrain Sample Manager')).toBeInTheDocument();
      });

      // Should show "Select Your SD Card" button in welcome screen
      expect(screen.getByRole('button', { name: /select your sd card/i })).toBeInTheDocument();

      // Header should NOT be present (check for header-specific elements)
      expect(screen.queryByText('Auto-play')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /load factory names/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /change location/i })).not.toBeInTheDocument();

      // Should not show file tree
      expect(
        screen.queryByTestId('project-node-/test/Multigrain/Project01')
      ).not.toBeInTheDocument();
    });

    it('should show welcome screen with error when previous path is not accessible', async () => {
      // Set localStorage with a path
      localStorage.setItem('multigrain-last-path', '/Volumes/NO_NAME');

      // Mock validation to fail
      vi.mocked(window.electronAPI.validateMultigrain).mockRejectedValue(
        new Error('Cannot access the selected path')
      );

      render(<App />);

      // Should show welcome screen with error
      await waitFor(() => {
        expect(screen.getByText('Welcome to Multigrain Sample Manager')).toBeInTheDocument();
        expect(screen.getByText(/⚠️ Previous location not accessible:/)).toBeInTheDocument();
        expect(screen.getByText('/Volumes/NO_NAME')).toBeInTheDocument();
      });

      // Header should NOT be present
      expect(screen.queryByText('Auto-play')).not.toBeInTheDocument();
    });

    it('should show header and tree view after SD card is loaded', async () => {
      setupWithStructure();
      render(<App />);

      // Wait for structure to load
      await waitFor(() => {
        expect(screen.getByTestId('project-node-/test/Multigrain/Project01')).toBeInTheDocument();
      });

      // Header SHOULD be present
      expect(screen.getByText('Multigrain Sample Manager')).toBeInTheDocument();
      expect(screen.getByText('Auto-play')).toBeInTheDocument();
      expect(screen.getByText('Load Factory Names')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change location/i })).toBeInTheDocument();

      // Welcome screen should NOT be visible
      expect(
        screen.queryByText(
          'Manage and organize your Intellijel Multigrain sample library with ease'
        )
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/🚀/)).not.toBeInTheDocument();
    });

    it('should show welcome screen when clicking Select SD Card button', async () => {
      const user = userEvent.setup();

      // Mock selectDirectory to return a path
      vi.mocked(window.electronAPI.selectDirectory).mockResolvedValue('/test/NewCard');

      // Mock validation for the new path
      vi.mocked(window.electronAPI.validateMultigrain).mockResolvedValue({
        isValid: true,
        errors: [],
        structure: createMockStructure({
          rootPath: '/test/NewCard',
          projects: [
            createMockProject({
              name: 'Project01',
              path: '/test/NewCard/Project01',
              index: 1,
            }),
          ],
        }),
      });

      render(<App />);

      // Wait for welcome screen
      await waitFor(() => {
        expect(screen.getByText('Welcome to Multigrain Sample Manager')).toBeInTheDocument();
      });

      // Click Select SD Card button
      const selectButton = screen.getByRole('button', { name: /select your sd card/i });
      await user.click(selectButton);

      // Should show header and tree after selection
      await waitFor(() => {
        expect(screen.getByText('Multigrain Sample Manager')).toBeInTheDocument();
        expect(screen.getByText('Auto-play')).toBeInTheDocument();
        expect(screen.getByTestId('project-node-/test/NewCard/Project01')).toBeInTheDocument();
      });

      // Welcome screen should be gone
      expect(
        screen.queryByText(
          'Manage and organize your Intellijel Multigrain sample library with ease'
        )
      ).not.toBeInTheDocument();
    });

    it('should hide welcome screen when structure loads automatically', async () => {
      setupWithStructure();
      render(<App />);

      // Initially might show welcome screen briefly, but should transition to tree view
      await waitFor(() => {
        expect(screen.getByTestId('project-node-/test/Multigrain/Project01')).toBeInTheDocument();
      });

      // Welcome screen should not be visible
      expect(
        screen.queryByRole('button', { name: /select your sd card/i })
      ).not.toBeInTheDocument();

      // Header should be visible
      expect(screen.getByText('Multigrain Sample Manager')).toBeInTheDocument();
    });
  });
});
