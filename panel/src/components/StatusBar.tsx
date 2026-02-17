import { useInspector } from "../context/InspectorContext.js";

export function StatusBar() {
  const { state } = useInspector();

  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 12px", borderTop: "1px solid #e0e0e0", background: "#f8f8f8", fontSize: "11px", color: "#888" }}>
      <span>{state.connected ? "Connected" : "Disconnected"}</span>
      <span>{state.events.length} events | {state.tools.length} tools</span>
    </div>
  );
}
