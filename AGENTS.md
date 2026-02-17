# ai-inspector-extension

Chrome DevTools extension for window.ai + WebMCP introspection.

## Architecture
- Content scripts: MAIN world (ai-interceptor.ts) + ISOLATED world (bridge.ts)
- Communication: window.postMessage -> chrome.runtime.sendMessage -> background
- Panel connects to background via chrome.runtime.connect() port
- State: React Context + useReducer in panel, plain Map in background
- NO chrome.debugger API needed

## Key APIs (from WebMCP spec)
- navigator.modelContextTesting.listTools() -> Array<{name, description, inputSchema: string}>
- navigator.modelContextTesting.executeTool(name: string, args: string) -> Promise<string|null>
- navigator.modelContextTesting.registerToolsChangedCallback(cb)
- Window events: 'toolactivated', 'toolcancel'

## Build
- 3 Vite configs: HTML pages (vite.config.ts), content scripts IIFE (vite.config.content.ts), background IIFE (vite.config.background.ts)
- Content scripts MUST be IIFE format (not ESM) — required for Chrome extension content scripts
- MAIN world script injected via chrome.scripting.executeScript({ world: 'MAIN' })
- `pnpm build` runs all 3 builds + copies manifest.json to dist/

## Project structure
- `content/ai-interceptor.ts` — MAIN world monkey-patching
- `content/bridge.ts` — ISOLATED world event relay
- `background/` — Service worker with EventStore and TabManager
- `panel/` — React app with Tools, Timeline, AI Sessions tabs
- `devtools/` — DevTools page entry (chrome.devtools.panels.create)
- `popup/` — Status popup
