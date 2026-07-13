const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// On native platforms, redirect web-only packages to empty modules so they
// don't bloat the iOS/Android bundle. Web builds are unaffected.
const WEB_ONLY = new Set([
  "react-native-web",
  "react-dom",
  "@expo/metro-runtime",
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== "web" && WEB_ONLY.has(moduleName)) {
    return { type: "empty" };
  }
  // Fall through to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
