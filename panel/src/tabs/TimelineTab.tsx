import { useState, useMemo } from "react";
import { useInspector } from "../context/InspectorContext.js";
import { TimelineEntry } from "../components/TimelineEntry.js";

const EVENT_TYPES = [
  "ALL",
  "TOOL_REGISTERED",
  "TOOL_UNREGISTERED",
  "CONTEXT_CLEARED",
  "SESSION_CREATED",
  "PROMPT_SENT",
  "PROMPT_RESPONSE",
  "PROMPT_ERROR",
  "STREAM_START",
  "STREAM_END",
  "TOOL_CALL",
  "TOOL_RESULT_AI",
  "TOOL_ACTIVATED",
  "TOOL_CANCEL",
  "PAGE_RELOAD",
] as const;

export function TimelineTab() {
  const { state, dispatch, sendMessage } = useInspector();
  const [filter, setFilter] = useState("ALL");

  const filteredEvents = useMemo(() => {
    if (filter === "ALL") return state.events;
    return state.events.filter((e) => e.type === filter);
  }, [state.events, filter]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Event Timeline</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ border: "1px solid #ccc", borderRadius: 4, padding: "3px 6px", fontSize: 11 }}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t === "ALL" ? "All Events" : t}</option>
            ))}
          </select>
          <button
            onClick={() => {
              dispatch({ type: "CLEAR_EVENTS" });
              sendMessage({ type: "CLEAR_EVENTS" });
            }}
            style={{ border: "1px solid #ccc", borderRadius: 4, padding: "4px 10px", background: "#fff", cursor: "pointer", fontSize: 11 }}
          >
            Clear
          </button>
        </div>
      </div>
      {filteredEvents.length === 0 ? (
        <div style={{ color: "#999", padding: 20, textAlign: "center" }}>
          <p>No events recorded yet.</p>
          <p style={{ fontSize: 11 }}>Events will appear as the page uses window.ai or WebMCP tools.</p>
        </div>
      ) : (
        <div>
          {filteredEvents.map((event, i) => (
            <TimelineEntry key={i} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
