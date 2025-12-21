const fs = require('fs');
const path = require('path');

// Check WAV file structure
function analyzeWavFile(filePath) {
  const buffer = fs.readFileSync(filePath);

  console.log(`\nAnalyzing: ${path.basename(filePath)}`);
  console.log(`File size: ${buffer.length} bytes`);

  // Check RIFF header
  const riffHeader = buffer.toString('ascii', 0, 4);
  const fileSize = buffer.readUInt32LE(4);
  const waveHeader = buffer.toString('ascii', 8, 12);

  console.log(`RIFF header: ${riffHeader}`);
  console.log(`Declared size: ${fileSize} (actual: ${buffer.length - 8})`);
  console.log(`WAVE header: ${waveHeader}`);

  if (riffHeader !== 'RIFF' || waveHeader !== 'WAVE') {
    console.log('ERROR: Not a valid WAV file!');
    return;
  }

  // Parse all chunks
  let position = 12;
  const chunks = [];

  console.log('\nChunks:');
  while (position < buffer.length - 8) {
    const chunkId = buffer.toString('ascii', position, position + 4);
    const chunkSize = buffer.readUInt32LE(position + 4);

    console.log(`  ${chunkId}: ${chunkSize} bytes at offset ${position}`);

    chunks.push({ id: chunkId, size: chunkSize, position });

    // For LIST chunks, show the list type and contents
    if (chunkId === 'LIST' && position + 12 <= buffer.length) {
      const listType = buffer.toString('ascii', position + 8, position + 12);
      console.log(`    List type: ${listType}`);

      if (listType === 'INFO') {
        // Parse INFO chunk sub-chunks
        let infoPos = position + 12;
        const infoEnd = position + 8 + chunkSize;
        console.log(`    INFO contents:`);

        while (infoPos < infoEnd - 8) {
          const tagId = buffer.toString('ascii', infoPos, infoPos + 4);
          const tagSize = buffer.readUInt32LE(infoPos + 4);
          const tagData = buffer.toString('utf8', infoPos + 8, infoPos + 8 + tagSize).replace(/\0/g, '');

          console.log(`      ${tagId}: "${tagData}" (${tagSize} bytes)`);

          infoPos += 8 + tagSize + (tagSize % 2);
        }
      }
    }

    position += 8 + chunkSize + (chunkSize % 2);
  }

  // Check fmt chunk details
  const fmtChunk = chunks.find(c => c.id === 'fmt ');
  if (fmtChunk) {
    const pos = fmtChunk.position + 8;
    const audioFormat = buffer.readUInt16LE(pos);
    const numChannels = buffer.readUInt16LE(pos + 2);
    const sampleRate = buffer.readUInt32LE(pos + 4);
    const byteRate = buffer.readUInt32LE(pos + 8);
    const blockAlign = buffer.readUInt16LE(pos + 12);
    const bitsPerSample = buffer.readUInt16LE(pos + 14);

    console.log('\nFormat details:');
    console.log(`  Audio format: ${audioFormat} (1=PCM)`);
    console.log(`  Channels: ${numChannels}`);
    console.log(`  Sample rate: ${sampleRate} Hz`);
    console.log(`  Byte rate: ${byteRate}`);
    console.log(`  Block align: ${blockAlign}`);
    console.log(`  Bits per sample: ${bitsPerSample}`);
  }
}

// Analyze the converted files
const files = [
  'D:\\Multigrain\\Project32\\JMK_IVP_108_indian_female_adlib__harmonies_bollywood_dry_G.wav',
  'D:\\Multigrain\\Project25\\01_GRAINIFY.wav',
  'D:\\Multigrain\\Project25\\02_GRAINIFY.wav'
];

files.forEach(file => {
  try {
    analyzeWavFile(file);
  } catch (error) {
    console.log(`Error analyzing ${file}: ${error.message}`);
  }
});
