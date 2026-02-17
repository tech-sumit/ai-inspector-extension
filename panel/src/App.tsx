import { useState, useMemo, useCallback } from "react";
import { InspectorProvider, useInspector } from "./context/InspectorContext.js";
import { FilterBar } from "./components/FilterBar.js";
import { EventTable } from "./components/EventTable.js";
import { EventDetail } from "./components/EventDetail.js";
import { StatusBar } from "./components/StatusBar.js";
import { getCategory } from "./lib/event-utils.js";

export function App() {
  return (
    <InspectorProvider>
      <NetworkPanel />
    </InspectorProvider>
  );
}

function NetworkPanel() {
  const { state, dispatch, sendMessage } = useInspector();
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const filteredEvents = useMemo(() => {
    if (categoryFilter === "All") return state.events;
    return state.events.filter((e) => getCategory(e.type) === categoryFilter);
  }, [state.events, categoryFilter]);

  const selectedEvent = selectedIndex !== null ? filteredEvents[selectedIndex] ?? null : null;

  const handleFilterChange = useCallback((id: string) => {
    setCategoryFilter(id);
    setSelectedIndex(null);
  }, []);

  const handleClear = useCallback(() => {
    dispatch({ type: "CLEAR_EVENTS" });
    sendMessage({ type: "CLEAR_EVENTS" });
    setSelectedIndex(null);
  }, [dispatch, sendMessage]);

  const handleSelect = useCallback((index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: 12,
      color: "#333",
      background: "#fff",
    }}>
      {/* Filter bar */}
      <FilterBar
        active={categoryFilter}
        onChange={handleFilterChange}
        eventCount={filteredEvents.length}
        onClear={handleClear}
        connected={state.connected}
      />

      {/* Main content: table + detail pane */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Event list table */}
        <div style={{ flex: selectedEvent ? "0 0 55%" : 1, overflow: "hidden", transition: "flex 0.15s ease" }}>
          <EventTable
            events={filteredEvents}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
          />
        </div>

        {/* Detail pane - slides in from right */}
        {selectedEvent && (
          <div style={{ flex: "0 0 45%", overflow: "hidden" }}>
            <EventDetail event={selectedEvent} onClose={handleClose} />
          </div>
        )}
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}
