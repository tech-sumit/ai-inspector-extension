import type { EventCategory } from "../lib/event-utils.js";
import { CATEGORY_COLORS } from "../lib/event-utils.js";

const ALL_CATEGORIES: Array<{ id: EventCategory | "All"; label: string }> = [
  { id: "All", label: "All" },
  { id: "AI", label: "AI" },
  { id: "Tool", label: "Tool" },
  { id: "WebMCP", label: "WebMCP" },
  { id: "Event", label: "Events" },
  { id: "System", label: "System" },
];

interface FilterBarProps {
  active: string;
  onChange: (id: string) => void;
  eventCount: number;
  onClear: () => void;
  connected: boolean;
}

export function FilterBar({ active, onChange, eventCount, onClear, connected }: FilterBarProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "3px 8px", borderBottom: "1px solid #e0e0e0", background: "#f8f8f8", fontSize: 11, flexShrink: 0 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginRight: 6, fontSize: 10, color: connected ? "#4caf50" : "#f44336", fontWeight: 500 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: connected ? "#4caf50" : "#f44336" }} />
        {connected ? "Online" : "Offline"}
      </span>
      <span style={{ width: 1, height: 14, background: "#ddd", marginRight: 4 }} />
      <div style={{ display: "flex", gap: 1, flex: 1 }}>
        {ALL_CATEGORIES.map((cat) => {
          const isActive = active === cat.id;
          const color = cat.id === "All" ? "#333" : CATEGORY_COLORS[cat.id as EventCategory];
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              style={{
                padding: "3px 8px",
                border: "none",
                borderRadius: 3,
                background: isActive ? (cat.id === "All" ? "#e8e8e8" : `${color}18`) : "transparent",
                color: isActive ? color : "#666",
                fontWeight: isActive ? 600 : 400,
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
      <span style={{ color: "#999", fontSize: 10, marginRight: 6 }}>{eventCount} events</span>
      <button
        onClick={onClear}
        style={{ padding: "2px 8px", border: "1px solid #ddd", borderRadius: 3, background: "#fff", color: "#666", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}
      >
        Clear
      </button>
    </div>
  );
}
