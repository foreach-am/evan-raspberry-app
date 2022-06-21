module.exports = {
  sourceType: 'unambiguous',
  compact: false,
  presets: [
    '@babel/preset-env',
    // [
    //   "minify",
    //   {
    //     "keepFnName": true,
    //     "builtIns": false,
    //     "evaluate": false,
    //     "mangle": false
    //   }
    // ]
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-modules-umd',
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-transform-runtime',
  ],
  comments: false,
  targets: {
    chrome: '58',
    ie: '11',
  },
  assumptions: {
    setPublicClassFields: true,
    noDocumentAll: true,
    noClassCalls: true,
    constantReexports: true,
  },
};
