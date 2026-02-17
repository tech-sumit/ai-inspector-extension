import { useInspector } from "../context/InspectorContext.js";

export function StatusBar() {
  const { state } = useInspector();

  const sessionCount = state.events.filter((e) => e.type === "SESSION_CREATED").length;
  const toolCount = state.tools.length;

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "3px 10px",
      borderTop: "1px solid #e0e0e0",
      background: "#f8f8f8",
      fontSize: 10,
      color: "#888",
      flexShrink: 0,
    }}>
      <span>
        {state.events.length} events
        {sessionCount > 0 && ` · ${sessionCount} sessions`}
        {toolCount > 0 && ` · ${toolCount} tools`}
      </span>
    </div>
  );
}
