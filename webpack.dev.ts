import webPackMerge from "webpack-merge";
import baseConfig from "./webpack";

const config = webPackMerge(baseConfig, {
  mode: "development",
  devtool: "source-map",
});
export default config;
