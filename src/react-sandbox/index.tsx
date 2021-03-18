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
import debounce from "lodash.debounce";
import "./index.css";
import * as monaco from "monaco-editor";
import * as Babel from "@babel/standalone";
import { getDiagsMessages } from "./util";
import systemjs from "!raw-loader!systemjs/dist/system.js";
import systemjsAmd from "!raw-loader!systemjs/dist/extras/amd.min.js";
import useUUID from "./useUUID";
import ReactJson from "react-json-view";
import ConsoleDivider from "./ConsoleDivider";
import "./babelPlugins";
const HORIZONTAL_BAR_SIZE = 16;
const VERTICAL_BAR_SIZE = 16;
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
  pageDefaultSize?: number | string;
}

/**
 * systemimports映射
 */
interface ImportsReflect {
  [key: string]: string;
}

const babelConfig = {
  filename: "main.tsx",
  presets: ["typescript", "react"],
  plugins: [
    // "maxium-count",
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
  ],
};
const getCode = async (src) => {
  return fetch(src).then((res) => res.text());
};

interface ConsoleMessage {
  type: "log" | "error";
  data: any[];
}
const Sandbox: FC<SandboxProps> = ({
  scripts: pScripts = [],
  code: pCode = "",
  styles: pStyles = [],
  extraLibs,
  preExecute = "",
  onChange,
  pageDefaultSize = `80%`,
  wrapperFunction = (code) => code,
  ...props
}) => {
  const uuid = useUUID();
  const eventId = `sb_${uuid}`;
  const pExecute = `
window["${uuid}"];
window.console.log=function(...data){
  window.parent[\`dispatch_${eventId}_event\`]({eventId:"${uuid}",type:"log",data})
}
window.console.error=function(...data){
  window.parent[\`dispatch_${eventId}_event\`]({eventId:"${uuid}",type:"error",data})
}
;${preExecute}
  `;
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scripts, setScripts] = useState<Script[]>(pScripts);
  const [styles, setStyles] = useState<Style[]>(pStyles);
  const [dragging, setDragging] = useState<boolean>();
  const loadersCode = useRef<string>("");
  const cssCode = useRef<string>("");
  const imports = useRef<ImportsReflect>();
  const libs = useMemo(() => {
    return Object.fromEntries(
      scripts.map((e) => [e.name, e.typeCode]).filter(Boolean)
    );
  }, [scripts]);
  const run = useCallback(async (code) => {
    try {
      setConsoleMessages([]);
      const _worker = await monaco.languages.typescript.getTypeScriptWorker();
      const worker = await _worker();
      const diags = (
        await worker.getSemanticDiagnostics(
          monaco.Uri.file("/index.tsx").toString()
        )
      ).filter((e) => e.category === 1);
      const messages = getDiagsMessages(diags);
      if (messages.length > 0) {
        const errors = messages.join("\n");
        throw new Error(errors);
      }

      onChange?.(code);
      const preCheckCode = Babel.transform(code, {
        ...babelConfig,
        plugins: ["maxium-count", ...babelConfig.plugins],
      }).code;
      console.log(`${pExecute};${preCheckCode}`);
      const compiledCode = `
        ${
          Babel.transform(
            `
          ${pExecute}${preCheckCode}
          `,
            {
              ...babelConfig,
              presets: [...babelConfig.presets, "es2015"],
              plugins: [
                ...babelConfig.plugins,
                "transform-modules-systemjs",
              ],
            }
          ).code
        }
     `;
      //修复文档流
      // debugger
      const document: Document | undefined =
        ref.current?.contentWindow?.document;
      if (!document) {
        return;
      }
      const codeBlob = new Blob([compiledCode], { type: "text/javascript" });
      const url = URL.createObjectURL(codeBlob);
      if (document?.children[0]) {
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
      // process.env.NODE_ENV === "development" &&
      //   console.log("preCheckCode", preCheckCode);
      // console.log("compiledCode", compiledCode);
      /**
       * loader代码加载
       */
      const loader = document.createElement("script");
      loader.type = "text/javascript";
      loader.innerHTML = loadersCode.current;
      document.body.appendChild(loader);
      /**
       * 执行代码加载
       */
      const sc = document.createElement("script");
      sc.type = "text/javascript";
      sc.innerHTML = `
         System.import("${url}").catch(e=>console.error(e))
        `;
      document.body.appendChild(sc);
      // setCode(code);
    } catch (error) {
      const document: Document | undefined =
        ref.current?.contentWindow?.document;
      if (!document) {
        return;
      }
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
  const onMessage = useCallback(
    (ev) => {
      try {
        const message: ConsoleMessage = ev.detail;
        // debugger
        setConsoleMessages([...consoleMessages, message]);
      } catch (error) {
        // debugger;
      }
    },
    [consoleMessages]
  );
  const dispatchEvent = useCallback(
    (detail) => {
      const event = new CustomEvent<any>(eventId, { detail });
      window.dispatchEvent(event);
    },
    [eventId]
  );
  useEffect(() => {
    window[`dispatch_${eventId}_event`] = dispatchEvent;
    window.addEventListener(eventId, onMessage);
    // window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener(eventId, onMessage);
      // window.removeEventListener("message", onMessage);
    };
  }, [dispatchEvent, eventId, onMessage]);
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const loaders: Script[] = [
          {
            name: "systemjs",
            src: "https://unpkg.com/systemjs/dist/system.min.js",
            code: `try{${systemjs}}catch(e){}`,
          },
          {
            name: "systemjs-extra-amd",
            src: "https://unpkg.com/systemjs/dist/extras/amd.min.js",
            code: systemjsAmd,
          },
        ];
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

  const ref = useRef<HTMLIFrameElement>(null);
  const editorRef = useRef<TypeScriptRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [horizontalMaxSize, setHorizontalMaxSize] = useState<number>(9999);
  const [verticalMaxSize, setVerticalMaxSize] = useState<number>(9999);
  const caclSize = useCallback(() => {
    setHorizontalMaxSize(
      containerRef.current!.clientWidth - HORIZONTAL_BAR_SIZE
    );
    setVerticalMaxSize(containerRef.current!.clientHeight - VERTICAL_BAR_SIZE);
  }, []);
  const [consoleHeight, setConsoleHeight] = useState<number>(0);
  const caclConsoleHeight = (containerHeight) => {
    setConsoleHeight(containerHeight - HORIZONTAL_BAR_SIZE);
  };
  useEffect(() => {
    let height = 0;
    if (typeof pageDefaultSize === "string") {
      if (pageDefaultSize.includes("%")) {
        height =
          containerRef.current!.clientHeight *
          (1 - parseFloat(pageDefaultSize.replace("%", "")) / 100);
      }
    } else if (typeof pageDefaultSize === "number") {
      height = containerRef.current!.clientHeight - pageDefaultSize;
    }
    caclConsoleHeight(height);
    caclSize();
    window.addEventListener("resize", caclSize);
    return () => window.removeEventListener("resize", caclSize);
  }, [caclSize, pageDefaultSize]);
  return (
    <>
      <div
        className="sand-box"
        ref={containerRef}
        style={{ background: "#fff", height: `100vh` }}
      >
        <SplitPane
          onDragStarted={() => setDragging(true)}
          onDragFinished={() => setDragging(false)}
          pane1Style={{ position: "relative" }}
          pane2Style={{ position: "relative" }}
          split="vertical"
          defaultSize={`50%`}
          maxSize={horizontalMaxSize}
        >
          <div style={{ height: `100%` }} key="code">
            <CodeEditor.TypeScript
              ref={editorRef}
              defaultValue={pCode}
              libs={libs}
              extraLibs={extraLibs}
              onChange={debounce(run, 800)}
              {...props}
            />
          </div>
          <SplitPane
            onChange={(height) => {
              caclConsoleHeight(containerRef.current!.clientHeight - height);
            }}
            onDragStarted={() => setDragging(true)}
            onDragFinished={() => setDragging(false)}
            pane1Style={{ position: "relative" }}
            split="horizontal"
            defaultSize={pageDefaultSize}
            maxSize={verticalMaxSize}
            minSize={0}
          >
            <div key="preview" style={{ width: `100%` }}>
              {!loading && (
                <iframe
                  style={{
                    height: `100%`,
                    width: `100%`,
                    pointerEvents: dragging ? "none" : "initial",
                  }}
                  title="sb-preview"
                  ref={ref}
                />
              )}
            </div>
            <div
              key="console"
              style={{
                height: consoleHeight,
                overflow: "auto",
                padding: 8,
                boxSizing: "border-box",
              }}
            >
              {consoleMessages.map((message, i) => (
                <React.Fragment key={`msg${i}`}>
                  {message.data.map((data, i) => {
                    console.dir(data);

                    return (
                      <div style={{ paddingBottom: 8 }} key={`msg${i}`}>
                        {typeof data === "string" &&
                          message.type === "error" &&
                          data && <pre style={{ color: "red" }}>{data}</pre>}
                        {typeof data === "object" &&
                          message.type === "log" &&
                          data && (
                            <ReactJson
                              style={{ position: "static" }}
                              collapsed
                              name={null}
                              key={`msg${i}`}
                              src={data}
                            />
                          )}
                        {typeof data === "object" &&
                          message.type === "error" &&
                          data && (
                            <ReactJson
                              style={{ position: "static" }}
                              collapsed={false}
                              name={"Error"}
                              key={`msg${i}`}
                              src={{ message: data.message, stack: data.stack }}
                            />
                          )}
                        {data === null && (
                          <span style={{ color: "purple" }}>null</span>
                        )}
                        {(typeof data === "number" ||
                          typeof data === "string") &&
                          message.type === "log" && <>{data}</>}
                        {typeof data === "symbol" && (
                          <span style={{ color: "red" }}>
                            {data.toString()}
                          </span>
                        )}
                        {typeof data === "function" && (
                          <span style={{ color: "gray" }}>
                            {data.toString()}
                          </span>
                        )}
                        {typeof data === "undefined" && (
                          <span style={{ color: "#d3d3d3" }}>undefined</span>
                        )}
                        {typeof data === "boolean" && (
                          <span style={{ color: "blue" }}>
                            {data.toString()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {i !== consoleMessages.length - 1 && <ConsoleDivider />}
                </React.Fragment>
              ))}
            </div>
          </SplitPane>
        </SplitPane>
      </div>
    </>
  );
};
export default Sandbox;
