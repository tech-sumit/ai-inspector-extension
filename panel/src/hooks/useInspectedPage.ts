import { useCallback } from "react";

/**
 * Wrapper around chrome.devtools.inspectedWindow.eval() for evaluating
 * expressions in the inspected page context.
 */
export function useInspectedPage() {
  const evaluate = useCallback((expression: string): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      if (typeof chrome === "undefined" || !chrome.devtools?.inspectedWindow) {
        reject(new Error("Not in a DevTools context"));
        return;
      }
      chrome.devtools.inspectedWindow.eval(expression, (result, exceptionInfo) => {
        if (exceptionInfo) {
          reject(new Error(exceptionInfo.description ?? "Evaluation failed"));
        } else {
          resolve(result);
        }
      });
    });
  }, []);

  return { evaluate };
}
