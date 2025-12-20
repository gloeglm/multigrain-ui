import { ipcMain } from 'electron';
import fs from 'node:fs/promises';
import { parseFile } from 'music-metadata';

export function registerAudioHandlers(): void {
  // Read WAV metadata (specifically the comment/description)
  ipcMain.handle('audio:readMetadata', async (_event, filePath: string) => {
    try {
      const metadata = await parseFile(filePath);

      // Try to get description from various metadata fields
      // music-metadata returns comments as objects with {text, language, descriptor}
      const commentObj = metadata.common.comment?.[0];
      const commentText = typeof commentObj === 'string'
        ? commentObj
        : commentObj?.text || '';

      const riffComment = metadata.native?.['RIFF']?.find(tag => tag.id === 'ICMT')?.value;
      const description = commentText || riffComment || '';

      return {
        description: String(description),
        title: metadata.common.title || '',
        artist: metadata.common.artist || '',
        duration: metadata.format.duration || 0,
        sampleRate: metadata.format.sampleRate || 0,
        bitDepth: metadata.format.bitsPerSample || 0,
        channels: metadata.format.numberOfChannels || 0,
      };
    } catch (error) {
      console.error('Error reading metadata:', error);
      return {
        description: '',
        title: '',
        artist: '',
        duration: 0,
        sampleRate: 0,
        bitDepth: 0,
        channels: 0,
      };
    }
  });

  // Write WAV metadata (comment/description)
  ipcMain.handle('audio:writeMetadata', async (_event, filePath: string, description: string) => {
    try {
      // Read the entire file
      const fileBuffer = await fs.readFile(filePath);

      // Parse WAV structure to find or create INFO chunk
      const updatedBuffer = await addInfoChunk(fileBuffer, description);

      // Write back to file
      await fs.writeFile(filePath, updatedBuffer);

      return { success: true };
    } catch (error) {
      console.error('Error writing metadata:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}

// Helper function to add/update INFO chunk with ICMT (comment) tag
async function addInfoChunk(buffer: Buffer, description: string): Promise<Buffer> {
  // WAV file structure: RIFF + size + WAVE + chunks

  // Verify this is a WAV file
  const riffHeader = buffer.toString('ascii', 0, 4);
  const waveHeader = buffer.toString('ascii', 8, 12);

  if (riffHeader !== 'RIFF' || waveHeader !== 'WAVE') {
    throw new Error('Not a valid WAV file');
  }

  // Find existing INFO chunk or determine where to insert it
  let position = 12; // Start after RIFF header
  let infoChunkPosition = -1;
  const chunks: Array<{ id: string; size: number; position: number }> = [];

  while (position < buffer.length - 8) {
    const chunkId = buffer.toString('ascii', position, position + 4);
    const chunkSize = buffer.readUInt32LE(position + 4);

    chunks.push({ id: chunkId, size: chunkSize, position });

    if (chunkId === 'LIST') {
      const listType = buffer.toString('ascii', position + 8, position + 12);
      if (listType === 'INFO') {
        infoChunkPosition = position;
      }
    }

    position += 8 + chunkSize + (chunkSize % 2); // Account for padding
  }

  // Create new INFO chunk with ICMT tag
  const icmtTag = 'ICMT';
  const commentBuffer = Buffer.from(description, 'utf8');
  const commentSize = commentBuffer.length + (commentBuffer.length % 2); // Add padding if odd
  const paddedCommentBuffer = Buffer.alloc(commentSize);
  commentBuffer.copy(paddedCommentBuffer);

  // INFO chunk structure: LIST + size + INFO + ICMT + size + data
  const infoChunkSize = 4 + 8 + commentSize; // INFO + ICMT header + data
  const infoChunk = Buffer.alloc(8 + infoChunkSize);

  infoChunk.write('LIST', 0, 4, 'ascii');
  infoChunk.writeUInt32LE(infoChunkSize, 4);
  infoChunk.write('INFO', 8, 4, 'ascii');
  infoChunk.write(icmtTag, 12, 4, 'ascii');
  infoChunk.writeUInt32LE(commentBuffer.length, 16);
  paddedCommentBuffer.copy(infoChunk, 20);

  let newBuffer: Buffer;

  if (infoChunkPosition !== -1) {
    // Replace existing INFO chunk
    const chunk = chunks.find(c => c.position === infoChunkPosition);
    if (!chunk) throw new Error('Chunk not found');

    const beforeChunk = buffer.subarray(0, infoChunkPosition);
    const chunkPadding = chunk.size % 2;
    const afterChunk = buffer.subarray(infoChunkPosition + 8 + chunk.size + chunkPadding);

    newBuffer = Buffer.concat([beforeChunk, infoChunk, afterChunk]);
  } else {
    // Insert new INFO chunk before 'data' chunk
    const dataChunk = chunks.find(c => c.id === 'data');
    if (!dataChunk) throw new Error('No data chunk found');

    const beforeData = buffer.subarray(0, dataChunk.position);
    const dataAndAfter = buffer.subarray(dataChunk.position);

    newBuffer = Buffer.concat([beforeData, infoChunk, dataAndAfter]);
  }

  // Update RIFF size
  newBuffer.writeUInt32LE(newBuffer.length - 8, 4);

  return newBuffer;
}
