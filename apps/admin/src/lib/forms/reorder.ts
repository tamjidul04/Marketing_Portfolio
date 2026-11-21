// Pure logic for saving a new order (no framework imports, unit-tested).
// The browser sends the full list of ids in their new order. The server only accepts it if it is
// exactly the same set of items it already has (no extras, no missing, no duplicates), then writes
// sort_order = 1..n for the rows whose position actually changed.

export type OrderRow = { id: string; sort_order: number };
export type ReorderPlan = { ok: true; updates: OrderRow[] } | { ok: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MAX_REORDER = 500;

export function planReorder(current: OrderRow[], ordered: unknown): ReorderPlan {
  if (!Array.isArray(ordered) || ordered.length > MAX_REORDER || !ordered.every((x) => typeof x === 'string' && UUID_RE.test(x))) {
    return { ok: false, error: 'invalid order' };
  }
  const ids = ordered as string[];
  if (new Set(ids).size !== ids.length) return { ok: false, error: 'duplicate items' };
  if (ids.length !== current.length) return { ok: false, error: 'the list changed; please reload' };
  const known = new Map(current.map((r) => [r.id, r.sort_order]));
  if (!ids.every((id) => known.has(id))) return { ok: false, error: 'the list changed; please reload' };

  const updates: OrderRow[] = [];
  ids.forEach((id, i) => {
    if (known.get(id) !== i + 1) updates.push({ id, sort_order: i + 1 });
  });
  return { ok: true, updates };
}

/** Move one element of an array to another index (same as dnd-kit's arrayMove, kept here for tests). */
export function moveIndex<T>(list: T[], from: number, to: number): T[] {
  const out = list.slice();
  if (from < 0 || from >= out.length || to < 0 || to >= out.length) return out;
  const [item] = out.splice(from, 1);
  out.splice(to, 0, item);
  return out;
}
