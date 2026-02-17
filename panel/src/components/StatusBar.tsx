import { useMemo } from "react";
import { useInspector } from "../context/InspectorContext.js";

export function StatusBar() {
  const { state } = useInspector();

  const sessionCount = useMemo(
    () => state.events.filter((e) => e.type === "SESSION_CREATED").length,
    [state.events],
  );

  const toolCount = useMemo(() => {
    const registered = new Set<string>();
    for (const e of state.events) {
      if (e.type === "TOOL_REGISTERED") {
        const t = e.tool as Record<string, unknown> | undefined;
        if (t?.name) registered.add(String(t.name));
      } else if (e.type === "TOOL_UNREGISTERED" && typeof e.name === "string") {
        registered.delete(e.name);
      } else if (e.type === "CONTEXT_CLEARED" || e.type === "PAGE_RELOAD") {
        registered.clear();
      }
    }
    return registered.size;
  }, [state.events]);

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
        {sessionCount > 0 && `${sessionCount} session${sessionCount !== 1 ? "s" : ""}`}
        {sessionCount > 0 && toolCount > 0 && " · "}
        {toolCount > 0 && `${toolCount} tool${toolCount !== 1 ? "s" : ""}`}
        {sessionCount === 0 && toolCount === 0 && "Ready"}
      </span>
    </div>
  );
}
