/**
 * MAIN world content script — injected via chrome.scripting.executeScript({ world: 'MAIN' }).
 *
 * Monkey-patches LanguageModel (window.ai) and navigator.modelContext to intercept
 * all AI activity. Posts events to the ISOLATED world bridge via window.postMessage.
 */

export {};

interface AiInspectorEmitter {
  emit(type: string, data: Record<string, unknown>): void;
}

const __aiInspector: AiInspectorEmitter = {
  emit(type: string, data: Record<string, unknown>) {
    window.postMessage({ source: "ai-inspector", type, data }, "*");
  },
};

(function interceptLanguageModel() {
  // @ts-expect-error LanguageModel is an experimental Chrome API
  const LM = globalThis.LanguageModel;
  if (!LM?.create) return;

  const originalCreate = LM.create.bind(LM);
  LM.create = async function (options: Record<string, unknown>) {
    const session = await originalCreate(options);
    const sessionId = crypto.randomUUID();

    // Wrap prompt()
    if (typeof session.prompt === "function") {
      const originalPrompt = session.prompt.bind(session);
      session.prompt = async function (input: unknown, opts?: unknown) {
        __aiInspector.emit("PROMPT_SENT", { sessionId, input, opts, ts: Date.now() });
        try {
          const result = await originalPrompt(input, opts);
          __aiInspector.emit("PROMPT_RESPONSE", { sessionId, result, ts: Date.now() });
          return result;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          __aiInspector.emit("PROMPT_ERROR", { sessionId, error: message, ts: Date.now() });
          throw err;
        }
      };
    }

    // Wrap promptStreaming()
    if (typeof session.promptStreaming === "function") {
      const originalStream = session.promptStreaming.bind(session);
      session.promptStreaming = function (input: unknown, opts?: unknown) {
        __aiInspector.emit("STREAM_START", { sessionId, input, opts, ts: Date.now() });
        const stream = originalStream(input, opts);
        return new ReadableStream({
          async start(controller: ReadableStreamDefaultController) {
            const reader = stream.getReader();
            let fullText = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += value;
                controller.enqueue(value);
              }
              __aiInspector.emit("STREAM_END", { sessionId, result: fullText, ts: Date.now() });
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          },
        });
      };
    }

    // Wrap tool execute callbacks if tool-use is configured
    const tools = options?.tools;
    if (Array.isArray(tools)) {
      for (const tool of tools) {
        if (typeof tool.execute === "function") {
          const origExecute = tool.execute.bind(tool);
          tool.execute = async function (args: unknown) {
            __aiInspector.emit("TOOL_CALL", {
              sessionId, tool: tool.name, args, ts: Date.now(),
            });
            const result = await origExecute(args);
            __aiInspector.emit("TOOL_RESULT_AI", {
              sessionId, tool: tool.name, result, ts: Date.now(),
            });
            return result;
          };
        }
      }
    }

    __aiInspector.emit("SESSION_CREATED", {
      sessionId,
      options: {
        temperature: options?.temperature,
        topK: options?.topK,
        tools: Array.isArray(tools) ? tools.map((t: Record<string, unknown>) => t.name) : undefined,
      },
      quotaUsage: {
        inputUsed: session.inputUsed,
        inputQuota: session.inputQuota,
      },
      ts: Date.now(),
    });

    return session;
  };
})();

(function interceptModelContext() {
  const mc = navigator.modelContext;
  if (!mc) return;

  // Intercept registerTool() — used by useWebMCPTool hook for individual tool registration.
  // Events are emitted AFTER calling the original so that if it throws
  // (e.g. duplicate name, invalid schema) we don't record a false positive.
  const origRegister = mc.registerTool.bind(mc);
  mc.registerTool = function (toolDef: Record<string, unknown>) {
    const result = origRegister(toolDef);
    __aiInspector.emit("TOOL_REGISTERED", {
      tool: {
        name: toolDef.name,
        description: toolDef.description,
        inputSchema: toolDef.inputSchema,
        annotations: toolDef.annotations,
      },
      ts: Date.now(),
    });
    return result;
  };

  // Intercept unregisterTool() — called on component unmount by useWebMCPTool.
  // Per WebIDL: throws InvalidStateError if tool not found.
  if (typeof mc.unregisterTool === "function") {
    const origUnregister = mc.unregisterTool.bind(mc);
    mc.unregisterTool = function (name: string) {
      const result = origUnregister(name);
      __aiInspector.emit("TOOL_UNREGISTERED", { name, ts: Date.now() });
      return result;
    };
  }

  // Intercept provideContext() — used by useWebMCPContext hook for bulk tool registration.
  // Per WebIDL: provideContext(ProvideContextParams { tools: sequence<ToolRegistrationParams> })
  // This replaces all currently registered tools with the provided set.
  // The spec makes this atomic: on error it rolls back to the previous state.
  // We emit events AFTER the call succeeds to avoid recording a replacement
  // that was actually rolled back.
  if (typeof mc.provideContext === "function") {
    const origProvideContext = mc.provideContext.bind(mc);
    mc.provideContext = function (params: { tools: Array<Record<string, unknown>> }) {
      const result = origProvideContext(params);

      // provideContext replaces the entire tool set, so emit CONTEXT_CLEARED first
      // so deriveToolsFromEvents correctly starts fresh for this batch.
      __aiInspector.emit("CONTEXT_CLEARED", { ts: Date.now() });

      if (Array.isArray(params?.tools)) {
        for (const toolDef of params.tools) {
          __aiInspector.emit("TOOL_REGISTERED", {
            tool: {
              name: toolDef.name,
              description: toolDef.description,
              inputSchema: toolDef.inputSchema,
              annotations: toolDef.annotations,
            },
            ts: Date.now(),
          });
        }
      }
      return result;
    };
  }

  // Intercept clearContext() — used by useWebMCPContext on component unmount.
  // Per WebIDL: clearContext() removes all registered tools.
  if (typeof mc.clearContext === "function") {
    const origClearContext = mc.clearContext.bind(mc);
    mc.clearContext = function () {
      const result = origClearContext();
      __aiInspector.emit("CONTEXT_CLEARED", { ts: Date.now() });
      return result;
    };
  }
})();

// Declare navigator.modelContext for TypeScript
// Per WebIDL: partial interface Navigator { readonly attribute ModelContext modelContext; }
declare global {
  interface Navigator {
    modelContext?: {
      registerTool: (tool: Record<string, unknown>) => void;
      unregisterTool: (name: string) => void;
      provideContext: (params: { tools: Array<Record<string, unknown>> }) => void;
      clearContext: () => void;
    };
  }
}
