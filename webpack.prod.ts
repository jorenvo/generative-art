import webPackMerge from "webpack-merge";
import baseConfig from "./webpack";

const config = webPackMerge(baseConfig, {
  mode: "production",
  output: {
    publicPath: "/generative-art/",
  },
});
export default config;
