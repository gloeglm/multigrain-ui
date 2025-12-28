import { describe, it, expect, beforeEach, vi } from 'vitest';
import { vol } from 'memfs';
import { extractSamplesFromPreset } from './presetParser';

// Mock fs with memfs
vi.mock('node:fs/promises', () => ({
  default: vol.promises,
  ...vol.promises,
}));

describe('Preset Parser', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('extractSamplesFromPreset', () => {
    it('should extract sample names from a .mgp preset file', async () => {
      // Create a mock .mgp file with 8 sample references
      const mgpBuffer = createMockMGPFile([
        '/PROJECT/sample1.wav',
        '/WAVS/sample2.wav',
        '/RECS/sample3.wav',
        '/PROJECT/sample4.wav',
        '/WAVS/sample5.wav',
        '/RECS/sample6.wav',
        '/PROJECT/sample7.wav',
        '/WAVS/sample8.wav',
      ]);

      vol.fromJSON({
        '/test/preset.mgp': mgpBuffer,
      });

      const samples = await extractSamplesFromPreset('/test/preset.mgp');

      // Should extract exactly 8 samples
      expect(samples).toHaveLength(8);

      // Should strip folder prefixes
      expect(samples).toEqual([
        'sample1.wav',
        'sample2.wav',
        'sample3.wav',
        'sample4.wav',
        'sample5.wav',
        'sample6.wav',
        'sample7.wav',
        'sample8.wav',
      ]);
    });

    it('should handle presets with fewer than 8 samples', async () => {
      // Create a preset with only 3 samples
      const mgpBuffer = createMockMGPFile([
        '/PROJECT/sample1.wav',
        '/WAVS/sample2.wav',
        '/RECS/sample3.wav',
      ]);

      vol.fromJSON({
        '/test/preset.mgp': mgpBuffer,
      });

      const samples = await extractSamplesFromPreset('/test/preset.mgp');

      expect(samples).toHaveLength(3);
      expect(samples).toEqual(['sample1.wav', 'sample2.wav', 'sample3.wav']);
    });

    it('should handle presets with more than 8 samples by taking first 8', async () => {
      // Create a preset with 10 samples
      const mgpBuffer = createMockMGPFile([
        '/PROJECT/sample1.wav',
        '/PROJECT/sample2.wav',
        '/PROJECT/sample3.wav',
        '/PROJECT/sample4.wav',
        '/PROJECT/sample5.wav',
        '/PROJECT/sample6.wav',
        '/PROJECT/sample7.wav',
        '/PROJECT/sample8.wav',
        '/PROJECT/sample9.wav',
        '/PROJECT/sample10.wav',
      ]);

      vol.fromJSON({
        '/test/preset.mgp': mgpBuffer,
      });

      const samples = await extractSamplesFromPreset('/test/preset.mgp');

      // Should only return first 8
      expect(samples).toHaveLength(8);
      expect(samples[7]).toBe('sample8.wav');
    });

    it('should handle sample names without folder prefix', async () => {
      // Some presets might have just the filename
      const mgpBuffer = createMockMGPFile(['sample1.wav', 'sample2.wav', 'sample3.wav']);

      vol.fromJSON({
        '/test/preset.mgp': mgpBuffer,
      });

      const samples = await extractSamplesFromPreset('/test/preset.mgp');

      expect(samples).toEqual(['sample1.wav', 'sample2.wav', 'sample3.wav']);
    });

    it('should handle empty preset files', async () => {
      // Create an empty buffer
      const mgpBuffer = Buffer.alloc(16384); // .mgp files are 16KB

      vol.fromJSON({
        '/test/preset.mgp': mgpBuffer,
      });

      const samples = await extractSamplesFromPreset('/test/preset.mgp');

      expect(samples).toEqual([]);
    });

    it('should throw error for non-existent files', async () => {
      await expect(extractSamplesFromPreset('/test/nonexistent.mgp')).rejects.toThrow();
    });

    it('should ignore non-printable characters between samples', async () => {
      // Create a buffer with non-printable bytes between samples
      const buffer = Buffer.alloc(16384);
      let offset = 0;

      // Add first sample with null terminator
      buffer.write('/PROJECT/sample1.wav\0', offset, 'ascii');
      offset += 22;

      // Add some non-printable garbage
      for (let i = 0; i < 10; i++) {
        buffer[offset++] = Math.floor(Math.random() * 32); // Non-printable
      }

      // Add second sample
      buffer.write('/WAVS/sample2.wav\0', offset, 'ascii');

      vol.fromJSON({
        '/test/preset.mgp': buffer,
      });

      const samples = await extractSamplesFromPreset('/test/preset.mgp');

      expect(samples).toContain('sample1.wav');
      expect(samples).toContain('sample2.wav');
    });

    it('should handle case-insensitive .wav extension', async () => {
      const mgpBuffer = createMockMGPFile([
        '/PROJECT/SAMPLE1.WAV',
        '/WAVS/sample2.Wav',
        '/RECS/sample3.wAv',
      ]);

      vol.fromJSON({
        '/test/preset.mgp': mgpBuffer,
      });

      const samples = await extractSamplesFromPreset('/test/preset.mgp');

      expect(samples).toHaveLength(3);
      expect(samples).toContain('SAMPLE1.WAV');
      expect(samples).toContain('sample2.Wav');
      expect(samples).toContain('sample3.wAv');
    });
  });
});

/**
 * Create a mock .mgp file buffer with sample references
 * .mgp files are 16KB binary files with null-terminated ASCII strings
 */
function createMockMGPFile(samplePaths: string[]): Buffer {
  const buffer = Buffer.alloc(16384); // .mgp files are 16KB fixed size
  let offset = 0;

  // Write each sample path as null-terminated string
  for (const path of samplePaths) {
    if (offset + path.length + 1 > buffer.length) {
      break; // Don't overflow the buffer
    }

    // Write the path
    buffer.write(path, offset, 'ascii');
    offset += path.length;

    // Write null terminator
    buffer[offset++] = 0;

    // Add some padding bytes to simulate real .mgp structure
    offset += 10;
  }

  return buffer;
}
