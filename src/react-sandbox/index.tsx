/* eslint-disable import/no-webpack-loader-syntax */
import React, {
  FC,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import SplitPane from "react-split-pane";
import CodeEditor, { TypeScriptProps, TypeScriptRef } from "./CodeEditor";
import Frame, { FrameContextConsumer } from "react-frame-component";
import debounce from "lodash.debounce";
import "./index.css";
import * as monaco from "monaco-editor";
import * as Babel from "@babel/standalone";
import { getDiagsMessages } from "./util";
import useUUID from "./useUUID";
import template from "@babel/template";
import systemjs from "!raw-loader!systemjs/dist/system.min.js";
import systemjsAmd from "!raw-loader!systemjs/dist/extras/amd.min.js";
import { parseExpression, parse } from "@babel/parser";

interface Script {
  //作为importmap的key
  name: string;
  //加载路径
  src?: string;
  //加载代码，优先级最高
  code?: string;
  //ts类型
  types?: string[];
  typeCode?: string;
}

interface Style {
  href?: string;
  code?: string;
}
/**
 * 沙盒属性，目前默认ts沙盒
 */
export interface SandboxProps extends TypeScriptProps {
  scripts?: Script[];
  styles?: Style[];
  code?: string;
  preExecute?: string;
  onChange?(code: string);
  wrapperFunction?(): string;
}

/**
 * systemimports映射
 */
interface ImportsReflect {
  [key: string]: string;
}

const babelConfig = {
  sourceMaps: "both",
  filename: "main.tsx",
  presets: ["typescript", "es2015", "react"],
  plugins: [
    "maxium-count",
    "proposal-do-expressions",
    "proposal-optional-chaining",
    [
      "proposal-pipeline-operator",
      {
        proposal: "minimal",
      },
    ],
    [
      "proposal-decorators",
      {
        legacy: true,
      },
    ],
    ["proposal-class-properties", { loose: true }],
    "transform-modules-systemjs",
  ],
};
const getCode = async (src) => {
  return fetch(src).then((res) => res.text());
};
const Sandbox: FC<SandboxProps> = ({
  scripts: pScripts = [],
  code: pCode = "",
  styles: pStyles = [],
  extraLibs,
  preExecute = "",
  onChange,
  wrapperFunction = (code) => code,
  ...props
}) => {
  const uuid = useUUID();
  const [loading, setLoading] = useState<boolean>(true);
  const [scripts, setScripts] = useState<Script[]>(pScripts);
  const [styles, setStyles] = useState<Style[]>(pStyles);
  const [dragging, setDragging] = useState<boolean>();
  const loadersCode = useRef<string>("");
  const cssCode = useRef<string>("");
  const imports = useRef<ImportsReflect>();
  const run = useCallback(async (code) => {
    try {
      const _worker = await monaco.languages.typescript.getTypeScriptWorker();
      const worker = await _worker();
      const diags = (
        await worker.getSemanticDiagnostics(
          monaco.Uri.file("/index.tsx").toString()
        )
      ).filter((e) => e.category === 1);
      const messages = getDiagsMessages(diags);
      if (messages.length > 0) {
        throw new Error(messages.join("\n"));
      }

      onChange?.(code);
      const compiledCode = Babel.transform(
        `var ${uuid}=0;${preExecute};${code}`,
        babelConfig
      ).code;
      //修复文档流
      const document: Document = ref.current.window.document;
      const codeBlob = new Blob([compiledCode], { type: "text/javascript" });
      const url = URL.createObjectURL(codeBlob);
      if (document.children[0]) {
        document.removeChild(document.children[0]);
      }
      document.appendChild(document.createElement("html"));
      document.documentElement.innerHTML = `
        <head>
          <style type="text/css">${cssCode.current}</style>
          <script type="systemjs-importmap">
         ${JSON.stringify({ imports: imports.current })}
        </script>
        </head>
        <body>
          <div id="root">
          </div>
        </body>
        `;
      /**
       * 执行代码加载
       */
      const sc = document.createElement("script");
      sc.type = "systemjs-module";
      sc.src = url;
      document.body.appendChild(sc);
      console.log(compiledCode);
      /**
       * loader代码加载
       */
      const loader = document.createElement("script");
      loader.type = "text/javascript";
      loader.innerHTML = loadersCode.current;
      document.body.appendChild(loader);
      // setCode(code);
    } catch (error) {
      const document: Document = ref.current.window.document;
      if (document.children[0]) {
        document.removeChild(document.children[0]);
      }
      document.appendChild(document.createElement("html"));
      document.documentElement.innerHTML = `
        <head>
          <style type="text/css">
            #root{
              color:red;
              font-weight:bold;
            }
          </style>
        </head>
        <body>
          <pre id="root" >${error}</pre>
        </body>
        `;
    } finally {
    }
  }, []);
  useEffect(() => {
    Babel.registerPlugin("maxium-count", () => {
      const whileDoWhileStateMent = (path) => {
        const uuidIncresment = template.ast(`${uuid}++`);
        const uuidJudge = template.ast(`
          if(${uuid}>999){
            document.body.innerHTML='<pre id="root" style="color:red;font-weight:bold" >while语句超出最大循环限制</pre>'
            throw new Error('超出最大循环限制')
          }
        `);
        path.node.body.body.unshift(uuidJudge);
        path.node.body.body.unshift(uuidIncresment);
        const parentBody = path.parent.body;
        for (let i = 0; i < parentBody.length; i++) {
          const node = parentBody[i];
          if (node === path.node) {
            parentBody.splice(i + 1, 0, template.ast(`${uuid}=0`));
            break;
          }
        }
      };
      return {
        visitor: {
          WhileStatement: whileDoWhileStateMent,
          DoWhileStatement: whileDoWhileStateMent,
        },
      };
    });
    (async () => {
      try {
        setLoading(true);
        const loaders: Script[] = [
          {
            name: "systemjs",
            src: "https://unpkg.com/systemjs/dist/system.min.js",
            code:systemjs
          },
          {
            name: "systemjs-extra-amd",
            src: "https://unpkg.com/systemjs/dist/extras/amd.min.js",
            code:systemjsAmd
          },
        ];
        // await Promise.all(
        //   loaders.map(async (loader) => {
        //     const code = await getCode(loader.src!);
        //     loader.code = code;
        //     return loader;
        //   })
        // );
        const newScripts = await Promise.all(
          scripts.map(async (script) => {
            const code = await getCode(script.src!);
            script.code = code;
            if (script.types) {
              const typeCodes = await Promise.all(
                script.types.map(async (url) => await getCode(url))
              );
              script.typeCode = typeCodes.join(";");
            }
            return script;
          })
        );
        const newStyles = await Promise.all(
          styles.map(async (style) => {
            const code = await getCode(style.href!);
            style.code = code;
            return style;
          })
        );
        imports.current = Object.fromEntries(
          newScripts.map((e) => [
            e.name,
            URL.createObjectURL(
              new Blob([e.code || ""], { type: "text/javascript" })
            ),
          ])
        );
        cssCode.current = newStyles.map((e) => e.code).join("");
        setScripts([...newScripts]);
        setStyles([...newStyles]);
        loadersCode.current = loaders.map((e) => e.code).join(";");
      } finally {
        setLoading(false);
      }
      run(pCode);
    })();
  }, []);

  const ref = useRef<any>();
  const editorRef = useRef<TypeScriptRef>(null);
  return (
    <>
      <div className="sand-box" style={{ background: "#fff", height: `100vh` }}>
        <SplitPane
          onDragStarted={() => setDragging(true)}
          onDragFinished={() => setDragging(false)}
          pane1Style={{ position: "relative" }}
          pane2Style={{ position: "relative" }}
          split="vertical"
          defaultSize={`50%`}
        >
          <div style={{ height: `100%` }} key="code">
            <CodeEditor.TypeScript
              ref={editorRef}
              defaultValue={pCode}
              libs={Object.fromEntries(
                scripts.map((e) => [e.name, e.typeCode]).filter(Boolean)
              )}
              extraLibs={extraLibs}
              onChange={debounce(run, 800)}
              {...props}
            />
          </div>
          <div style={{ height: `100%` }} key="preview">
            <>
              {!loading && (
                <Frame
                  style={{
                    height: `100%`,
                    width: `100%`,
                    pointerEvents: dragging ? "none" : "initial",
                  }}
                  className="frame"
                >
                  <FrameContextConsumer>
                    {({ window }) => {
                      ref.current = window;
                      return <></>;
                    }}
                  </FrameContextConsumer>
                </Frame>
              )}
            </>
          </div>
        </SplitPane>
      </div>
    </>
  );
};
export default Sandbox;
