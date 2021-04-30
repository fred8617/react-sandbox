import React, { useState } from "react";

import { parse } from "querystring";
import { HashRouter, Route, Switch } from "react-router-dom";
import Antd from "./example/antd";
import LeetCode from "./example/leetcode";
import Sourcemap from "./example/sourcemap";
import ApolloCilent from "./example/apollo-client";
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
          <Route exact path="/sourcemap">
            <Sourcemap />
          </Route>
          <Route exact path="/apollo-client">
            <ApolloCilent />
          </Route>
        </Switch>
      </HashRouter>
    </>
  );
}

export default App;
