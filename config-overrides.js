const {
  override,
  //   addBabelPlugin,
  //   addLessLoader,
  addWebpackPlugin,
} = require("customize-cra");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const path = require("path");
const paths = require('react-scripts/config/paths');
paths.appBuild = path.join(path.dirname(paths.appBuild), "docs"); // 修改打包目录
module.exports = override(
  addWebpackPlugin(
    new MonacoWebpackPlugin({
      languages: ["typescript"],
    })
  )
  //   addBabelPlugin([
  //     "import",
  //     {
  //       libraryName: "antd",
  //       // libraryDirectory: 'es',
  //       style: true,
  //     },
  //     "ant",
  //   ]),
  //   addLessLoader({
  //     javascriptEnabled: true,
  //     // modifyVars: { "@primary-color": "#1DA57A" }
  //   })
);
