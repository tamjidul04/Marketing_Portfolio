'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/admin/icons';
import { NavList } from '@/components/admin/nav-list';

/** Top bar + slide-out menu for screens narrower than 1024px. `footer` is server-rendered (sign-out etc.). */
export function MobileBar({ brand, footer, badges }: { brand: ReactNode; footer: ReactNode; badges?: Record<string, number> }) {
  const pathname = usePathname();
  // Remember WHICH page the menu was opened on: when the page changes, the menu is closed automatically.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null);

  // close on Escape; lock page scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenOn(null);
    addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-card/90 px-4 backdrop-blur">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={Object.values(badges ?? {}).some((n) => n > 0) ? 'Open menu (you have new messages)' : 'Open menu'}
          aria-expanded={open}
          aria-controls="admin-drawer"
          className="relative grid size-11 place-items-center rounded-xl border border-line bg-card"
        >
          <Icon name="menu" />
          {Object.values(badges ?? {}).some((n) => n > 0) && (
            <span className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-accent ring-2 ring-card" aria-hidden />
          )}
        </button>
      </div>

      {open && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} aria-hidden />}
      <aside
        id="admin-drawer"
        aria-label="Menu"
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-[18rem] max-w-[85vw] flex-col gap-6 overflow-y-auto bg-navy p-4 pb-6 text-white transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        {...(!open ? { inert: true } : {})}
      >
        <div className="flex items-center justify-between">
          {brand}
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid size-11 place-items-center rounded-xl border border-white/15">
            <Icon name="close" />
          </button>
        </div>
        <NavList onNavigate={() => setOpen(false)} badges={badges} />
        <div className="mt-auto">{footer}</div>
      </aside>
    </div>
  );
}
