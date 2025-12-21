import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

    // Mock alert
    global.alert = vi.fn();

    // Set localStorage to trigger auto-load
    localStorage.setItem('multigrain-last-path', '/test/Multigrain');

    // Mock validateMultigrain to return a structure with samples
    vi.mocked(window.electronAPI.validateMultigrain).mockResolvedValue({
      isValid: true,
      valid: true,
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
  });

  describe('Rename Synchronization', () => {
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
        expect(screen.getByTestId('sample-node-/test/Multigrain/Project01/kick.wav')).toBeInTheDocument();
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
        valid: true,
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
          valid: true,
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
        expect(screen.getByTestId('sample-node-/test/Multigrain/Project01/kick.wav')).toBeInTheDocument();
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

      // Should show error alert
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to rename sample: File already exists');
      });

      // Should stay in edit mode (failed save doesn't exit edit mode)
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('existing');

      // sample-name should not be visible (still in edit mode)
      expect(screen.queryByTestId('sample-name')).not.toBeInTheDocument();
    });
  });
});
