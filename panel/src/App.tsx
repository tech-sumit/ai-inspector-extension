import { useState, useMemo, useCallback } from "react";
import { InspectorProvider, useInspector } from "./context/InspectorContext.js";
import { FilterBar } from "./components/FilterBar.js";
import { EventTable } from "./components/EventTable.js";
import { EventDetail } from "./components/EventDetail.js";
import { StatusBar } from "./components/StatusBar.js";
import { getCategory } from "./lib/event-utils.js";
import { mergeEvents } from "./lib/merge-events.js";

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

  const entries = useMemo(() => mergeEvents(filteredEvents), [filteredEvents]);

  const selectedEntry = selectedIndex !== null ? entries[selectedIndex] ?? null : null;

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

  const handleExecuteTool = useCallback((name: string, args: Record<string, unknown>) => {
    sendMessage({ type: "EXECUTE_TOOL", name, inputArguments: args });
  }, [sendMessage]);

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
      <FilterBar
        active={categoryFilter}
        onChange={handleFilterChange}
        eventCount={entries.length}
        onClear={handleClear}
        connected={state.connected}
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: selectedEntry ? "0 0 55%" : 1, overflow: "hidden", transition: "flex 0.15s ease" }}>
          <EventTable
            entries={entries}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            compact={!!selectedEntry}
          />
        </div>

        {selectedEntry && (
          <div style={{ flex: "0 0 45%", overflow: "hidden" }}>
            <EventDetail
              entry={selectedEntry}
              onClose={handleClose}
              onExecuteTool={handleExecuteTool}
            />
          </div>
        )}
      </div>

      <StatusBar />
    </div>
  );
}
