import path from "path";
import webPackMerge from "webpack-merge";
import baseConfig from "./webpack";

const config = webPackMerge(baseConfig, {
  mode: "production",
  output: {
    path: path.resolve(__dirname, "docs"),
    publicPath: "/generative-art/",
  },
});
export default config;
