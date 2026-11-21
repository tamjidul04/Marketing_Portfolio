'use client';

import { useRef, type ReactNode } from 'react';
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
  type Announcements, type DragEndEvent, type DraggableAttributes, type DraggableSyntheticListeners,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

export type HandleProps = { attributes: DraggableAttributes; listeners: DraggableSyntheticListeners; label: string };

/** The ⠿ grip. Only the grip starts a drag, so the rest of the row (and the page) still scrolls on phones. */
export function DragHandle({ attributes, listeners, label }: HandleProps) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      aria-label={`Reorder ${label}`}
      className="grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-xl border border-line bg-card text-muted transition hover:border-accent hover:text-foreground active:cursor-grabbing"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" />
        <circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
      </svg>
    </button>
  );
}

function Item({ id, label, children }: { id: string; label: string; children: (h: HandleProps, dragging: boolean) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined, position: 'relative' }}
      className={isDragging ? 'opacity-90 shadow-[0_12px_30px_rgba(27,42,74,.18)] rounded-2xl' : undefined}
    >
      {children({ attributes, listeners, label }, isDragging)}
    </li>
  );
}

/**
 * A vertical list you can reorder by mouse, touch (drag the grip) or keyboard
 * (focus the grip, Space to pick up, arrow keys to move, Space to drop, Escape to cancel).
 * Screen readers hear what is happening. `onMove` receives the new order of ids.
 */
export function SortableList<T extends { id: string }>({
  items, labelOf, onMove, children, className,
}: {
  items: T[];
  labelOf: (item: T) => string;
  onMove: (orderedIds: string[]) => void;
  children: (item: T, handle: HandleProps, dragging: boolean) => ReactNode;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map((i) => i.id);
  const name = (id: unknown) => {
    const it = items.find((i) => i.id === id);
    return it ? `“${labelOf(it)}”` : 'item';
  };
  const pos = (id: unknown) => ids.indexOf(String(id)) + 1;

  // the item is "over" itself right after pick-up; skip that so "Picked up …" is what gets read out
  const justPicked = useRef(false);
  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      justPicked.current = true;
      return `Picked up ${name(active.id)}, position ${pos(active.id)} of ${ids.length}.`;
    },
    onDragOver: ({ active, over }) => {
      if (justPicked.current && over?.id === active.id) {
        justPicked.current = false;
        return undefined;
      }
      justPicked.current = false;
      return over ? `${name(active.id)} is over position ${pos(over.id)} of ${ids.length}.` : `${name(active.id)} is no longer over the list.`;
    },
    onDragEnd: ({ active, over }) => (over ? `${name(active.id)} dropped at position ${pos(over.id)} of ${ids.length}.` : `${name(active.id)} dropped.`),
    onDragCancel: ({ active }) => `Moving cancelled. ${name(active.id)} is back where it was.`,
  };

  function end(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const next = ids.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onMove(next);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={end}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: 'To reorder, press Space to pick up. Use the arrow keys to move, Space to drop, or Escape to cancel.' },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={className}>
          {items.map((item) => (
            <Item key={item.id} id={item.id} label={labelOf(item)}>
              {(h, dragging) => children(item, h, dragging)}
            </Item>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
