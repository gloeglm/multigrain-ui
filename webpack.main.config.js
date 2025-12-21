const path = require('path');

module.exports = {
  entry: './src/main/index.ts',
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@main': path.resolve(__dirname, 'src/main'),
    },
  },
  externals: {
    '@ffmpeg-installer/ffmpeg': 'commonjs2 @ffmpeg-installer/ffmpeg',
  },
};
