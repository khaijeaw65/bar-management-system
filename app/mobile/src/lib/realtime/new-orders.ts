import { useSyncExternalStore } from 'react';

/** Highlight on a new card, ~3 s (brief §7). */
export const HIGHLIGHT_MS = 3000;

interface NewOrdersSnapshot {
  highlighted: ReadonlySet<string>;
  /** New orders not yet seen on the ออเดอร์ tab (tab badge, queue·5). */
  unseen: number;
}

let snapshot: NewOrdersSnapshot = { highlighted: new Set(), unseen: 0 };
const listeners = new Set<() => void>();
const timers = new Set<ReturnType<typeof setTimeout>>();

function publish(next: NewOrdersSnapshot): void {
  snapshot = next;
  listeners.forEach((l) => l());
}

export function markNewOrder(ticketIds: readonly string[]): void {
  publish({
    highlighted: new Set([...snapshot.highlighted, ...ticketIds]),
    unseen: snapshot.unseen + 1,
  });
  const timer = setTimeout(() => {
    timers.delete(timer);
    const highlighted = new Set(snapshot.highlighted);
    ticketIds.forEach((id) => highlighted.delete(id));
    publish({ ...snapshot, highlighted });
  }, HIGHLIGHT_MS);
  timers.add(timer);
}

export function clearUnseenOrders(): void {
  if (snapshot.unseen > 0) publish({ ...snapshot, unseen: 0 });
}

export function resetNewOrders(): void {
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  publish({ highlighted: new Set(), unseen: 0 });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useNewOrders(): NewOrdersSnapshot {
  return useSyncExternalStore(subscribe, () => snapshot);
}
