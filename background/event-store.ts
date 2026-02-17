/**
 * Per-tab in-memory event storage.
 */

interface StoredEvent {
  type: string;
  [key: string]: unknown;
}

export class EventStore {
  private store = new Map<number, StoredEvent[]>();

  add(tabId: number, event: StoredEvent): void {
    if (!this.store.has(tabId)) {
      this.store.set(tabId, []);
    }
    this.store.get(tabId)!.push(event);
  }

  getAll(tabId: number): StoredEvent[] {
    return this.store.get(tabId) ?? [];
  }

  clear(tabId: number): void {
    this.store.set(tabId, []);
  }

  clearAll(): void {
    this.store.clear();
  }
}
