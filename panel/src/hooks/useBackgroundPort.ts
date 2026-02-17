import { useEffect, useRef, useState } from "react";

/**
 * Establishes a persistent port connection to the background service worker.
 * Pattern from chrome-devtools-extension-panelDemo.
 */
export function useBackgroundPort(): chrome.runtime.Port | null {
  const [port, setPort] = useState<chrome.runtime.Port | null>(null);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.connect) return;

    const p = chrome.runtime.connect({ name: "ai-inspector-panel" });
    portRef.current = p;
    setPort(p);

    p.onDisconnect.addListener(() => {
      portRef.current = null;
      setPort(null);
    });

    return () => {
      p.disconnect();
    };
  }, []);

  return port;
}
