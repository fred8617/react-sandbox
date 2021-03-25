import { FC, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import * as monaco from "monaco-editor";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import prettier from "prettier/standalone";
import babel from "prettier/parser-babel";
import gql from "prettier/parser-graphql";
import ts from "prettier/parser-typescript";
export interface CodeEditorProps
  extends monaco.editor.IStandaloneEditorConstructionOptions {
  beforeMount?(monaco: typeof monacoEditor);
  didMount?(
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof monacoEditor
  );
  onChange?(code: string, event?: monaco.editor.IModelContentChangedEvent);
  defaultValue?: string;
}
const CodeEditor: FC<CodeEditorProps> & { TypeScript: typeof TypeScript } = ({
  beforeMount,
  onChange,
  ...props
}) => {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    beforeMount?.(monaco);
    const editor = monaco.editor.create(container.current!, {
      automaticLayout: true,
      minimap: { enabled: false },
      ...props,
    });
    editor.onDidChangeModelContent((event) => {
      onChange?.(editor.getValue(), event);
    });
    return () => {
      editor.dispose();
    };
  }, []);
  return (
    <>
      <div style={{ height: `100%`, width: `100%` }} ref={container} />
    </>
  );
};
export interface TypeScriptProps extends CodeEditorProps {
  /**
   * ts编辑器外置库
   */
  libs?: { [key: string]: string };
  /**
   * ts自定义d.ts
   */
  extraLibs?: { [key: string]: string };
  /**
   * node_module种的code
   */
  libCode?: { [key: string]: string };
  /**
   * 定义
   */
  defs?: string;
}
interface ModelRef {
  model: monaco.editor.ITextModel;
  monaco: typeof monaco;
}
export interface TypeScriptRef extends ModelRef {}
const TypeScript = forwardRef<TypeScriptRef, TypeScriptProps>(
  (
    {
      defs = "",
      defaultValue = ``,
      libs = {},
      extraLibs = {},
      libCode = {},
      ...props
    },
    ref
  ) => {
    const model = useRef<monaco.editor.ITextModel>();
    const monacoRef = useRef<typeof monaco>();
    if (!model.current) {
      //   debugger
      const uri = monaco.Uri.file("/main.tsx");
      const ifExsitModel = monaco.editor.getModel(uri);
      // debugger
      if (ifExsitModel && !ifExsitModel?.isDisposed()) {
        model.current = ifExsitModel;
      } else {
        model.current = monaco.editor.createModel(
          defaultValue,
          "typescript",
          uri
        );
      }
    }
    useImperativeHandle(ref, () => ({
      model: model.current!,
      monaco: monacoRef.current!,
    }));
    useEffect(() => {
      return () => {
        model.current?.dispose();
      };
    }, []);
    const loadLibs = () => {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        defs,
        `file:///node_modules/@types/index.d.ts`
      );
      Object.entries(libs).map(([name, code]) => {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          code,
          `file:///node_modules/@types/${name}/index.d.ts`
        );
      });
      Object.entries(extraLibs).map(([name, code]) => {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          code,
          `file:///node_modules/@types/${name}`
        );
      });
    };
    useEffect(() => {
      loadLibs();
      props.onChange?.(model.current?.getValue()!);
      return () => {};
    }, [libs]);
    return (
      <CodeEditor
        model={model.current}
        didMount={() => {}}
        beforeMount={(monaco) => {
          monacoRef.current = monaco;
          const compilerDefaults: monaco.languages.typescript.CompilerOptions = {
            baseUrl: "file:///node_modules/@types/",
            allowSyntheticDefaultImports: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            experimentalDecorators: true,
            noEmit: true,
            allowJs: true,
            types: ["react"],
          };

          monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
            compilerDefaults
          );

          monaco.languages.typescript.typescriptDefaults.setEagerModelSync(
            true
          );
          const prettierOptions = {
            provideDocumentFormattingEdits(model) {
              return [
                {
                  range: model.getFullModelRange(),
                  text: prettier.format(model.getValue(), {
                    trailingComma: "all",
                    jsxSingleQuote: false,
                    semi: true,
                    plugins: [babel, ts, gql],
                    parser: "babel-ts",
                    arrowParens: "always",
                    bracketSpacing: true,
                    htmlWhitespaceSensitivity: "css",
                    insertPragma: false,
                    jsxBracketSameLine: true,
                    printWidth: 80,
                    proseWrap: "preserve",
                    quoteProps: "as-needed",
                    requirePragma: false,
                    singleQuote: false,
                    tabWidth: 2,
                    useTabs: false,
                    vueIndentScriptAndStyle: false,
                  }),
                },
              ];
            },
          };
          monaco.languages.registerDocumentFormattingEditProvider(
            "typescript",
            prettierOptions
          );

          monaco.languages.registerCompletionItemProvider("typescript", {
            provideCompletionItems: function (model, position) {
              var word = model.getWordUntilPosition(position);
              var range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
              };
              return {
                suggestions: [
                  {
                    label: "log",
                    kind: monaco.languages.CompletionItemKind.Function,
                    documentation: "console.log",
                    insertText: "console.log($1)",
                    insertTextRules:
                      monaco.languages.CompletionItemInsertTextRule
                        .InsertAsSnippet,
                    range: range,
                  },
                  {
                    label: "error",
                    kind: monaco.languages.CompletionItemKind.Function,
                    documentation: "console.error",
                    insertText: "console.error($1)",
                    insertTextRules:
                      monaco.languages.CompletionItemInsertTextRule
                        .InsertAsSnippet,
                    range: range,
                  },
                  {
                    label: "stringify",
                    kind: monaco.languages.CompletionItemKind.Function,
                    documentation: "console.log",
                    insertText: "console.log(JSON.stringify($1,null,2))",
                    insertTextRules:
                      monaco.languages.CompletionItemInsertTextRule
                        .InsertAsSnippet,
                    range: range,
                  },
                  {
                    label: "for",
                    kind: monaco.languages.CompletionItemKind.Function,
                    documentation: "for circle",
                    insertText: `for(let $\{1:index} = 0; $\{1:index} < $\{2:array}.length; $\{1:index}++){
  let $\{3:element} = $\{2:array}[$\{1:index}]
}`,
                    insertTextRules:
                      monaco.languages.CompletionItemInsertTextRule
                        .InsertAsSnippet,
                    range: range,
                  },
                  {
                    label: "while",
                    kind: monaco.languages.CompletionItemKind.Function,
                    documentation: "while circle",
                    insertText: `while($\{1:condition}){
 
}`,
                    insertTextRules:
                      monaco.languages.CompletionItemInsertTextRule
                        .InsertAsSnippet,
                    range: range,
                  },
                ],
              };
            },
          });
          loadLibs();
        }}
        scrollbar={{}}
        {...props}
      />
    );
  }
);
CodeEditor.TypeScript = TypeScript;
export default CodeEditor;
