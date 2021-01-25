import React from "react";
import { BrowserRouter, Route } from "react-router-dom";
import Sandbox from "./react-sandbox";
import CodeEditor from "./react-sandbox/CodeEditor";

function App() {
  return (
    <BrowserRouter>
      <Route path="/">
        <Sandbox
        code={`import React from "react";
import ReactDOM from "react-dom";
ReactDOM.render(<>hello world</>, document.getElementById("root"));`}
          scripts={[
            {
              name: "react",
              src: "https://unpkg.com/react/umd/react.production.min.js",
              types: [
                "https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/react/index.d.ts",
                "https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/react/global.d.ts",
              ],
            },
            {
              name: "react-dom",
              src:
                "https://unpkg.com/react-dom/umd/react-dom.production.min.js",
                types:[
                  "https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/react-dom/index.d.ts",
                ]
            },
          ]}
        />
      </Route>
    </BrowserRouter>
  );
}

export default App;
