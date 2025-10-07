const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push(
  // Fonts
  'otf',
  'ttf',
  // Images
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg'
);

// Ensure proper handling of fonts in development builds
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

module.exports = config;
