/**
 * ISOLATED world content script — declared in manifest content_scripts.
 *
 * Receives events from the MAIN world ai-interceptor via window.postMessage
 * and forwards them to the background service worker via chrome.runtime.sendMessage.
 *
 * Also listens for WebMCP window events (toolactivated, toolcancel).
 */

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== "ai-inspector") return;

  chrome.runtime.sendMessage({
    source: "ai-inspector",
    type: event.data.type,
    data: event.data.data,
  });
});

window.addEventListener("toolactivated", ((event: CustomEvent & { toolName?: string }) => {
  const toolName = event.toolName ?? event.detail?.toolName ?? "unknown";
  chrome.runtime.sendMessage({
    source: "ai-inspector",
    type: "TOOL_ACTIVATED",
    data: { toolName, ts: Date.now() },
  });
}) as EventListener);

window.addEventListener("toolcancel", ((event: CustomEvent & { toolName?: string }) => {
  const toolName = event.toolName ?? event.detail?.toolName ?? "unknown";
  chrome.runtime.sendMessage({
    source: "ai-inspector",
    type: "TOOL_CANCEL",
    data: { toolName, ts: Date.now() },
  });
}) as EventListener);
