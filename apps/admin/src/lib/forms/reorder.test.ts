import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_REORDER, moveIndex, planReorder } from './reorder.ts';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const rows = [1, 2, 3, 4].map((n) => ({ id: id(n), sort_order: n }));

test('only rows whose position changed are written, numbered 1..n', () => {
  const r = planReorder(rows, [id(1), id(3), id(2), id(4)]);
  assert.ok(r.ok);
  assert.deepEqual(r.updates, [{ id: id(3), sort_order: 2 }, { id: id(2), sort_order: 3 }]);
});

test('moving the last item to the top shifts everyone', () => {
  const r = planReorder(rows, [id(4), id(1), id(2), id(3)]);
  assert.ok(r.ok);
  assert.equal(r.updates.length, 4);
});

test('same order = nothing to write', () => {
  const r = planReorder(rows, rows.map((x) => x.id));
  assert.ok(r.ok && r.updates.length === 0);
});

test('messy old numbers (gaps, duplicates) are cleaned up to 1..n', () => {
  const messy = [{ id: id(1), sort_order: 0 }, { id: id(2), sort_order: 0 }, { id: id(3), sort_order: 10 }];
  const r = planReorder(messy, [id(1), id(2), id(3)]);
  assert.ok(r.ok);
  assert.deepEqual(r.updates, [{ id: id(1), sort_order: 1 }, { id: id(2), sort_order: 2 }, { id: id(3), sort_order: 3 }]);
});

test('refuses anything that is not exactly the same set of items', () => {
  const cases: [string, unknown][] = [
    ['missing one', [id(1), id(2), id(3)]],
    ['an extra one', [id(1), id(2), id(3), id(4), id(5)]],
    ['a foreign id', [id(1), id(2), id(3), id(9)]],
    ['a duplicate', [id(1), id(1), id(2), id(3)]],
    ['not an array', 'nope'],
    ['not uuids', ['1', '2', '3', '4']],
    ['injection attempt', [id(1), id(2), id(3), "x'); drop table faqs;--"]],
    ['numbers instead of strings', [1, 2, 3, 4]],
  ];
  for (const [name, input] of cases) assert.equal(planReorder(rows, input).ok, false, name);
});

test('refuses absurdly long lists', () => {
  const many = Array.from({ length: MAX_REORDER + 1 }, (_, i) => id(i + 1));
  assert.equal(planReorder(many.map((x, i) => ({ id: x, sort_order: i })), many).ok, false);
});

test('moveIndex moves one item and leaves the original untouched', () => {
  const list = ['a', 'b', 'c', 'd'];
  assert.deepEqual(moveIndex(list, 3, 0), ['d', 'a', 'b', 'c']);
  assert.deepEqual(moveIndex(list, 0, 2), ['b', 'c', 'a', 'd']);
  assert.deepEqual(moveIndex(list, 1, 9), list);
  assert.deepEqual(list, ['a', 'b', 'c', 'd']);
});
