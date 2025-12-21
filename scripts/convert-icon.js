const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../assets/icons/icon.svg');
const pngPath = path.join(__dirname, '../assets/icons/icon.png');

// Read SVG and convert to PNG at 1024x1024 (high resolution for icon generation)
sharp(svgPath)
  .resize(1024, 1024)
  .png()
  .toFile(pngPath)
  .then(() => {
    console.log('✓ SVG converted to PNG successfully');
    console.log(`  Output: ${pngPath}`);
  })
  .catch(err => {
    console.error('Error converting SVG to PNG:', err);
    process.exit(1);
  });
