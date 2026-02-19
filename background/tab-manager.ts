/**
 * Manages connected DevTools panel ports, tracking which tab each port inspects.
 *
 * Ports are associated with a tabId when the panel sends its first GET_STATE
 * message (which always includes a tabId). Notifications are filtered so each
 * panel only receives events for its inspected tab.
 */

export class TabManager {
  private portToTab = new Map<chrome.runtime.Port, number>();
  private ports = new Set<chrome.runtime.Port>();

  registerPanel(port: chrome.runtime.Port): void {
    this.ports.add(port);
  }

  unregisterPanel(port: chrome.runtime.Port): void {
    this.ports.delete(port);
    this.portToTab.delete(port);
  }

  /** Associate a port with the tab it's inspecting. */
  associateTab(port: chrome.runtime.Port, tabId: number): void {
    this.portToTab.set(port, tabId);
  }

  /** Get the tabId associated with a port. */
  getTabId(port: chrome.runtime.Port): number | undefined {
    return this.portToTab.get(port);
  }

  /** Send a message only to panels inspecting a specific tab. */
  notifyPanel(tabId: number, message: Record<string, unknown>): void {
    for (const port of this.ports) {
      const portTabId = this.portToTab.get(port);
      // Send to ports associated with this tab, or unassociated ports (not yet initialized)
      if (portTabId === undefined || portTabId === tabId) {
        try {
          port.postMessage(message);
        } catch (err) {
          console.warn("[WebMCP Debugger BG] Port postMessage failed, removing port:", err);
          this.ports.delete(port);
          this.portToTab.delete(port);
        }
      }
    }
  }
}
