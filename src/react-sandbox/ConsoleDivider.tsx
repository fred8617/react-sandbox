import React, { FC } from "react";
export interface ConsoleDividerProps {}
const ConsoleDivider: FC<ConsoleDividerProps> = ({ ...props }) => {
  return (
    <>
      <div style={{ margin: `0 0 8px 0`,border:`1px solid #999` }} />
    </>
  );
};
export default ConsoleDivider;
