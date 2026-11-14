// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite en web usa un .wasm (wa-sqlite): Metro tiene que tratarlo como archivo.
// En Android y iOS no cambia nada.
config.resolver.assetExts.push('wasm');

module.exports = config;
