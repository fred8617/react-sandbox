/* eslint-disable import/no-webpack-loader-syntax */
import React, { FC } from "react";
import Sandbox from "../../react-sandbox";
import tpCode from "!raw-loader!./code.lsz";
const version = "4.12.0";

const Apollo: FC = () => {
  return (
    <Sandbox
      preExecute={`
      var demoJson = {
        family: [
          {
            name: "张三家",
            address: ["张家界", "梅河口"],
            poor: false,
            people: [
              { name: "张三", age: 10 },
              { name: "李四", age: 20 },
            ],
            asset: {
              house: [{ name: "万科" }, { name: "恒大" }],
              car: [{ brand: "benz" }, { brand: "bmw" }],
            },
          },
          {
            name: "我家",
            address: ["长春"],
            poor: true,
            people: [{ name: "我", age: 28 }],
            asset: {
              car: [{ brand: "byd" }],
            },
          },
        ],
      };
      console.log(demoJson)
      `}
      styles={[{ href: `https://unpkg.com/antd@${version}/dist/antd.min.css` }]}
      code={tpCode}
      extraLibs={{
        ...require("./antd.json").types,
        ...require("./apollo.json").types,
      }}
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
        {
          name: "@apollo/client",
          src: `https://www.lsz8617.com/lib/@apollo/client/index.js`,
        },
      ]}
    />
  );
};
export default Apollo;
