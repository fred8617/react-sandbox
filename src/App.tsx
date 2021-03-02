import React, { useState } from "react";

import { parse } from "querystring";
import { HashRouter, Route, Switch } from "react-router-dom";
import Antd from "./example/antd";
import LeetCode from "./example/leetcode";
function App() {
  return (
    <>
      <HashRouter>
        <Switch>
          <Route exact path="/">
            <Antd />
          </Route>
          <Route exact path="/leetcode">
            <LeetCode />
          </Route>
        </Switch>
      </HashRouter>
    </>
  );
}

export default App;
