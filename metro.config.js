const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg');

// Exclude web-only components from mobile builds to prevent resolution errors
config.resolver.blockList = [
  /components\/DocumentDraftingView\.tsx$/,
  /components\/RichTextEditor\.tsx$/,
  /components\/.*View\.tsx$/, // Exclude other web-specific view components
  /services\/.*Service\.ts$/, // Exclude web-specific services
];

module.exports = config;