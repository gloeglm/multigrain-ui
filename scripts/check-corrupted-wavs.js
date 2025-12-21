const fs = require('fs');
const path = require('path');

/**
 * Check if a WAV file has the correct chunk order for Multigrain hardware
 * Multigrain expects: fmt -> data -> [optional metadata chunks]
 * Files with INFO/LIST chunks BEFORE data are problematic
 */
function checkWAVChunkOrder(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);

    // Verify this is a WAV file
    const riffHeader = buffer.toString('ascii', 0, 4);
    const waveHeader = buffer.toString('ascii', 8, 12);

    if (riffHeader !== 'RIFF' || waveHeader !== 'WAVE') {
      return { valid: false, error: 'Not a valid WAV file' };
    }

    // Parse chunks
    const chunks = [];
    let position = 12; // Start after RIFF header

    while (position < buffer.length - 8) {
      const chunkId = buffer.toString('ascii', position, position + 4);
      const chunkSize = buffer.readUInt32LE(position + 4);

      chunks.push({ id: chunkId, position });

      position += 8 + chunkSize + (chunkSize % 2); // Account for padding
    }

    // Find positions of data and INFO/LIST chunks
    const dataIndex = chunks.findIndex(c => c.id === 'data');
    const infoIndex = chunks.findIndex(c => c.id === 'LIST');

    if (dataIndex === -1) {
      return { valid: false, error: 'No data chunk found' };
    }

    // Check if INFO/LIST chunk comes before data chunk
    if (infoIndex !== -1 && infoIndex < dataIndex) {
      return {
        valid: false,
        error: 'INFO chunk before data chunk (incompatible with Multigrain)',
        chunkOrder: chunks.map(c => c.id).join(' -> '),
      };
    }

    return {
      valid: true,
      chunkOrder: chunks.map(c => c.id).join(' -> '),
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Recursively scan directory for WAV files
 */
function scanDirectory(dirPath, results = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.wav')) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node check-corrupted-wavs.js <path-to-multigrain-directory>');
    console.log('Example: node check-corrupted-wavs.js D:\\Multigrain');
    process.exit(1);
  }

  const multigrainPath = args[0];

  if (!fs.existsSync(multigrainPath)) {
    console.error(`Error: Directory not found: ${multigrainPath}`);
    process.exit(1);
  }

  console.log(`Scanning ${multigrainPath} for WAV files...\n`);

  // Scan for all WAV files
  const wavFiles = scanDirectory(multigrainPath);
  console.log(`Found ${wavFiles.length} WAV files\n`);

  // Check each file
  const problematicFiles = [];
  const validFiles = [];
  const errorFiles = [];

  for (const filePath of wavFiles) {
    const result = checkWAVChunkOrder(filePath);
    const relativePath = path.relative(multigrainPath, filePath);

    if (!result.valid) {
      if (result.error.includes('INFO chunk before data')) {
        problematicFiles.push({ path: relativePath, ...result });
      } else {
        errorFiles.push({ path: relativePath, ...result });
      }
    } else {
      validFiles.push({ path: relativePath, ...result });
    }
  }

  // Report results
  console.log('='.repeat(80));
  console.log('SCAN RESULTS');
  console.log('='.repeat(80));
  console.log();

  if (problematicFiles.length > 0) {
    console.log(`⚠️  PROBLEMATIC FILES (${problematicFiles.length}):`);
    console.log('These files have INFO chunks BEFORE data chunks and may not work on Multigrain:\n');

    for (const file of problematicFiles) {
      console.log(`  ❌ ${file.path}`);
      console.log(`     Chunk order: ${file.chunkOrder}`);
      console.log();
    }
  } else {
    console.log('✅ No problematic files found!\n');
  }

  if (errorFiles.length > 0) {
    console.log(`\n⚠️  FILES WITH ERRORS (${errorFiles.length}):`);
    for (const file of errorFiles) {
      console.log(`  ⚠️  ${file.path}: ${file.error}`);
    }
    console.log();
  }

  console.log(`📊 SUMMARY:`);
  console.log(`   Total files: ${wavFiles.length}`);
  console.log(`   ✅ Valid: ${validFiles.length}`);
  console.log(`   ❌ Problematic: ${problematicFiles.length}`);
  console.log(`   ⚠️  Errors: ${errorFiles.length}`);
  console.log();

  if (problematicFiles.length > 0) {
    console.log('💡 FIX: Open these files in Multigrain Sample Manager and re-edit their');
    console.log('   descriptions (even with the same text) to fix the chunk order.');
  }
}

main();
