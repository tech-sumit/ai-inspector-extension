/**
 * Optional WebSocket bridge to the ai-inspector-server.
 * Connects background SW to the Node.js server for MCP client access.
 */

export class WsBridge {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(url: string): void {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[AI Inspector] Connected to server:", url);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        this.handleServerMessage(msg);
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      console.log("[AI Inspector] Disconnected from server, reconnecting...");
      this.reconnectTimer = setTimeout(() => this.connect(url), 5000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  send(msg: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private handleServerMessage(msg: Record<string, unknown>): void {
    if (msg.type === "CALL_TOOL") {
      // Forward tool call to content script via tabs API
      // This will be implemented when extension source is connected
      console.log("[AI Inspector] Server requested tool call:", msg);
    }
  }
}
