const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  mode: "development", // production
  // 配置多个入口
  entry: "./main.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
          {
            loader: "ts-loader",
            options: {
              // 指定特定的ts编译配置，为了区分脚本的ts配置
              configFile: path.resolve(__dirname, "./tsconfig.json"),
            },
          },
        ],
        exclude: /node_modules/,
      },
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
    ],
  },
  plugins: [new CleanWebpackPlugin({ cleanOnceBeforeBuildPatterns: ["*.js"] })],
  resolve: {
    extensions: [".ts", ".js"],
  },
  target: ["web", "es5"],
  // 指定出口
  output: {
    filename: "[name]-bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  devtool: "source-map",
};
