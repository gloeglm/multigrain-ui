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

vi.mock('node:fs/promises', () => ({
  default: vol.promises,
  ...vol.promises,
}));

// Mock music-metadata to avoid actual file parsing
vi.mock('music-metadata', () => ({
  parseFile: vi.fn(),
}));

// Import after mocks are set up
import { registerAudioHandlers } from './audio';

describe('Audio IPC Handlers', () => {
  let handlers: Map<string, any>;

  beforeEach(() => {
    vol.reset();
    handlers = new Map();

    // Capture registered handlers
    vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler: any) => {
      handlers.set(channel, handler);
    });

    // Register handlers
    registerAudioHandlers();
  });

  describe('WAV metadata writing', () => {
    it('should place INFO chunk AFTER data chunk for new metadata', async () => {
      // Create a minimal valid WAV file with just fmt and data chunks
      const wavBuffer = createMinimalWAV();
      vol.fromJSON({
        '/test.wav': wavBuffer,
      });

      // Get the writeMetadata handler
      const handler = handlers.get('audio:writeMetadata')!;
      expect(handler).toBeDefined();

      // Write metadata
      const result = await handler({} as any, '/test.wav', 'Test description');

      expect(result.success).toBe(true);

      // Read the modified file
      const modifiedBuffer = Buffer.from(vol.readFileSync('/test.wav') as Buffer);

      // Verify chunk order: fmt -> data -> INFO
      const chunks = parseWAVChunks(modifiedBuffer as Buffer);
      expect(chunks.length).toBeGreaterThanOrEqual(3);
      expect(chunks[0].id).toBe('fmt ');
      expect(chunks[1].id).toBe('data');
      expect(chunks[2].id).toBe('LIST');
    });

    it('should move INFO chunk AFTER data chunk when replacing existing metadata', async () => {
      // Create a WAV file with INFO chunk BEFORE data chunk (the problematic order)
      const wavBuffer = createWAVWithInfoBeforeData();
      vol.fromJSON({
        '/test.wav': wavBuffer,
      });

      // Get the writeMetadata handler
      const handler = handlers.get('audio:writeMetadata')!;

      // Write new metadata (should move INFO chunk to after data)
      const result = await handler({} as any, '/test.wav', 'New description');

      expect(result.success).toBe(true);

      // Read the modified file
      const modifiedBuffer = Buffer.from(vol.readFileSync('/test.wav') as Buffer);

      // Verify chunk order: fmt -> data -> INFO
      const chunks = parseWAVChunks(modifiedBuffer as Buffer);
      expect(chunks[0].id).toBe('fmt ');
      expect(chunks[1].id).toBe('data');
      expect(chunks[2].id).toBe('LIST');

      // Verify the INFO chunk contains the new description
      const infoChunk = chunks[2];
      const listType = modifiedBuffer.toString(
        'ascii',
        infoChunk.position + 8,
        infoChunk.position + 12
      );
      expect(listType).toBe('INFO');
    });

    it('should update RIFF size correctly after modifying chunks', async () => {
      const wavBuffer = createMinimalWAV();
      vol.fromJSON({
        '/test.wav': wavBuffer,
      });

      const handler = handlers.get('audio:writeMetadata')!;

      await handler({} as any, '/test.wav', 'Test description');

      const modifiedBuffer = Buffer.from(vol.readFileSync('/test.wav') as Buffer);

      // Check RIFF size field
      const declaredSize = (modifiedBuffer as Buffer).readUInt32LE(4);
      const actualSize = modifiedBuffer.length - 8; // Exclude RIFF header (8 bytes)

      expect(declaredSize).toBe(actualSize);
    });
  });
});

/**
 * Create a minimal valid WAV file with fmt and data chunks
 */
function createMinimalWAV(): Buffer {
  // Sample audio data (100 samples of silence at 48kHz, 16-bit, stereo)
  const sampleCount = 100;
  const dataSize = sampleCount * 2 * 2; // samples * channels * bytes per sample

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0, 4, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4); // File size - 8
  buffer.write('WAVE', 8, 4, 'ascii');

  // fmt chunk
  buffer.write('fmt ', 12, 4, 'ascii');
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // Audio format (1 = PCM)
  buffer.writeUInt16LE(2, 22); // Channels (2 = stereo)
  buffer.writeUInt32LE(48000, 24); // Sample rate
  buffer.writeUInt32LE(192000, 28); // Byte rate (48000 * 2 * 2)
  buffer.writeUInt16LE(4, 32); // Block align (2 * 2)
  buffer.writeUInt16LE(16, 34); // Bits per sample

  // data chunk
  buffer.write('data', 36, 4, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);
  // Audio data is zeros (silence)

  return buffer;
}

/**
 * Create a WAV file with INFO chunk BEFORE data chunk (problematic order)
 */
function createWAVWithInfoBeforeData(): Buffer {
  // Create INFO chunk
  const description = 'Old description';
  const descBuffer = Buffer.from(description, 'utf8');
  const descSize = descBuffer.length + (descBuffer.length % 2); // Add padding if odd
  const paddedDescBuffer = Buffer.alloc(descSize);
  descBuffer.copy(paddedDescBuffer);

  const infoChunkSize = 4 + 8 + descSize; // INFO + ICMT header + data
  const infoChunk = Buffer.alloc(8 + infoChunkSize);
  infoChunk.write('LIST', 0, 4, 'ascii');
  infoChunk.writeUInt32LE(infoChunkSize, 4);
  infoChunk.write('INFO', 8, 4, 'ascii');
  infoChunk.write('ICMT', 12, 4, 'ascii');
  infoChunk.writeUInt32LE(descBuffer.length, 16);
  paddedDescBuffer.copy(infoChunk, 20);

  // Sample audio data
  const sampleCount = 100;
  const dataSize = sampleCount * 2 * 2;

  const buffer = Buffer.alloc(44 + infoChunk.length + dataSize);

  // RIFF header
  buffer.write('RIFF', 0, 4, 'ascii');
  buffer.writeUInt32LE(36 + infoChunk.length + dataSize, 4);
  buffer.write('WAVE', 8, 4, 'ascii');

  // fmt chunk
  buffer.write('fmt ', 12, 4, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(2, 22); // Stereo
  buffer.writeUInt32LE(48000, 24);
  buffer.writeUInt32LE(192000, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);

  // INFO chunk (BEFORE data - the problematic order)
  infoChunk.copy(buffer, 36);

  // data chunk
  const dataPos = 36 + infoChunk.length;
  buffer.write('data', dataPos, 4, 'ascii');
  buffer.writeUInt32LE(dataSize, dataPos + 4);
  // Audio data is zeros

  return buffer;
}

/**
 * Parse WAV chunks from a buffer
 */
function parseWAVChunks(buffer: Buffer): Array<{ id: string; size: number; position: number }> {
  const chunks: Array<{ id: string; size: number; position: number }> = [];
  let position = 12; // Start after RIFF header

  while (position < buffer.length - 8) {
    const chunkId = buffer.toString('ascii', position, position + 4);
    const chunkSize = buffer.readUInt32LE(position + 4);

    chunks.push({ id: chunkId, size: chunkSize, position });

    position += 8 + chunkSize + (chunkSize % 2); // Account for padding
  }

  return chunks;
}
