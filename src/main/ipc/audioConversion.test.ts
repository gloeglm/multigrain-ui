// @vitest-environment node
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { parseFile, IAudioMetadata } from 'music-metadata';
import { analyzeAudioFile } from './audioConversion';

// Pass through to the real parser by default; individual tests can override the result
vi.mock('music-metadata', async (importOriginal) => {
  const actual = await importOriginal<typeof import('music-metadata')>();
  return { ...actual, parseFile: vi.fn(actual.parseFile) };
});

function chunk(id: string, body: Buffer): Buffer {
  const header = Buffer.alloc(8);
  header.write(id, 0, 'ascii');
  header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}

function buildWav(sampleRate: number, seconds: number, extraChunks: Buffer[] = []): Buffer {
  const fmt = Buffer.alloc(16);
  fmt.writeUInt16LE(1, 0); // PCM
  fmt.writeUInt16LE(2, 2); // stereo
  fmt.writeUInt32LE(sampleRate, 4);
  fmt.writeUInt32LE(sampleRate * 4, 8);
  fmt.writeUInt16LE(4, 12);
  fmt.writeUInt16LE(16, 14);
  const body = Buffer.concat([
    Buffer.from('WAVE', 'ascii'),
    chunk('fmt ', fmt),
    ...extraChunks,
    chunk('data', Buffer.alloc(sampleRate * 4 * seconds)),
  ]);
  const header = Buffer.alloc(8);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}

// LIST/INFO chunk with an IART sub-chunk followed by 2 bytes not covered by its declared size.
// music-metadata rejects this with "Illegal remaining size".
function malformedInfoChunk(): Buffer {
  const iart = Buffer.concat([
    chunk('IART', Buffer.from('Some Artist Name', 'ascii')),
    Buffer.alloc(2),
  ]);
  const isrc = chunk('ISRC', Buffer.from('Vendor\0\0', 'ascii'));
  return chunk('LIST', Buffer.concat([Buffer.from('INFO', 'ascii'), iart, isrc]));
}

describe('analyzeAudioFile', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'multigrain-analyze-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('accepts a compliant WAV without conversion', async () => {
    const filePath = path.join(tempDir, 'ok.wav');
    await fs.writeFile(filePath, buildWav(48000, 1));

    const result = await analyzeAudioFile(filePath);

    expect(result.isValid).toBe(true);
    expect(result.needsConversion).toBe(false);
    expect(result.issues).toEqual([]);
  });

  // The misparsed INFO sub-chunk claims ~540KB: longer files make music-metadata throw
  // "Illegal remaining size", shorter ones make it stop silently without a duration
  it.each([
    ['throws', 3],
    ['returns no duration', 1],
  ])(
    'falls back to the raw WAV header when music-metadata %s on malformed metadata',
    async (_, seconds) => {
      const filePath = path.join(tempDir, 'malformed.wav');
      await fs.writeFile(filePath, buildWav(48000, seconds, [malformedInfoChunk()]));

      const result = await analyzeAudioFile(filePath);

      expect(result.isValid).toBe(true);
      expect(result.metadata).toEqual({
        sampleRate: 48000,
        bitDepth: 16,
        channels: 2,
        duration: seconds,
        format: 'WAVE',
      });
      // Must be rewritten even though the format is already compliant
      expect(result.needsConversion).toBe(true);
      expect(result.issues.map((i) => i.message).join()).toMatch(/malformed metadata/);
    }
  );

  it('reports unreadable files as invalid', async () => {
    const filePath = path.join(tempDir, 'garbage.wav');
    await fs.writeFile(filePath, Buffer.from('definitely not audio'));

    const result = await analyzeAudioFile(filePath);

    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('unreadable');
  });

  it('reports files as invalid when music-metadata returns an empty format without throwing', async () => {
    const filePath = path.join(tempDir, 'garbage.wav');
    await fs.writeFile(filePath, Buffer.from('definitely not audio'));
    vi.mocked(parseFile).mockResolvedValueOnce({
      format: { tagTypes: [], trackInfo: [] },
    } as unknown as IAudioMetadata);

    const result = await analyzeAudioFile(filePath);

    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('unreadable');
  });
});
