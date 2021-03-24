/* eslint-disable import/no-webpack-loader-syntax */
import React, { FC, useState } from "react";
import Sandbox from "../../react-sandbox";
import defs from "!raw-loader!./defs.lsz";
import implement from "!raw-loader!./implements.lsz";
import code from "!raw-loader!./code.lsz";
export interface LeetCodeProps {}
const LeetCode: FC<LeetCodeProps> = ({ ...props }) => {
  const [c, setC] = useState<string>(localStorage.getItem("leetcode") || "");
  return (
    <>
      <Sandbox
        pageDefaultSize={0}
        code={c || code}
        onChange={(c) => {
          localStorage.setItem("leetcode", c);
        }}
        defs={defs}
        preExecute={implement}
      />
    </>
  );
};
export default LeetCode;
