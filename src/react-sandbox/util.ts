import * as monaco from "monaco-editor";
export const getDiagsMessages = (
  diags: (
    | monaco.languages.typescript.Diagnostic
    | monaco.languages.typescript.DiagnosticMessageChain
  )[],
  cagegoryLevel: number = 1,
  messages: string[] = []
) => {
  diags.forEach((diag) => {
    const { messageText, category } = diag;
    if (typeof messageText === "string" && category === cagegoryLevel) {
      messages.push(messageText);
    } else {
      messages.push(
        (messageText as monaco.languages.typescript.DiagnosticMessageChain)
          .messageText
      );
      const {
        next,
      } = messageText as monaco.languages.typescript.DiagnosticMessageChain;
      if (next) {
        getDiagsMessages(next, cagegoryLevel, messages);
      }
    }
  });
  return messages;
};
