async function updateStats() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    const response = await chrome.tabs.sendMessage(tab.id, { action: "LIST_TOOLS" });
    if (response?.tools) {
      const el = document.getElementById("toolCount");
      if (el) el.textContent = String(response.tools.length);
    }
  } catch {
    // Tab may not have content script loaded
  }
}

updateStats();
