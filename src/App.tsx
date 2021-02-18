/* eslint-disable import/no-webpack-loader-syntax */
import React, { useState } from "react";
import Sandbox from "./react-sandbox";
import tpCode from "!raw-loader!./code.txt";
import { parse } from "querystring";
function App() {
  const { version = "4.12.0" } = parse(window.location.search.replace("?", ""));
  // const [render, setRender] = useState<boolean>(false);
  return (
    <Sandbox
      styles={[{ href: `https://unpkg.com/antd@${version}/dist/antd.min.css` }]}
      code={tpCode}
      extraLibs={require("./antd.json").types}
      scripts={[
        {
          name: "react",
          src: "https://unpkg.com/react/umd/react.production.min.js",
          types: [
            "https://www.lsz8617.com/ts-type/react/index.d.ts",
            "https://www.lsz8617.com/ts-type/react/global.d.ts",
          ],
        },

        {
          name: "react-dom",
          src: "https://unpkg.com/react-dom/umd/react-dom.production.min.js",
          types: ["https://www.lsz8617.com/ts-type/react-dom/index.d.ts"],
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
}

export default App;
