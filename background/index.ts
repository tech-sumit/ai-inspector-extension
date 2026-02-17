/**
 * Background service worker.
 *
 * Receives events from bridge.ts content script, stores them in per-tab EventStore,
 * and forwards to connected DevTools panel ports.
 */

import { EventStore } from "./event-store.js";
import { TabManager } from "./tab-manager.js";

const eventStore = new EventStore();
const tabManager = new TabManager();

/**
 * Derive the current list of registered tools by replaying event history.
 * Handles TOOL_REGISTERED, TOOL_UNREGISTERED, CONTEXT_CLEARED, and PAGE_RELOAD.
 */
function deriveToolsFromEvents(
  events: Array<Record<string, unknown>>,
): Array<{ name: string; description: string; inputSchema: string }> {
  const tools = new Map<string, { name: string; description: string; inputSchema: string }>();
  for (const event of events) {
    if (event.type === "TOOL_REGISTERED" && event.tool) {
      const tool = event.tool as { name: string; description?: string; inputSchema?: unknown };
      tools.set(tool.name, {
        name: tool.name,
        description: tool.description ?? "",
        inputSchema:
          typeof tool.inputSchema === "string"
            ? tool.inputSchema
            : JSON.stringify(tool.inputSchema ?? {}),
      });
    } else if (event.type === "TOOL_UNREGISTERED" && typeof event.name === "string") {
      tools.delete(event.name);
    } else if (event.type === "CONTEXT_CLEARED" || event.type === "PAGE_RELOAD") {
      tools.clear();
    }
  }
  return Array.from(tools.values());
}

const TOOL_EVENT_TYPES = new Set([
  "TOOL_REGISTERED",
  "TOOL_UNREGISTERED",
  "CONTEXT_CLEARED",
]);

// Receive events from content script (bridge.ts)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.source !== "ai-inspector") return;
  const tabId = sender.tab?.id;
  if (!tabId) return;

  const event = { type: msg.type, ...msg.data };
  eventStore.add(tabId, event);
  tabManager.notifyPanel(tabId, { type: "EVENT", event });

  // When tool-related events arrive, recompute the derived tool list and
  // push a TOOLS_UPDATE so the panel's state.tools stays in sync without
  // requiring a manual refresh.
  if (TOOL_EVENT_TYPES.has(msg.type)) {
    const tools = deriveToolsFromEvents(eventStore.getAll(tabId));
    tabManager.notifyPanel(tabId, { type: "TOOLS_UPDATE", tools });
    updateBadge(tabId);
  }

  sendResponse({ ok: true });
});

// Panel connects via port
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "ai-inspector-panel") return;

  port.onMessage.addListener((msg) => {
    if (msg.type === "GET_STATE") {
      const tabId = msg.tabId;
      tabManager.associateTab(port, tabId);
      const events = eventStore.getAll(tabId);
      port.postMessage({
        type: "STATE",
        events,
        tools: deriveToolsFromEvents(events),
      });
    }
    if (msg.type === "EXECUTE_TOOL") {
      const tabId = msg.tabId;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          action: "EXECUTE_TOOL",
          name: msg.name,
          inputArgs: msg.inputArguments,
        }).catch(() => {
          // Tab may be closed or content script not loaded
        });
      }
    }
    if (msg.type === "CLEAR_EVENTS") {
      const tabId = msg.tabId;
      if (tabId) {
        eventStore.clear(tabId);
        port.postMessage({
          type: "STATE",
          events: [],
          tools: [],
        });
      }
    }
  });

  port.onDisconnect.addListener(() => {
    tabManager.unregisterPanel(port);
  });

  tabManager.registerPanel(port);
});

// Re-inject MAIN world interceptor on navigation.
// PAGE_RELOAD clears all tools, so we also send TOOLS_UPDATE and update the badge.
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    eventStore.add(tabId, { type: "PAGE_RELOAD", ts: Date.now() });
    tabManager.notifyPanel(tabId, { type: "PAGE_RELOAD" });
    tabManager.notifyPanel(tabId, { type: "TOOLS_UPDATE", tools: [] });
    updateBadge(tabId);

    chrome.scripting
      .executeScript({
        target: { tabId },
        world: "MAIN",
        files: ["content/ai-interceptor.js"],
      })
      .catch(() => {
        // Ignore errors on chrome:// or restricted pages
      });
  }
});

/** Update the extension badge with the current tool count for a specific tab. */
function updateBadge(tabId: number): void {
  const events = eventStore.getAll(tabId);
  const toolCount = deriveToolsFromEvents(events).length;
  chrome.action.setBadgeText({ tabId, text: toolCount > 0 ? String(toolCount) : "" });
}

// Update badge when user switches tabs
chrome.tabs.onActivated.addListener(({ tabId }) => {
  updateBadge(tabId);
});
