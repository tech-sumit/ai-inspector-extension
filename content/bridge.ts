/**
 * ISOLATED world content script — declared in manifest content_scripts.
 *
 * Receives events from the MAIN world ai-interceptor via window.postMessage
 * and forwards them to the background service worker via chrome.runtime.sendMessage.
 *
 * Also listens for WebMCP window events (toolactivated, toolcancel).
 */

/** Send to background, logging errors when the service worker is inactive. */
function forward(msg: Record<string, unknown>) {
  try {
    chrome.runtime?.sendMessage(msg).catch((err: unknown) => {
      console.warn("[WebMCP Debugger Bridge] sendMessage failed:", err);
    });
  } catch (err) {
    console.warn("[WebMCP Debugger Bridge] Extension context invalidated:", err);
  }
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== "webmcp-debugger") return;

  forward({
    source: "webmcp-debugger",
    type: event.data.type,
    data: event.data.data,
  });
});

window.addEventListener("toolactivated", ((event: CustomEvent & { toolName?: string }) => {
  const toolName = event.toolName ?? event.detail?.toolName ?? "unknown";
  forward({
    source: "webmcp-debugger",
    type: "TOOL_ACTIVATED",
    data: { toolName, ts: Date.now() },
  });
}) as EventListener);

window.addEventListener("toolcancel", ((event: CustomEvent & { toolName?: string }) => {
  const toolName = event.toolName ?? event.detail?.toolName ?? "unknown";
  forward({
    source: "webmcp-debugger",
    type: "TOOL_CANCEL",
    data: { toolName, ts: Date.now() },
  });
}) as EventListener);
