import * as fs from 'fs/promises';

/**
 * Basic audio format information read directly from a WAV file's fmt/data chunks
 */
export interface WavHeaderInfo {
  sampleRate: number;
  bitsPerSample: number;
  numberOfChannels: number;
  duration: number;
}

// Enough to cover the fmt chunk plus any metadata chunks preceding the data chunk
const HEADER_READ_SIZE = 1024 * 1024;

/**
 * Parse the fmt and data chunk headers from the start of a WAV file.
 *
 * Only top-level RIFF chunks are walked; the contents of other chunks (e.g. LIST/INFO)
 * are skipped without being parsed. This makes it tolerant of files with malformed
 * metadata, which strict parsers like music-metadata reject even though the audio
 * itself is fine.
 *
 * Returns null if the buffer does not contain a usable WAV header.
 */
export function parseWavHeader(buffer: Buffer): WavHeaderInfo | null {
  if (buffer.length < 12) return null;
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    return null;
  }

  let sampleRate = 0;
  let bitsPerSample = 0;
  let numberOfChannels = 0;
  let byteRate = 0;
  let dataSize: number | null = null;

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const bodyOffset = offset + 8;

    if (chunkId === 'fmt ') {
      if (bodyOffset + 16 > buffer.length) return null;
      numberOfChannels = buffer.readUInt16LE(bodyOffset + 2);
      sampleRate = buffer.readUInt32LE(bodyOffset + 4);
      byteRate = buffer.readUInt32LE(bodyOffset + 8);
      bitsPerSample = buffer.readUInt16LE(bodyOffset + 14);
    } else if (chunkId === 'data') {
      dataSize = chunkSize;
      break;
    }

    // Chunks are padded to an even size
    offset = bodyOffset + chunkSize + (chunkSize % 2);
  }

  if (dataSize === null || byteRate === 0 || sampleRate === 0 || numberOfChannels === 0) {
    return null;
  }

  return {
    sampleRate,
    bitsPerSample,
    numberOfChannels,
    duration: dataSize / byteRate,
  };
}

/**
 * Read and parse the WAV header of a file on disk
 */
export async function readWavHeader(filePath: string): Promise<WavHeaderInfo | null> {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(HEADER_READ_SIZE);
    const { bytesRead } = await handle.read(buffer, 0, HEADER_READ_SIZE, 0);
    return parseWavHeader(buffer.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}
