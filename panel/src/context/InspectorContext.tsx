import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode, type Dispatch } from "react";
import { flushSync } from "react-dom";
import { useBackgroundPort } from "../hooks/useBackgroundPort.js";

interface InspectorEvent {
  type: string;
  [key: string]: unknown;
}

interface InspectorState {
  events: InspectorEvent[];
  connected: boolean;
}

type Action =
  | { type: "SET_STATE"; events: InspectorEvent[] }
  | { type: "ADD_EVENT"; event: InspectorEvent }
  | { type: "CLEAR_EVENTS" }
  | { type: "PAGE_RELOAD" }
  | { type: "SET_CONNECTED"; connected: boolean };

function reducer(state: InspectorState, action: Action): InspectorState {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, events: action.events };
    case "ADD_EVENT":
      return { ...state, events: [...state.events, action.event] };
    case "CLEAR_EVENTS":
      return { ...state, events: [] };
    case "PAGE_RELOAD":
      return { ...state, events: [...state.events, { type: "PAGE_RELOAD", ts: Date.now() }] };
    case "SET_CONNECTED":
      return { ...state, connected: action.connected };
    default:
      return state;
  }
}

const initialState: InspectorState = {
  events: [],
  connected: false,
};

interface InspectorContextValue {
  state: InspectorState;
  dispatch: Dispatch<Action>;
  /** Send a message to the background service worker via the port. */
  sendMessage: (msg: Record<string, unknown>) => void;
}

const InspectorContext = createContext<InspectorContextValue | null>(null);

export function InspectorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const port = useBackgroundPort();

  const getTabId = (): number | undefined =>
    chrome.devtools?.inspectedWindow
      ? (chrome.devtools.inspectedWindow as unknown as { tabId: number }).tabId
      : undefined;

  const sendMessage = useCallback((msg: Record<string, unknown>) => {
    if (!port) return;
    const tabId = getTabId();
    port.postMessage({ tabId, ...msg });
  }, [port]);

  useEffect(() => {
    if (!port) return;

    dispatch({ type: "SET_CONNECTED", connected: true });

    const handler = (msg: Record<string, unknown>) => {
      flushSync(() => {
        if (msg.type === "STATE") {
          dispatch({
            type: "SET_STATE",
            events: (msg.events ?? []) as InspectorEvent[],
          });
        } else if (msg.type === "EVENT") {
          dispatch({ type: "ADD_EVENT", event: msg.event as InspectorEvent });
        } else if (msg.type === "PAGE_RELOAD") {
          dispatch({ type: "PAGE_RELOAD" });
        }
        // TOOLS_UPDATE messages are ignored — tool info is derived from events
      });
    };

    port.onMessage.addListener(handler);

    const tabId = getTabId();
    if (tabId) {
      port.postMessage({ type: "GET_STATE", tabId });
    }

    return () => {
      port.onMessage.removeListener(handler);
      dispatch({ type: "SET_CONNECTED", connected: false });
    };
  }, [port]);

  return (
    <InspectorContext.Provider value={{ state, dispatch, sendMessage }}>
      {children}
    </InspectorContext.Provider>
  );
}

export function useInspector(): InspectorContextValue {
  const ctx = useContext(InspectorContext);
  if (!ctx) throw new Error("useInspector must be used within InspectorProvider");
  return ctx;
}
