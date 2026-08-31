module.exports = {
  rootDir: "src",
  testEnvironment: "jsdom",
  testTimeout: 20000,
  transform: {
    "^.+\\.(j|t)sx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
    "\\.(svg|png|jpg|jpeg|gif)$": "<rootDir>/__mocks__/fileMock.js",
    "single-spa-react/parcel": "single-spa-react/lib/cjs/parcel.cjs",
    "^axios$": "axios/dist/node/axios.cjs",
    // MUI (Popper/MenuList in ExportAction) pulls ESM @babel/runtime helpers;
    // map them to their CJS equivalents so jest can require them.
    "^@babel/runtime/helpers/esm/(.*)$": "@babel/runtime/helpers/$1",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
};
