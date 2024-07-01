const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

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
          },
        ],
        exclude: /node_modules/,
      },
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: "src/index.html", to: "index.html" }],
    }),
  ],
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
