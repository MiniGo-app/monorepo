// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const sdkRoot = path.resolve(projectRoot, "../minigo-wallet-sdk/src");

const config = getDefaultConfig(projectRoot);

// The wallet SDK next to this app shares its signing, Horizon and mini-app host code with the browser
// extension. Metro watches it, and packages it imports resolve from this app's node_modules so there is
// exactly one copy of each (e.g. @stellar/stellar-base).
config.watchFolders = [sdkRoot];
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const fromSdk = context.originModulePath.startsWith(sdkRoot);
  const bare = !moduleName.startsWith(".") && !moduleName.startsWith("/");
  let next = fromSdk && bare ? { ...context, originModulePath: path.join(projectRoot, "package.json") } : context;

  // On the phone, Stellar's packages must use their normal (Node) builds, not the pre-bundled "browser" builds.
  // Each browser build carries its own private copy of `Buffer`, which Hermes handles wrongly (see
  // src/polyfills.ts), and the copy inside one package can't be fixed from outside. The Node builds use the one
  // global Buffer that src/polyfills.ts sets up, so a single fix covers all of them.
  const stellar = moduleName.startsWith("@stellar/") || next.originModulePath.includes(`${path.sep}node_modules${path.sep}@stellar${path.sep}`);
  if (stellar && platform !== "web") next = { ...next, mainFields: ["react-native", "main"] };

  return (defaultResolve ?? context.resolveRequest)(next, moduleName, platform);
};

module.exports = config;
