const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const sdkRoot = path.resolve(projectRoot, "../minigo-wallet-sdk/src");

const config = getDefaultConfig(projectRoot);

// The wallet SDK is checked out next to this app. Its imports resolve from this app's node_modules so there is
// one copy of each package.
config.watchFolders = [sdkRoot];
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const fromSdk = context.originModulePath.startsWith(sdkRoot);
  const bare = !moduleName.startsWith(".") && !moduleName.startsWith("/");
  let next = fromSdk && bare ? { ...context, originModulePath: path.join(projectRoot, "package.json") } : context;

  // On native, use the Stellar packages' Node builds. The browser builds bundle their own Buffer, which the
  // polyfill in src/polyfills.ts can't reach.
  const stellar = moduleName.startsWith("@stellar/") || next.originModulePath.includes(`${path.sep}node_modules${path.sep}@stellar${path.sep}`);
  if (stellar && platform !== "web") next = { ...next, mainFields: ["react-native", "main"] };

  return (defaultResolve ?? context.resolveRequest)(next, moduleName, platform);
};

module.exports = config;
