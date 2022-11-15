/* eslint-disable import/no-webpack-loader-syntax */
import React, { FC } from "react";
import Sandbox from "../../react-sandbox";
import tpCode from "!raw-loader!./code.lsz";
const version = "4.12.0";
const Antd: FC = () => {
  return (
    <Sandbox
      styles={[{ href: `https://unpkg.com/antd@${version}/dist/antd.min.css` }]}
      code={tpCode}
      extraLibs={require("./antd.json").types}
      scripts={[
        {
          name: "react",
          src: "https://unpkg.com/react/umd/react.development.js",
          types: [
            "https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/react/index.d.ts",
            "https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/react/global.d.ts",
          ],
        },

        {
          name: "react-dom",
          src: "https://unpkg.com/react-dom/umd/react-dom.development.js",
          types: [
            "https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/react-dom/index.d.ts",
          ],
        },
        {
          name: "moment",
          src: "https://unpkg.com/moment",
        },
        {
          name: "antd",
          src: `https://unpkg.com/antd@${version}`,
        },
      ]}
    />
  );
};
export default Antd;
