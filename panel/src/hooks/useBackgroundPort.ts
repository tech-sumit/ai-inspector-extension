import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Establishes a persistent port connection to the background service worker.
 * Auto-reconnects when the MV3 service worker terminates and the port drops.
 */
export function useBackgroundPort(): chrome.runtime.Port | null {
  const [port, setPort] = useState<chrome.runtime.Port | null>(null);
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disposed = useRef(false);
  const connectAttempt = useRef(0);

  const connect = useCallback(() => {
    if (disposed.current) return;
    if (typeof chrome === "undefined" || !chrome.runtime?.connect) return;

    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }

    const attempt = ++connectAttempt.current;

    try {
      const p = chrome.runtime.connect({ name: "ai-inspector-panel" });

      p.onDisconnect.addListener(() => {
        const err = chrome.runtime.lastError;
        const msg = err?.message ?? "(no error)";
        console.warn("[AI Inspector] Port disconnected:", msg);
        portRef.current = null;
        setPort(null);
        if (msg.includes("Extension context invalidated")) {
          disposed.current = true;
          return;
        }
        if (!disposed.current) {
          const delay = Math.min(1000 * Math.pow(2, Math.min(attempt - 1, 4)), 16000);
          console.info("[AI Inspector] Reconnecting in", delay, "ms (attempt", attempt, ")");
          retryTimer.current = setTimeout(connect, delay);
        }
      });

      if (chrome.runtime.lastError) {
        console.error("[AI Inspector] Connect error:", chrome.runtime.lastError.message);
        return;
      }

      portRef.current = p;
      setPort(p);
      connectAttempt.current = 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Extension context invalidated")) {
        console.warn("[AI Inspector] Extension context invalidated — stopping reconnect.");
        disposed.current = true;
        return;
      }
      console.error("[AI Inspector] Connect threw:", err);
      if (!disposed.current) {
        retryTimer.current = setTimeout(connect, 2000);
      }
    }
  }, []);

  useEffect(() => {
    disposed.current = false;
    connect();

    return () => {
      disposed.current = true;
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
      if (portRef.current) {
        portRef.current.disconnect();
        portRef.current = null;
      }
    };
  }, [connect]);

  return port;
}
