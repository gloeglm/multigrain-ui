import { describe, it, expect, beforeEach, vi } from 'vitest';
import { vol } from 'memfs';
import { ipcMain } from 'electron';

// Mock electron
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

// Mock fs with memfs
vi.mock('node:fs', () => ({
  promises: vol.promises,
  default: { promises: vol.promises },
}));

// Import after mocks are set up
import { registerFileOperationsHandlers } from './fileOperations';

describe('fileOperations IPC Handlers', () => {
  let handlers: Map<string, any>;

  beforeEach(() => {
    vol.reset();
    handlers = new Map();

    // Capture registered handlers
    vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler: any) => {
      handlers.set(channel, handler);
    });

    // Register handlers
    registerFileOperationsHandlers();
  });

  describe('renameSample', () => {
    const channel = 'files:renameSample';

    beforeEach(() => {
      vol.fromJSON({
        '/test/sample.wav': 'audio data',
        '/test/existing.wav': 'existing file',
      });
    });

    it('renames sample successfully', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/sample.wav', 'renamed');

      expect(result.success).toBe(true);
      expect(result.newName).toBe('renamed.wav');
      expect(result.newPath).toBe('/test/renamed.wav');

      // Verify file was actually renamed
      const newFileExists = vol.existsSync('/test/renamed.wav');
      const oldFileExists = vol.existsSync('/test/sample.wav');
      expect(newFileExists).toBe(true);
      expect(oldFileExists).toBe(false);
    });

    it('adds .wav extension if missing', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/sample.wav', 'newname');

      expect(result.success).toBe(true);
      expect(result.newName).toBe('newname.wav');
    });

    it('preserves .wav extension if already present', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/sample.wav', 'newname.wav');

      expect(result.success).toBe(true);
      expect(result.newName).toBe('newname.wav');
    });

    it('rejects empty filename', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/sample.wav', '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('rejects whitespace-only filename', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/sample.wav', '   ');

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('rejects invalid characters', async () => {
      const handler = handlers.get(channel)!;
      const invalidNames = [
        'bad:name',
        'bad<name',
        'bad>name',
        'bad|name',
        'bad?name',
        'bad*name',
        'bad"name',
      ];

      for (const name of invalidNames) {
        const result = await handler(null, '/test/sample.wav', name);
        expect(result.success).toBe(false);
        expect(result.error).toContain('invalid characters');
      }
    });

    it('detects filename conflicts', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/sample.wav', 'existing');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('allows renaming to same name', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/sample.wav', 'sample.wav');

      expect(result.success).toBe(true);
    });

    it('rejects non-wav files', async () => {
      vol.fromJSON({
        '/test/document.txt': 'text content',
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/document.txt', 'renamed');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only .wav files');
    });

    it('rejects non-existent files', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/nonexistent.wav', 'renamed');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects directories', async () => {
      vol.fromJSON({
        '/test/dir': null,
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/dir', 'renamed');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not a file');
    });

    it('handles case-insensitive .WAV extension', async () => {
      vol.fromJSON({
        '/test/sample.WAV': 'audio data',
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/sample.WAV', 'renamed');

      expect(result.success).toBe(true);
      expect(result.newName).toBe('renamed.wav');
    });
  });

  describe('deleteSample', () => {
    const channel = 'files:deleteSample';

    beforeEach(() => {
      vol.fromJSON({
        '/test/sample.wav': 'audio data',
        '/test/document.txt': 'text content',
      });
    });

    it('deletes sample successfully', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/sample.wav');

      expect(result.success).toBe(true);

      // Verify file was actually deleted
      const fileExists = vol.existsSync('/test/sample.wav');
      expect(fileExists).toBe(false);
    });

    it('rejects non-wav files', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/document.txt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only .wav files');

      // Verify file was NOT deleted
      const fileExists = vol.existsSync('/test/document.txt');
      expect(fileExists).toBe(true);
    });

    it('rejects non-existent files', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/nonexistent.wav');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects directories', async () => {
      vol.fromJSON({
        '/test/dir': null,
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/dir');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not a file');
    });

    it('handles case-insensitive .WAV extension', async () => {
      vol.fromJSON({
        '/test/sample.WAV': 'audio data',
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/sample.WAV');

      expect(result.success).toBe(true);
    });
  });

  describe('deleteProject', () => {
    const channel = 'files:deleteProject';

    beforeEach(() => {
      vol.fromJSON({
        '/test/Project01/sample.wav': 'audio data',
        '/test/Project01/Preset01.mgp': 'preset data',
        '/test/Project01/Autosave.mgp': 'autosave data',
        '/test/NotAProject/file.txt': 'text',
      });
    });

    it('deletes project folder successfully', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/Project01');

      expect(result.success).toBe(true);

      // Verify folder was actually deleted
      const dirExists = vol.existsSync('/test/Project01');
      expect(dirExists).toBe(false);
    });

    it('deletes all contents recursively', async () => {
      const handler = handlers.get(channel)!;
      await handler(null, '/test/Project01');

      // Verify all files were deleted
      expect(vol.existsSync('/test/Project01/sample.wav')).toBe(false);
      expect(vol.existsSync('/test/Project01/Preset01.mgp')).toBe(false);
      expect(vol.existsSync('/test/Project01/Autosave.mgp')).toBe(false);
    });

    it('rejects folders not matching ProjectXX pattern', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/NotAProject');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid project folder');

      // Verify folder was NOT deleted
      const dirExists = vol.existsSync('/test/NotAProject');
      expect(dirExists).toBe(true);
    });

    it('rejects files', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/Project01/sample.wav');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not a directory');
    });

    it('rejects non-existent paths', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/Project99');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('accepts all valid project folder names', async () => {
      // Create all 48 project folders
      const projectFolders: Record<string, null> = {};
      for (let i = 1; i <= 48; i++) {
        const name = `Project${i.toString().padStart(2, '0')}`;
        projectFolders[`/test/${name}`] = null;
      }
      vol.fromJSON(projectFolders);

      const handler = handlers.get(channel)!;

      // Test deleting a few
      for (const projectNum of [1, 10, 25, 48]) {
        const name = `Project${projectNum.toString().padStart(2, '0')}`;
        const result = await handler(null, `/test/${name}`);
        expect(result.success).toBe(true);
      }
    });

    it('accepts ProjectXX with any 2-digit number', async () => {
      // The regex /^Project\d{2}$/ matches any 2-digit number, including 00, 49, 99
      // This is a security check to ensure folder name format, not to enforce valid project indices
      vol.fromJSON({
        '/test/Project00': null,
        '/test/Project49': null,
        '/test/Project99': null,
      });

      const handler = handlers.get(channel)!;

      // These all match the pattern and should succeed
      const result00 = await handler(null, '/test/Project00');
      expect(result00.success).toBe(true);

      const result49 = await handler(null, '/test/Project49');
      expect(result49.success).toBe(true);

      const result99 = await handler(null, '/test/Project99');
      expect(result99.success).toBe(true);
    });

    it('rejects invalid project folder patterns', async () => {
      vol.fromJSON({
        '/test/Project1': null, // Missing leading zero
        '/test/Project001': null, // Too many digits
        '/test/ProjectAB': null, // Not digits
      });

      const handler = handlers.get(channel)!;

      const result1 = await handler(null, '/test/Project1');
      expect(result1.success).toBe(false);

      const result001 = await handler(null, '/test/Project001');
      expect(result001.success).toBe(false);

      const resultAB = await handler(null, '/test/ProjectAB');
      expect(resultAB.success).toBe(false);
    });
  });

  describe('deleteSamples (batch)', () => {
    const channel = 'files:deleteSamples';

    beforeEach(() => {
      vol.fromJSON({
        '/test/sample1.wav': 'audio 1',
        '/test/sample2.wav': 'audio 2',
        '/test/sample3.wav': 'audio 3',
        '/test/invalid.txt': 'text',
      });
    });

    it('deletes multiple samples successfully', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, ['/test/sample1.wav', '/test/sample2.wav']);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.total).toBe(2);
      expect(result.results).toHaveLength(2);

      result.results.forEach((r: { success: boolean }) => {
        expect(r.success).toBe(true);
      });
    });

    it('continues on errors and returns partial success', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, [
        '/test/sample1.wav',
        '/test/invalid.txt', // Will fail
        '/test/sample2.wav',
        '/test/nonexistent.wav', // Will fail
      ]);

      expect(result.success).toBe(true); // At least some succeeded
      expect(result.count).toBe(2); // 2 successful
      expect(result.total).toBe(4);
      expect(result.results).toHaveLength(4);

      // Check specific results
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
      expect(result.results[2].success).toBe(true);
      expect(result.results[3].success).toBe(false);
    });

    it('returns false when all operations fail', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, ['/test/invalid.txt', '/test/nonexistent.wav']);

      expect(result.success).toBe(false);
      expect(result.count).toBe(0);
      expect(result.total).toBe(2);
    });

    it('handles empty array', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, []);

      expect(result.success).toBe(false);
      expect(result.count).toBe(0);
      expect(result.total).toBe(0);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('previewNumberPrefixes', () => {
    const channel = 'files:previewNumberPrefixes';

    it('returns files to rename when unnumbered files exist', async () => {
      vol.fromJSON({
        '/test/folder/kick.wav': 'audio',
        '/test/folder/snare.wav': 'audio',
        '/test/folder/hihat.wav': 'audio',
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/folder');

      expect(result.success).toBe(true);
      expect(result.alreadyNumbered).toBe(0);
      expect(result.toRename).toHaveLength(3);
      // Files sorted alphabetically, numbered starting from 1
      expect(result.toRename[0]).toEqual({ oldName: 'hihat.wav', newName: '01_hihat.wav' });
      expect(result.toRename[1]).toEqual({ oldName: 'kick.wav', newName: '02_kick.wav' });
      expect(result.toRename[2]).toEqual({ oldName: 'snare.wav', newName: '03_snare.wav' });
    });

    it('renumbers existing files starting from 1', async () => {
      vol.fromJSON({
        '/test/folder/05_kick.wav': 'audio',
        '/test/folder/10_snare.wav': 'audio',
        '/test/folder/hihat.wav': 'audio', // unnumbered, goes last
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/folder');

      expect(result.success).toBe(true);
      expect(result.alreadyNumbered).toBe(2);
      // Numbered files keep order (by their number), unnumbered at end
      expect(result.toRename).toContainEqual({ oldName: '05_kick.wav', newName: '01_kick.wav' });
      expect(result.toRename).toContainEqual({ oldName: '10_snare.wav', newName: '02_snare.wav' });
      expect(result.toRename).toContainEqual({ oldName: 'hihat.wav', newName: '03_hihat.wav' });
    });

    it('detects existing numbering scheme', async () => {
      vol.fromJSON({
        '/test/folder/001_kick.wav': 'audio',
        '/test/folder/002_snare.wav': 'audio',
        '/test/folder/hihat.wav': 'audio',
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/folder');

      expect(result.success).toBe(true);
      expect(result.scheme.digits).toBe(3);
      expect(result.toRename).toContainEqual({ oldName: 'hihat.wav', newName: '003_hihat.wav' });
    });

    it('returns empty renames when files already correctly numbered', async () => {
      vol.fromJSON({
        '/test/folder/01_kick.wav': 'audio',
        '/test/folder/02_snare.wav': 'audio',
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/folder');

      expect(result.success).toBe(true);
      expect(result.toRename).toHaveLength(0);
    });

    it('fails for empty folder', async () => {
      vol.fromJSON({
        '/test/folder': null, // empty directory
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/folder');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No WAV files');
    });

    it('fails for non-existent path', async () => {
      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/nonexistent');

      expect(result.success).toBe(false);
    });

    it('fails for file path instead of directory', async () => {
      vol.fromJSON({
        '/test/file.wav': 'audio',
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/file.wav');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not a directory');
    });
  });

  describe('applyNumberPrefixes', () => {
    const channel = 'files:applyNumberPrefixes';

    it('renames unnumbered files with prefixes starting from 1', async () => {
      vol.fromJSON({
        '/test/folder/kick.wav': 'audio',
        '/test/folder/snare.wav': 'audio',
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/folder');

      expect(result.success).toBe(true);
      expect(result.renamed).toHaveLength(2);

      // Verify files were actually renamed (alphabetical order)
      expect(vol.existsSync('/test/folder/01_kick.wav')).toBe(true);
      expect(vol.existsSync('/test/folder/02_snare.wav')).toBe(true);
      expect(vol.existsSync('/test/folder/kick.wav')).toBe(false);
      expect(vol.existsSync('/test/folder/snare.wav')).toBe(false);
    });

    it('renumbers all files starting from 1', async () => {
      vol.fromJSON({
        '/test/folder/05_kick.wav': 'audio',
        '/test/folder/10_snare.wav': 'audio',
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/folder');

      expect(result.success).toBe(true);
      expect(result.renamed).toHaveLength(2);

      // Files renumbered to 01, 02 (preserving order)
      expect(vol.existsSync('/test/folder/01_kick.wav')).toBe(true);
      expect(vol.existsSync('/test/folder/02_snare.wav')).toBe(true);
    });

    it('returns message when all files already correctly numbered', async () => {
      vol.fromJSON({
        '/test/folder/01_kick.wav': 'audio',
        '/test/folder/02_snare.wav': 'audio',
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/folder');

      expect(result.success).toBe(true);
      expect(result.renamed).toHaveLength(0);
      expect(result.message).toContain('already have correct number prefixes');
    });

    it('places unnumbered files after numbered files', async () => {
      vol.fromJSON({
        '/test/folder/01_kick.wav': 'audio',
        '/test/folder/02_snare.wav': 'audio',
        '/test/folder/hihat.wav': 'audio', // unnumbered, goes after
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/folder');

      expect(result.success).toBe(true);
      // Only hihat needs renaming (kick and snare already correct)
      expect(result.renamed).toHaveLength(1);
      expect(result.renamed[0].newName).toBe('03_hihat.wav');
    });

    it('fails for empty folder', async () => {
      vol.fromJSON({
        '/test/folder': null,
      });

      const handler = handlers.get(channel)!;
      const result = await handler(null, '/test/folder');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No WAV files');
    });
  });
});
