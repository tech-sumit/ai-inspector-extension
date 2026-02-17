import { useMemo } from "react";
import { useInspector } from "../context/InspectorContext.js";
import { SessionCard } from "../components/SessionCard.js";

interface SessionData {
  sessionId: string;
  options?: Record<string, unknown>;
  prompts: Array<{ type: string; [key: string]: unknown }>;
}

export function AISessionsTab() {
  const { state } = useInspector();

  const sessions = useMemo(() => {
    const sessMap = new Map<string, SessionData>();

    for (const event of state.events) {
      if (event.type === "SESSION_CREATED") {
        const sid = event.sessionId as string;
        sessMap.set(sid, {
          sessionId: sid,
          options: event.options as Record<string, unknown>,
          prompts: [],
        });
      }
      if (
        event.type === "PROMPT_SENT" ||
        event.type === "PROMPT_RESPONSE" ||
        event.type === "PROMPT_ERROR"
      ) {
        const sid = event.sessionId as string;
        const session = sessMap.get(sid);
        if (session) {
          session.prompts.push(event);
        }
      }
    }

    return Array.from(sessMap.values());
  }, [state.events]);

  return (
    <div>
      <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>
        LanguageModel Sessions
      </h3>
      {sessions.length === 0 ? (
        <div style={{ color: "#999", padding: 20, textAlign: "center" }}>
          <p>No AI sessions detected.</p>
          <p style={{ fontSize: 11 }}>
            Sessions will appear when the page calls{" "}
            <code>LanguageModel.create()</code>
          </p>
        </div>
      ) : (
        sessions.map((session) => (
          <SessionCard
            key={session.sessionId}
            sessionId={session.sessionId}
            options={session.options}
            prompts={session.prompts}
          />
        ))
      )}
    </div>
  );
}
