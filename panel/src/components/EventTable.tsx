import { useRef, useEffect } from "react";
import type { InspectorEvent } from "../lib/event-utils.js";
import {
  TYPE_COLORS,
  getCategory,
  CATEGORY_COLORS,
  getEventName,
  getEventStatus,
  getDataSize,
  formatTime,
} from "../lib/event-utils.js";

interface EventTableProps {
  events: InspectorEvent[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function EventTable({ events, selectedIndex, onSelect }: EventTableProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(events.length);

  useEffect(() => {
    if (events.length > prevLen.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    prevLen.current = events.length;
  }, [events.length]);

  if (events.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999", fontSize: 12 }}>
        No events recorded yet.
      </div>
    );
  }

  return (
    <div style={{ overflow: "auto", height: "100%", fontSize: 11 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr style={{ position: "sticky", top: 0, background: "#f8f8f8", borderBottom: "1px solid #e0e0e0", zIndex: 1 }}>
            <th style={thStyle({ width: 130 })}>Type</th>
            <th style={thStyle({ flex: 1 })}>Name</th>
            <th style={thStyle({ width: 50 })}>Status</th>
            <th style={thStyle({ width: 58 })}>Category</th>
            <th style={thStyle({ width: 52 })}>Size</th>
            <th style={thStyle({ width: 80 })}>Time</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => {
            const isSelected = selectedIndex === i;
            const color = TYPE_COLORS[event.type] ?? "#999";
            const category = getCategory(event.type);
            const catColor = CATEGORY_COLORS[category];
            const name = getEventName(event);
            const status = getEventStatus(event);
            const size = getDataSize(event);
            const time = formatTime(event.ts as number | undefined);

            return (
              <tr
                key={i}
                onClick={() => onSelect(i)}
                style={{
                  cursor: "pointer",
                  background: isSelected ? "#e8f0fe" : i % 2 === 0 ? "#fff" : "#fafafa",
                  borderBottom: "1px solid #f0f0f0",
                }}
                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget.style.background = "#f5f7fa"); }}
                onMouseLeave={(e) => { if (!isSelected) (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa"); }}
              >
                <td style={tdStyle()}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 3, height: 12, borderRadius: 1, background: color, flexShrink: 0 }} />
                    <span style={{ color, fontWeight: 500, fontSize: 10, fontFamily: "'SF Mono', monospace" }}>{event.type}</span>
                  </span>
                </td>
                <td style={{ ...tdStyle(), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 0 }} title={name}>
                  {name}
                </td>
                <td style={tdStyle()}>
                  <span style={{ color: status.color, fontSize: 10, fontWeight: 500 }}>{status.label}</span>
                </td>
                <td style={tdStyle()}>
                  <span style={{
                    fontSize: 9,
                    padding: "1px 5px",
                    borderRadius: 3,
                    background: `${catColor}14`,
                    color: catColor,
                    fontWeight: 500,
                  }}>
                    {category}
                  </span>
                </td>
                <td style={{ ...tdStyle(), color: "#999", fontSize: 10 }}>{size}</td>
                <td style={{ ...tdStyle(), color: "#999", fontSize: 10, fontFamily: "'SF Mono', monospace" }}>{time}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div ref={endRef} />
    </div>
  );
}

function thStyle(extra: Record<string, unknown> = {}): React.CSSProperties {
  return {
    padding: "4px 6px",
    textAlign: "left",
    fontWeight: 500,
    color: "#888",
    fontSize: 10,
    borderRight: "1px solid #f0f0f0",
    whiteSpace: "nowrap",
    userSelect: "none",
    ...extra,
  } as React.CSSProperties;
}

function tdStyle(): React.CSSProperties {
  return {
    padding: "4px 6px",
    borderRight: "1px solid #f0f0f0",
    verticalAlign: "middle",
  };
}
