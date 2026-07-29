const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "madie",
    projectName: "madie-util",
    webpackConfigEnv,
    argv,
    // Bundle @madie/* deps (design-system is not on the single-spa import map).
    orgPackagesAsExternal: false,
  });

  return merge(defaultConfig, {
    // Shared singletons provided by the import map — must not be bundled twice.
    externals: [
      "@emotion/react",
      "@emotion/styled",
      "styled-components",
      "react-is",
    ],
    module: {
      rules: [
        {
          test: /\.scss$/,
          exclude: /node_modules/,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
        {
          // Inline svg assets as data URIs so the bundle serves no extra files.
          test: /\.svg$/,
          type: "asset/inline",
        },
      ],
    },
    // Bundled deps (e.g. react-draggable in design-system dialogs) read Node
    // globals like `process`, which webpack 5 no longer shims.
    plugins: [new NodePolyfillPlugin()],
  });
};
