import webpack from "webpack"
import { mergeWithRules } from "webpack-merge";

import singleSpaDefaults from "webpack-config-single-spa-ts";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export default (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "madie",
    projectName: "madie-util",
    webpackConfigEnv,
    disableHtmlGeneration: true,
    orgPackagesAsExternal: false,
  });

  const babelLoaderRule = {
    test: /\.(js|ts|jsx|tsx)$/,
    exclude: /node_modules/,
    use: {
      loader: "babel-loader",
      options: {
        presets: [
          ["@babel/preset-env", { targets: "> 0.25%, not dead" }],
          ["@babel/preset-react", { runtime: "automatic" }],
          "@babel/preset-typescript"
        ],
        plugins: [
          ["@babel/plugin-transform-runtime", { regenerator: false, useESModules: true }],
          "babel-plugin-macros",
        ],
        cacheDirectory: true,
      },
    },
  };

  const providePlugin = new webpack.ProvidePlugin({
    process: 'process/browser.js', //probably don't need this
    Buffer: ['buffer', 'Buffer'],
  });

  const polyfillConfig = {
    resolve: {
      alias: {
        'process/browser': path.resolve('process/browser.js'), // since it's here
        'node-fetch': false, 
        'buffer': path.resolve(__dirname, 'node_modules/buffer/'), 
      },
      fallback: {
        util: false,
        "form-data": false,
        "combined-stream": false,
        stream: false,

        fs: false,
        tls: false,
        net: false,
        path: false,
        zlib: false,
        http: false,
        https: false,
        stream: false,
        crypto: false,
      },
    },
    // breaks in esm without these fallback patterns
    plugins: [
      new webpack.IgnorePlugin({
        resourceRegExp: /^follow-redirects$/,
      }),
      new webpack.IgnorePlugin({ resourceRegExp: /^form-data$/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /^combined-stream$/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /^util$/ }),
    ]
  };

  const mergedConfig = mergeWithRules({
    module: {
      rules: {
        test: "match",
        use: "replace"
      }
    },
    plugins: "append"
  })(
    defaultConfig,
    {
      module: {
        rules: [
          babelLoaderRule,
        ],
      },
      plugins: [
        providePlugin,
      ],
      optimization: {
        minimize: false,
      },
      devtool: "source-map",
      externals: {
      react: 'react',
      // if these are not treated as externals, multiple versions of react crash app
      'react/jsx-runtime': 'react/jsx-runtime',
      'react/jsx-dev-runtime': 'react/jsx-dev-runtime',
      },
    },
    polyfillConfig
  );

  return mergedConfig;
};
