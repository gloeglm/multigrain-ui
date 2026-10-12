import { parseWavHeader } from './wavHeader';

function chunk(id: string, body: Buffer, declaredSize = body.length): Buffer {
  const header = Buffer.alloc(8);
  header.write(id, 0, 'ascii');
  header.writeUInt32LE(declaredSize, 4);
  const pad = body.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0);
  return Buffer.concat([header, body, pad]);
}

function fmtChunk(sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const body = Buffer.alloc(16);
  const blockAlign = (channels * bitsPerSample) / 8;
  body.writeUInt16LE(1, 0); // PCM
  body.writeUInt16LE(channels, 2);
  body.writeUInt32LE(sampleRate, 4);
  body.writeUInt32LE(sampleRate * blockAlign, 8);
  body.writeUInt16LE(blockAlign, 12);
  body.writeUInt16LE(bitsPerSample, 14);
  return chunk('fmt ', body);
}

function riff(...chunks: Buffer[]): Buffer {
  const body = Buffer.concat([Buffer.from('WAVE', 'ascii'), ...chunks]);
  const header = Buffer.alloc(8);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}

// LIST/INFO chunk whose IART sub-chunk has 2 stray bytes not covered by its declared size,
// as found in some commercially distributed sample packs
function malformedInfoChunk(): Buffer {
  const artist = Buffer.from('Some Artist Name', 'ascii');
  const iart = Buffer.concat([chunk('IART', artist), Buffer.alloc(2)]);
  const isrc = chunk('ISRC', Buffer.from('Vendor\0\0', 'ascii'));
  return chunk('LIST', Buffer.concat([Buffer.from('INFO', 'ascii'), iart, isrc]));
}

describe('parseWavHeader', () => {
  it('parses format and duration from a standard WAV', () => {
    const data = Buffer.alloc(48000 * 4); // 1 second of 48kHz 16-bit stereo
    const result = parseWavHeader(riff(fmtChunk(48000, 2, 16), chunk('data', data)));

    expect(result).toEqual({
      sampleRate: 48000,
      bitsPerSample: 16,
      numberOfChannels: 2,
      duration: 1,
    });
  });

  it('skips malformed LIST/INFO chunks', () => {
    const data = Buffer.alloc(44100 * 6 * 2); // 2 seconds of 44.1kHz 24-bit stereo
    const result = parseWavHeader(
      riff(fmtChunk(44100, 2, 24), malformedInfoChunk(), chunk('data', data))
    );

    expect(result).toEqual({
      sampleRate: 44100,
      bitsPerSample: 24,
      numberOfChannels: 2,
      duration: 2,
    });
  });

  it('computes duration from the declared data size when the header is truncated', () => {
    const header = riff(fmtChunk(48000, 2, 16), chunk('data', Buffer.alloc(0), 48000 * 4 * 3));
    expect(parseWavHeader(header)?.duration).toBe(3);
  });

  it('returns null for non-WAV data', () => {
    expect(parseWavHeader(Buffer.from('ID3 not a wav file at all', 'ascii'))).toBeNull();
    expect(parseWavHeader(Buffer.alloc(4))).toBeNull();
  });

  it('returns null when fmt or data chunk is missing', () => {
    expect(parseWavHeader(riff(fmtChunk(48000, 2, 16)))).toBeNull();
    expect(parseWavHeader(riff(chunk('data', Buffer.alloc(16))))).toBeNull();
  });
});
