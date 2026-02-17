import { useState } from "react";
import type { InspectorEvent } from "../lib/event-utils.js";
import {
  TYPE_COLORS,
  getCategory,
  getEventName,
  getEventStatus,
  getPayload,
  getResponse,
  getHeaders,
  formatTime,
  getDataSize,
} from "../lib/event-utils.js";

interface EventDetailProps {
  event: InspectorEvent;
  onClose: () => void;
}

const TABS = ["Headers", "Payload", "Response", "Timing", "Raw"] as const;
type Tab = (typeof TABS)[number];

export function EventDetail({ event, onClose }: EventDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Headers");
  const color = TYPE_COLORS[event.type] ?? "#999";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", borderLeft: "1px solid #e0e0e0", background: "#fff", fontSize: 11 }}>
      {/* Tab bar */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #e0e0e0", background: "#f8f8f8", flexShrink: 0 }}>
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "5px 10px",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid #1a73e8" : "2px solid transparent",
                background: "none",
                color: activeTab === tab ? "#1a73e8" : "#666",
                fontWeight: activeTab === tab ? 600 : 400,
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ padding: "2px 8px", border: "none", background: "none", color: "#999", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }} title="Close">
          ×
        </button>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 12px" }}>
        {activeTab === "Headers" && <HeadersView event={event} color={color} />}
        {activeTab === "Payload" && <PayloadView event={event} />}
        {activeTab === "Response" && <ResponseView event={event} />}
        {activeTab === "Timing" && <TimingView event={event} />}
        {activeTab === "Raw" && <RawView event={event} />}
      </div>
    </div>
  );
}

/* ── Headers Tab ────────────────────────────────────────────── */

function HeadersView({ event, color }: { event: InspectorEvent; color: string }) {
  const headers = getHeaders(event);
  const status = getEventStatus(event);
  const name = getEventName(event);

  return (
    <div>
      {/* General section */}
      <SectionHeader>General</SectionHeader>
      <div style={{ marginBottom: 12 }}>
        <InfoRow label="Event Type">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
            <strong>{event.type}</strong>
          </span>
        </InfoRow>
        <InfoRow label="Name">{name}</InfoRow>
        <InfoRow label="Status">
          <span style={{ color: status.color, fontWeight: 500 }}>{status.label}</span>
        </InfoRow>
        <InfoRow label="Category">{getCategory(event.type)}</InfoRow>
        <InfoRow label="Size">{getDataSize(event)}</InfoRow>
      </div>

      {/* Headers section */}
      <SectionHeader>Event Headers</SectionHeader>
      <div>
        {headers.map(([key, value]) => (
          <InfoRow key={key} label={key}>{value}</InfoRow>
        ))}
      </div>
    </div>
  );
}

/* ── Payload Tab ────────────────────────────────────────────── */

function PayloadView({ event }: { event: InspectorEvent }) {
  const payload = getPayload(event);
  if (!payload) {
    return <EmptyState>No payload data for this event type.</EmptyState>;
  }
  return (
    <div>
      <SectionHeader>Request Payload</SectionHeader>
      <JsonBlock data={payload} />
    </div>
  );
}

/* ── Response Tab ───────────────────────────────────────────── */

function ResponseView({ event }: { event: InspectorEvent }) {
  const response = getResponse(event);
  if (!response) {
    return <EmptyState>No response data for this event type.</EmptyState>;
  }

  // Show text content first if available, then the full JSON
  const textContent = response.result ?? response.error;
  return (
    <div>
      {typeof textContent === "string" && (
        <>
          <SectionHeader>Response Body</SectionHeader>
          <pre style={preStyle}>{textContent}</pre>
        </>
      )}
      <SectionHeader>Response Data</SectionHeader>
      <JsonBlock data={response} />
    </div>
  );
}

/* ── Timing Tab ─────────────────────────────────────────────── */

function TimingView({ event }: { event: InspectorEvent }) {
  const ts = event.ts as number | undefined;
  return (
    <div>
      <SectionHeader>Timing</SectionHeader>
      <InfoRow label="Timestamp">{ts ? formatTime(ts) : "—"}</InfoRow>
      <InfoRow label="ISO">{ts ? new Date(ts).toISOString() : "—"}</InfoRow>
      <InfoRow label="Epoch (ms)">{ts ? String(ts) : "—"}</InfoRow>
      {event.sessionId && (
        <InfoRow label="Session">{String(event.sessionId)}</InfoRow>
      )}
    </div>
  );
}

/* ── Raw Tab ────────────────────────────────────────────────── */

function RawView({ event }: { event: InspectorEvent }) {
  return (
    <div>
      <SectionHeader>Raw Event Data</SectionHeader>
      <JsonBlock data={event} />
    </div>
  );
}

/* ── Shared primitives ──────────────────────────────────────── */

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontWeight: 600, fontSize: 11, color: "#333", padding: "6px 0 4px", borderBottom: "1px solid #f0f0f0", marginBottom: 4 }}>
      {children}
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", padding: "3px 0", borderBottom: "1px solid #f8f8f8", gap: 8 }}>
      <span style={{ color: "#888", minWidth: 90, fontWeight: 500, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: "#333", wordBreak: "break-all" }}>{children}</span>
    </div>
  );
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre style={preStyle}>{JSON.stringify(data, null, 2)}</pre>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: "#999", padding: 20, textAlign: "center", fontSize: 11 }}>
      {children}
    </div>
  );
}

const preStyle: React.CSSProperties = {
  background: "#f5f5f5",
  padding: 8,
  borderRadius: 4,
  fontSize: 10,
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  overflow: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  margin: "4px 0 12px",
  maxHeight: 300,
};
